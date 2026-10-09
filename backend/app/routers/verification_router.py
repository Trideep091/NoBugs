import json
import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Incident, LogSession
from ..auth import get_current_user
from ..pipeline.verification import verify_fix_comparison

router = APIRouter(prefix="/verification", tags=["Fix Verification"])

SAMPLE_POSTFIX_PATH = "backend/data/sample_postfix_logs.log"

@router.post("/verify")
async def verify_fix(
    baseline_session_id: str = Form(...),
    postfix_logs: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    content = ""
    if file:
        file_bytes = await file.read()
        content = file_bytes.decode("utf-8", errors="replace")
    elif postfix_logs:
        content = postfix_logs
    else:
        raise HTTPException(status_code=400, detail="No post-fix logs provided.")

    # Retrieve baseline incidents
    baseline_incidents = (
        db.query(Incident)
        .filter(Incident.session_id == baseline_session_id)
        .all()
    )
    if not baseline_incidents:
        raise HTTPException(status_code=404, detail="Baseline session not found or has no incidents.")

    formatted_baseline = []
    for inc in baseline_incidents:
        formatted_baseline.append({
            "id": inc.id,
            "template": inc.template,
            "priority": inc.priority,
            "score": inc.score,
            "log_count": inc.log_count,
            "services": json.loads(inc.services)
        })

    result = verify_fix_comparison(formatted_baseline, content)
    result["baseline_session_id"] = baseline_session_id

    return result


@router.get("/sample-postfix")
def get_sample_postfix():
    if not os.path.exists(SAMPLE_POSTFIX_PATH):
        raise HTTPException(status_code=404, detail="Sample post-fix log file not found.")
    with open(SAMPLE_POSTFIX_PATH, "r", encoding="utf-8") as f:
        return {"content": f.read()}
