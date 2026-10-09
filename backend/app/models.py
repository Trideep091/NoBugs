import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    sessions = relationship("LogSession", back_populates="user", cascade="all, delete-orphan")
    ledger_entries = relationship("IncidentLedger", back_populates="creator")


class LogSession(Base):
    __tablename__ = "log_sessions"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), default="Untitled Ingestion")
    total_lines = Column(Integer, default=0)
    parsed_lines = Column(Integer, default=0)
    unparsed_lines = Column(Integer, default=0)
    redacted_count = Column(Integer, default=0)
    services_detected = Column(Text, default="[]")  # JSON array
    time_range_start = Column(String(64), nullable=True)
    time_range_end = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="sessions")
    incidents = relationship("Incident", back_populates="session", cascade="all, delete-orphan")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("log_sessions.id"), nullable=False, index=True)
    cluster_id = Column(Integer, index=True)
    template = Column(Text, nullable=False)
    priority = Column(String(20), default="Mild", index=True)  # Critical, High, Mild, Low
    score = Column(Float, default=0.0)
    score_breakdown = Column(Text, default="{}")  # JSON breakdown dict
    log_count = Column(Integer, default=1)
    services = Column(Text, default="[]")  # JSON list
    first_seen = Column(String(64), nullable=True)
    last_seen = Column(String(64), nullable=True)
    first_seen_epoch = Column(Float, default=0.0)
    last_seen_epoch = Column(Float, default=0.0)
    trend = Column(String(50), default="ongoing & flat")  # "ongoing & accelerating", "ongoing & flat", "resolved/decaying"
    error_rate_per_min = Column(Float, default=0.0)
    doubling_time_sec = Column(Float, nullable=True)
    time_to_saturation = Column(String(100), default="insufficient data")
    sample_lines = Column(Text, default="[]")  # JSON list of samples
    ai_analysis = Column(Text, nullable=True)  # JSON Claude analysis
    causality_parents = Column(Text, default="[]")  # JSON list of inferred parent incident IDs/reasons
    causality_children = Column(Text, default="[]")  # JSON list
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    session = relationship("LogSession", back_populates="incidents")
    fingerprints = relationship("IncidentFingerprint", back_populates="incident", cascade="all, delete-orphan")


class IncidentLedger(Base):
    __tablename__ = "incident_ledger"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    problem = Column(Text, nullable=False)
    root_cause = Column(Text, nullable=False)
    fix_applied = Column(Text, nullable=False)
    services_affected = Column(Text, default="[]")  # JSON list
    outcome = Column(String(50), default="Resolved")  # Resolved, Mitigated, Monitoring
    fingerprint_hash = Column(String(128), nullable=True, index=True)
    incident_id = Column(Integer, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="ledger_entries")


class IncidentFingerprint(Base):
    __tablename__ = "incident_fingerprints"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    session_id = Column(String(64), nullable=False, index=True)
    template_set = Column(Text, default="[]")  # JSON list of template signatures
    sequence_order = Column(Text, default="[]")  # JSON sequence of service error onset
    services = Column(Text, default="[]")
    timing_pattern = Column(Text, default="{}")
    signature_hash = Column(String(128), index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    incident = relationship("Incident", back_populates="fingerprints")
