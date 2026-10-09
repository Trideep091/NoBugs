import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db, SessionLocal
from ..models import User, IncidentLedger
from ..schemas import LedgerCreate, LedgerOut
from ..auth import get_current_user

router = APIRouter(prefix="/ledger", tags=["Incident Ledger"])

def seed_sample_ledger():
    db = SessionLocal()
    try:
        count = db.query(IncidentLedger).count()
        if count == 0:
            demo_user = db.query(User).first()
            user_id = demo_user.id if demo_user else 1

            entry1 = IncidentLedger(
                title="Q3 Peak Traffic DB Pool Starvation Incident",
                problem="High-concurrency checkout bursts exhausted database connection leases, causing connection pool acquisition timeouts after 5000ms.",
                root_cause="HikariCP pool max_connections was hard-coded to 20 connections on the payment-svc deployment while worker threads scaled to 80.",
                fix_applied="Increased postgres max_connections to 60, updated HikariCP maximumPoolSize to 50 in Helm values, and tuned idleTimeout to 30000ms.",
                services_affected=json.dumps(["db", "payment", "checkout"]),
                outcome="Resolved",
                created_by_user_id=user_id
            )

            entry2 = IncidentLedger(
                title="Transient Stripe RPC Latency Breaker Trip",
                problem="Payment provider circuit breaker tripped to OPEN state during transient replica failover.",
                root_cause="Circuit breaker error threshold of 40% was too sensitive for momentary network hiccups.",
                fix_applied="Bumped breaker threshold to 75% error rate with a minimum of 20 requests in the rolling window before tripping.",
                services_affected=json.dumps(["payment", "api-gateway"]),
                outcome="Resolved",
                created_by_user_id=user_id
            )

            db.add(entry1)
            db.add(entry2)
            db.commit()
    finally:
        db.close()

seed_sample_ledger()

@router.get("", response_model=List[LedgerOut])
def list_ledger_entries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entries = db.query(IncidentLedger).order_by(IncidentLedger.created_at.desc()).all()
    formatted = []
    for e in entries:
        formatted.append({
            "id": e.id,
            "title": e.title,
            "problem": e.problem,
            "root_cause": e.root_cause,
            "fix_applied": e.fix_applied,
            "services_affected": json.loads(e.services_affected),
            "outcome": e.outcome,
            "incident_id": e.incident_id,
            "created_at": e.created_at,
            "created_by_user_id": e.created_by_user_id
        })
    return formatted

@router.post("", response_model=LedgerOut)
def create_ledger_entry(
    entry_in: LedgerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = IncidentLedger(
        title=entry_in.title,
        problem=entry_in.problem,
        root_cause=entry_in.root_cause,
        fix_applied=entry_in.fix_applied,
        services_affected=json.dumps(entry_in.services_affected),
        outcome=entry_in.outcome,
        incident_id=entry_in.incident_id,
        created_by_user_id=current_user.id
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {
        "id": entry.id,
        "title": entry.title,
        "problem": entry.problem,
        "root_cause": entry.root_cause,
        "fix_applied": entry.fix_applied,
        "services_affected": json.loads(entry.services_affected),
        "outcome": entry.outcome,
        "incident_id": entry.incident_id,
        "created_at": entry.created_at,
        "created_by_user_id": entry.created_by_user_id
    }
