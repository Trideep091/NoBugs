from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, SessionLocal
from .models import User
from .auth import get_password_hash
from .routers import auth_router, logs_router, incidents_router, ledger_router, verification_router

# Create DB tables
Base.metadata.create_all(bind=engine)

# Auto-seed default on-call demo user if not present
def seed_default_user():
    db = SessionLocal()
    try:
        demo_email = "oncall@nobugs.io"
        user = db.query(User).filter(User.email == demo_email).first()
        if not user:
            demo_user = User(
                name="3 AM Engineer",
                email=demo_email,
                hashed_password=get_password_hash("oncall3am")
            )
            db.add(demo_user)
            db.commit()
    finally:
        db.close()

seed_default_user()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="NoBugs: Automated Log Intelligence and Incident Root-Cause Analysis"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(logs_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(incidents_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(ledger_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(verification_router.router, prefix=settings.API_V1_PREFIX)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "production-ready"
    }
