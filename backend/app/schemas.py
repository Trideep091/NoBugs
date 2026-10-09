from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# --- Session & Stats Schemas ---
class SessionStatsOut(BaseModel):
    session_id: str
    title: str
    total_lines: int
    parsed_lines: int
    unparsed_lines: int
    redacted_count: int
    services_detected: List[str]
    time_range_start: Optional[str]
    time_range_end: Optional[str]
    incident_count: int

# --- Incident Schemas ---
class IncidentOut(BaseModel):
    id: int
    session_id: str
    cluster_id: int
    template: str
    priority: str
    score: float
    score_breakdown: Dict[str, Any]
    log_count: int
    services: List[str]
    first_seen: Optional[str]
    last_seen: Optional[str]
    trend: str
    error_rate_per_min: float
    doubling_time_sec: Optional[float]
    time_to_saturation: str
    sample_lines: List[Dict[str, Any]]
    ai_analysis: Optional[Dict[str, Any]]
    causality_parents: List[Dict[str, Any]]
    causality_children: List[Dict[str, Any]]
    similar_ledger_entry: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# --- Ledger Schemas ---
class LedgerCreate(BaseModel):
    title: str
    problem: str
    root_cause: str
    fix_applied: str
    services_affected: List[str]
    outcome: str = "Resolved"
    incident_id: Optional[int] = None

class LedgerOut(BaseModel):
    id: int
    title: str
    problem: str
    root_cause: str
    fix_applied: str
    services_affected: List[str]
    outcome: str
    incident_id: Optional[int]
    created_at: datetime
    created_by_user_id: int

    class Config:
        from_attributes = True

# --- Verification Schemas ---
class VerificationRequest(BaseModel):
    baseline_session_id: str
    verification_logs: str

class VerificationResultOut(BaseModel):
    baseline_session_id: str
    before_error_count: int
    after_error_count: int
    verdict: str  # "RESOLVED", "DECREASED", "PERSISTENT", "REGRESSED", "NEW_PATTERNS_DETECTED"
    summary: str
    pattern_comparison: List[Dict[str, Any]]
    new_patterns: List[Dict[str, Any]]
