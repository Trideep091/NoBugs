import uuid
import json
import os
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, LogSession, Incident
from ..auth import get_current_user
from ..pipeline.privacy import redact_sensitive_text
from ..pipeline.parser import parse_log_line
from ..pipeline.clustering import cluster_logs
from ..pipeline.scoring import score_and_rank_clusters

router = APIRouter(prefix="/logs", tags=["Logs & Ingestion"])

SAMPLE_LOG_PATH = "backend/data/sample_incident_10k.log"

@router.post("/ingest")
async def ingest_logs(
    file: Optional[UploadFile] = File(None),
    raw_logs: Optional[str] = Form(None),
    title: Optional[str] = Form("Log Ingestion"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ingests raw log lines from either file upload or pasted text.
    Redacts secrets, parses records, clusters templates via Drain3, scores impact,
    and stores records in SQLite.
    """
    content = ""
    if file:
        file_bytes = await file.read()
        content = file_bytes.decode("utf-8", errors="replace")
        if not title or title == "Log Ingestion":
            title = file.filename
    elif raw_logs:
        content = raw_logs
    else:
        raise HTTPException(status_code=400, detail="No log content provided via file or text.")

    lines = [line for line in content.splitlines() if line.strip()]
    if not lines:
        raise HTTPException(status_code=400, detail="Provided log content is empty.")

    session_id = str(uuid.uuid4())

    # 1. Privacy Shield & Parsing
    parsed_logs = []
    total_redacted = 0
    all_redact_breakdown = {"tokens": 0, "jwts": 0, "passwords": 0, "emails": 0, "ips": 0, "cards": 0}
    services_detected = set()

    for line in lines:
        redacted_line, r_count, breakdown = redact_sensitive_text(line)
        total_redacted += r_count
        for k, v in breakdown.items():
            all_redact_breakdown[k] += v

        parsed = parse_log_line(redacted_line)
        if parsed:
            parsed_logs.append(parsed)
            if parsed["service"] and parsed["service"] != "unknown":
                services_detected.add(parsed["service"])

    # 2. Drain3 Clustering
    raw_clusters = cluster_logs(parsed_logs)

    # 3. Impact Scoring & Trend Classification
    ranked_clusters = score_and_rank_clusters(raw_clusters)

    # 4. Save to Database
    time_start = ranked_clusters[-1]["first_seen"] if ranked_clusters else None
    time_end = ranked_clusters[0]["last_seen"] if ranked_clusters else None

    log_session = LogSession(
        id=session_id,
        user_id=current_user.id,
        title=title or f"Ingestion ({len(lines)} lines)",
        total_lines=len(lines),
        parsed_lines=len(parsed_logs),
        unparsed_lines=len(lines) - len(parsed_logs),
        redacted_count=total_redacted,
        services_detected=json.dumps(sorted(list(services_detected))),
        time_range_start=time_start,
        time_range_end=time_end
    )
    db.add(log_session)

    incident_entities = []
    for c in ranked_clusters:
        incident = Incident(
            session_id=session_id,
            cluster_id=c["cluster_id"],
            template=c["template"],
            priority=c["priority"],
            score=c["score"],
            score_breakdown=json.dumps(c["score_breakdown"]),
            log_count=c["log_count"],
            services=json.dumps(c["services"]),
            first_seen=c["first_seen"],
            last_seen=c["last_seen"],
            first_seen_epoch=c["first_seen_epoch"],
            last_seen_epoch=c["last_seen_epoch"],
            trend=c["trend"],
            error_rate_per_min=c["error_rate_per_min"],
            doubling_time_sec=c["doubling_time_sec"],
            time_to_saturation=c["time_to_saturation"],
            sample_lines=json.dumps(c["sample_lines"]),
            causality_parents=json.dumps([]),
            causality_children=json.dumps([])
        )
        db.add(incident)
        incident_entities.append(incident)

    db.commit()

    # Prepare response
    db.refresh(log_session)
    formatted_incidents = []
    for inc in incident_entities:
        db.refresh(inc)
        formatted_incidents.append({
            "id": inc.id,
            "session_id": inc.session_id,
            "cluster_id": inc.cluster_id,
            "template": inc.template,
            "priority": inc.priority,
            "score": inc.score,
            "score_breakdown": json.loads(inc.score_breakdown),
            "log_count": inc.log_count,
            "services": json.loads(inc.services),
            "first_seen": inc.first_seen,
            "last_seen": inc.last_seen,
            "trend": inc.trend,
            "error_rate_per_min": inc.error_rate_per_min,
            "doubling_time_sec": inc.doubling_time_sec,
            "time_to_saturation": inc.time_to_saturation,
            "sample_lines": json.loads(inc.sample_lines),
            "ai_analysis": None
        })

    return {
        "session": {
            "session_id": session_id,
            "title": log_session.title,
            "total_lines": len(lines),
            "parsed_lines": len(parsed_logs),
            "unparsed_lines": len(lines) - len(parsed_logs),
            "redacted_count": total_redacted,
            "redaction_breakdown": all_redact_breakdown,
            "services_detected": sorted(list(services_detected)),
            "time_range_start": time_start,
            "time_range_end": time_end,
            "incident_count": len(ranked_clusters)
        },
        "incidents": formatted_incidents
    }


@router.post("/ingest-sample")
async def ingest_sample_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Directly loads the 10,000-line realistic multi-service cascade failure scenario.
    """
    if not os.path.exists(SAMPLE_LOG_PATH):
        from ...scripts.generate_sample_logs import generate_logs
        generate_logs(10000, SAMPLE_LOG_PATH)

    with open(SAMPLE_LOG_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    lines = [line for line in content.splitlines() if line.strip()]
    session_id = str(uuid.uuid4())

    parsed_logs = []
    total_redacted = 0
    all_redact_breakdown = {"tokens": 0, "jwts": 0, "passwords": 0, "emails": 0, "ips": 0, "cards": 0}
    services_detected = set()

    for line in lines:
        redacted_line, r_count, breakdown = redact_sensitive_text(line)
        total_redacted += r_count
        for k, v in breakdown.items():
            all_redact_breakdown[k] += v

        parsed = parse_log_line(redacted_line)
        if parsed:
            parsed_logs.append(parsed)
            if parsed["service"] and parsed["service"] != "unknown":
                services_detected.add(parsed["service"])

    raw_clusters = cluster_logs(parsed_logs)
    ranked_clusters = score_and_rank_clusters(raw_clusters)

    time_start = ranked_clusters[-1]["first_seen"] if ranked_clusters else None
    time_end = ranked_clusters[0]["last_seen"] if ranked_clusters else None

    log_session = LogSession(
        id=session_id,
        user_id=current_user.id,
        title="3 AM Incident Cascade (10k multi-service logs)",
        total_lines=len(lines),
        parsed_lines=len(parsed_logs),
        unparsed_lines=len(lines) - len(parsed_logs),
        redacted_count=total_redacted,
        services_detected=json.dumps(sorted(list(services_detected))),
        time_range_start=time_start,
        time_range_end=time_end
    )
    db.add(log_session)

    incident_entities = []
    for c in ranked_clusters:
        incident = Incident(
            session_id=session_id,
            cluster_id=c["cluster_id"],
            template=c["template"],
            priority=c["priority"],
            score=c["score"],
            score_breakdown=json.dumps(c["score_breakdown"]),
            log_count=c["log_count"],
            services=json.dumps(c["services"]),
            first_seen=c["first_seen"],
            last_seen=c["last_seen"],
            first_seen_epoch=c["first_seen_epoch"],
            last_seen_epoch=c["last_seen_epoch"],
            trend=c["trend"],
            error_rate_per_min=c["error_rate_per_min"],
            doubling_time_sec=c["doubling_time_sec"],
            time_to_saturation=c["time_to_saturation"],
            sample_lines=json.dumps(c["sample_lines"]),
            causality_parents=json.dumps([]),
            causality_children=json.dumps([])
        )
        db.add(incident)
        incident_entities.append(incident)

    db.commit()

    db.refresh(log_session)
    formatted_incidents = []
    for inc in incident_entities:
        db.refresh(inc)
        formatted_incidents.append({
            "id": inc.id,
            "session_id": inc.session_id,
            "cluster_id": inc.cluster_id,
            "template": inc.template,
            "priority": inc.priority,
            "score": inc.score,
            "score_breakdown": json.loads(inc.score_breakdown),
            "log_count": inc.log_count,
            "services": json.loads(inc.services),
            "first_seen": inc.first_seen,
            "last_seen": inc.last_seen,
            "trend": inc.trend,
            "error_rate_per_min": inc.error_rate_per_min,
            "doubling_time_sec": inc.doubling_time_sec,
            "time_to_saturation": inc.time_to_saturation,
            "sample_lines": json.loads(inc.sample_lines),
            "ai_analysis": None
        })

    return {
        "session": {
            "session_id": session_id,
            "title": log_session.title,
            "total_lines": len(lines),
            "parsed_lines": len(parsed_logs),
            "unparsed_lines": 0,
            "redacted_count": total_redacted,
            "redaction_breakdown": all_redact_breakdown,
            "services_detected": sorted(list(services_detected)),
            "time_range_start": time_start,
            "time_range_end": time_end,
            "incident_count": len(ranked_clusters)
        },
        "incidents": formatted_incidents
    }


@router.get("/sample")
def get_sample_logs_content():
    """
    Returns the raw text of the 10,000-line sample log.
    """
    if not os.path.exists(SAMPLE_LOG_PATH):
        from ...scripts.generate_sample_logs import generate_logs
        generate_logs(10000, SAMPLE_LOG_PATH)
    with open(SAMPLE_LOG_PATH, "r", encoding="utf-8") as f:
        return {"content": f.read()}


@router.get("/sessions")
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(LogSession)
        .filter(LogSession.user_id == current_user.id)
        .order_by(LogSession.created_at.desc())
        .limit(10)
        .all()
    )
    return [
        {
            "id": s.id,
            "title": s.title,
            "total_lines": s.total_lines,
            "parsed_lines": s.parsed_lines,
            "redacted_count": s.redacted_count,
            "services_detected": json.loads(s.services_detected),
            "created_at": s.created_at.isoformat()
        }
        for s in sessions
    ]


@router.get("/session/{session_id}")
def get_session_details(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(LogSession).filter(LogSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Log session not found.")

    incidents = (
        db.query(Incident)
        .filter(Incident.session_id == session_id)
        .order_by(Incident.score.desc())
        .all()
    )

    return {
        "session": {
            "session_id": session.id,
            "title": session.title,
            "total_lines": session.total_lines,
            "parsed_lines": session.parsed_lines,
            "unparsed_lines": session.unparsed_lines,
            "redacted_count": session.redacted_count,
            "services_detected": json.loads(session.services_detected),
            "time_range_start": session.time_range_start,
            "time_range_end": session.time_range_end,
            "incident_count": len(incidents)
        },
        "incidents": [
            {
                "id": inc.id,
                "session_id": inc.session_id,
                "cluster_id": inc.cluster_id,
                "template": inc.template,
                "priority": inc.priority,
                "score": inc.score,
                "score_breakdown": json.loads(inc.score_breakdown),
                "log_count": inc.log_count,
                "services": json.loads(inc.services),
                "first_seen": inc.first_seen,
                "last_seen": inc.last_seen,
                "trend": inc.trend,
                "error_rate_per_min": inc.error_rate_per_min,
                "doubling_time_sec": inc.doubling_time_sec,
                "time_to_saturation": inc.time_to_saturation,
                "sample_lines": json.loads(inc.sample_lines),
                "ai_analysis": json.loads(inc.ai_analysis) if inc.ai_analysis else None
            }
            for inc in incidents
        ]
    }
