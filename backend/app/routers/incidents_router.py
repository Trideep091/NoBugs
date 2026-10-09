import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Incident, LogSession, IncidentLedger
from ..auth import get_current_user
from ..services.ai_investigator import investigate_incident_with_ai
from ..pipeline.causality import infer_causality_and_blast_radius
from ..pipeline.fingerprinting import match_fingerprint_to_ledger
from ..pipeline.verification import detect_early_warning_signals
from ..pipeline.parser import parse_log_line

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("/{incident_id}/ai-investigation")
async def get_ai_investigation(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    # Return cached if already performed
    if incident.ai_analysis:
        return json.loads(incident.ai_analysis)

    services = json.loads(incident.services)
    sample_lines = json.loads(incident.sample_lines)

    analysis = await investigate_incident_with_ai(
        template=incident.template,
        services=services,
        first_seen=incident.first_seen or "03:03:00",
        log_count=incident.log_count,
        sample_lines=sample_lines
    )

    incident.ai_analysis = json.dumps(analysis)
    db.commit()

    return analysis


@router.post("/{incident_id}/challenge")
async def challenge_ai_theory(
    incident_id: int,
    challenge_focus: Optional[str] = Body(None, embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    services = json.loads(incident.services)
    sample_lines = json.loads(incident.sample_lines)

    focus = challenge_focus or "Primary Database Connection Pool Starvation"

    analysis = await investigate_incident_with_ai(
        template=incident.template,
        services=services,
        first_seen=incident.first_seen or "03:03:00",
        log_count=incident.log_count,
        sample_lines=sample_lines,
        challenge_theory=focus
    )

    incident.ai_analysis = json.dumps(analysis)
    db.commit()

    return analysis


@router.get("/session/{session_id}/graph")
def get_session_causality_graph(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incidents = (
        db.query(Incident)
        .filter(Incident.session_id == session_id)
        .all()
    )
    if not incidents:
        raise HTTPException(status_code=404, detail="No incidents found for this session.")

    formatted = []
    for inc in incidents:
        formatted.append({
            "id": inc.id,
            "template": inc.template,
            "priority": inc.priority,
            "score": inc.score,
            "services": json.loads(inc.services),
            "log_count": inc.log_count,
            "first_seen": inc.first_seen,
            "first_seen_epoch": inc.first_seen_epoch,
            "last_seen_epoch": inc.last_seen_epoch,
            "trend": inc.trend,
            "sample_lines": json.loads(inc.sample_lines)
        })

    graph_data = infer_causality_and_blast_radius(formatted)
    return graph_data


@router.get("/session/{session_id}/early-warning")
def get_session_early_warnings(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incidents = db.query(Incident).filter(Incident.session_id == session_id).all()
    all_samples = []
    for inc in incidents:
        samples = json.loads(inc.sample_lines)
        all_samples.extend(samples)

    parsed = [parse_log_line(s.get("raw", s.get("message", ""))) for s in all_samples]
    parsed = [p for p in parsed if p]

    signals = detect_early_warning_signals(parsed)
    return {"early_warnings": signals}


@router.get("/{incident_id}/similar-ledger")
def get_similar_ledger(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    ledger_entries = db.query(IncidentLedger).all()
    entries_list = [
        {
            "id": e.id,
            "title": e.title,
            "problem": e.problem,
            "root_cause": e.root_cause,
            "fix_applied": e.fix_applied,
            "services_affected": json.loads(e.services_affected),
            "outcome": e.outcome
        }
        for e in ledger_entries
    ]

    services = json.loads(incident.services)
    match = match_fingerprint_to_ledger(incident.template, services, entries_list)
    return {"match": match}
