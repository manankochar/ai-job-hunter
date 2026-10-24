import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user, log_audit_event
from app.models.user import User, UserProfile, UserPreferences
from app.models.automation import AutomationSettings
from app.schemas.schemas import UserRegister, UserLogin, Token, GoogleAuthRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
async def register(req: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    existing = await db.execute(select(User).where(User.email == req.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Create User
    new_user = User(
        email=req.email.lower(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        is_active=True,
    )
    db.add(new_user)
    await db.flush()

    # Create associated default profile, preferences, and automation settings
    profile = UserProfile(
        user_id=new_user.id,
        onboarding_completed=False,
        onboarding_step=1
    )
    preferences = UserPreferences(
        user_id=new_user.id,
        target_titles=["Full Stack Engineer", "Software Engineer"],
        skills=["Python", "FastAPI", "React", "TypeScript", "PostgreSQL"],
        locations=["Remote"],
        remote_preference="any",
        min_match_score=70
    )
    automation_settings = AutomationSettings(
        user_id=new_user.id,
        is_globally_paused=False,
        auto_scan_enabled=True,
        auto_email_enabled=False,
        review_before_send=True
    )

    db.add_all([profile, preferences, automation_settings])
    await db.commit()

    token = create_access_token(new_user.id)
    await log_audit_event(db, new_user.id, "user.registered")

    return Token(
        access_token=token,
        user_id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        onboarding_completed=False
    )

@router.post("/login", response_model=Token)
async def login(req: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email.lower()))
    user = result.scalar_one_or_none()
    
    if not user or not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    # Fetch profile to check onboarding status
    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = prof_res.scalar_one_or_none()
    onboarding_done = profile.onboarding_completed if profile else False

    token = create_access_token(user.id)
    await log_audit_event(db, user.id, "user.login")

    return Token(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        onboarding_completed=onboarding_done
    )

@router.post("/google", response_model=Token)
async def google_auth(req: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """Google OAuth Sign-In or Demo Simulation"""
    email = req.email.lower() if req.email else "alex.developer@gmail.com"
    name = req.name or "Alex Developer"

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # Create Google-authenticated user
        user = User(
            email=email,
            full_name=name,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.flush()

        profile = UserProfile(user_id=user.id, onboarding_completed=False, onboarding_step=1)
        preferences = UserPreferences(
            user_id=user.id,
            target_titles=["Full Stack Engineer", "Backend Developer"],
            skills=["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Docker"],
            locations=["Remote", "San Francisco, CA"],
            remote_preference="any",
            min_match_score=70
        )
        automation_settings = AutomationSettings(user_id=user.id)
        db.add_all([profile, preferences, automation_settings])
        await db.commit()
    
    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = prof_res.scalar_one_or_none()
    onboarding_done = profile.onboarding_completed if profile else False

    token = create_access_token(user.id)
    await log_audit_event(db, user.id, "user.google_auth")

    return Token(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        onboarding_completed=onboarding_done
    )

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "gmail_connected": current_user.gmail_connected,
        "gmail_email": current_user.gmail_email,
        "onboarding_completed": profile.onboarding_completed if profile else False,
        "onboarding_step": profile.onboarding_step if profile else 1,
    }
