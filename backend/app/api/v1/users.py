from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import get_db
from app.core.deps import get_current_user, log_audit_event
from app.models.user import User, UserProfile, UserPreferences, AuditLog
from app.schemas.schemas import (
    UserProfileUpdate, UserProfileResponse,
    UserPreferencesUpdate, UserPreferencesResponse
)

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = res.scalar_one_or_none()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile

@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    req: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = res.scalar_one_or_none()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    await log_audit_event(db, current_user.id, "profile.updated")
    return profile

@router.get("/preferences", response_model=UserPreferencesResponse)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(UserPreferences).where(UserPreferences.user_id == current_user.id))
    prefs = res.scalar_one_or_none()
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)
    return prefs

@router.put("/preferences", response_model=UserPreferencesResponse)
async def update_preferences(
    req: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(UserPreferences).where(UserPreferences.user_id == current_user.id))
    prefs = res.scalar_one_or_none()
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prefs, field, value)

    await db.commit()
    await db.refresh(prefs)
    await log_audit_event(db, current_user.id, "preferences.updated")
    return prefs

@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Permanently deletes user account and cascades deletion across all
    resumes, preferences, applications, email messages, and stored data (GDPR compliant).
    """
    user_id = current_user.id
    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()
    return {"message": "User account and all associated personal data permanently deleted."}
