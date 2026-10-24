import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from app.core.database import get_db
from app.core.deps import get_current_user, log_audit_event
from app.models.user import User
from app.models.automation import AutomationSettings, AutomationRun, UiPathJob
from app.models.application import Application
from app.schemas.schemas import (
    AutomationSettingsUpdate, AutomationSettingsResponse,
    AutomationRunResponse, UiPathJobResponse, TriggerRpaRequest
)
from app.services.uipath_service import uipath_service
from app.services.job_sources.manager import job_discovery_manager

router = APIRouter(prefix="/automation", tags=["Automation Control Centre"])

@router.get("/settings", response_model=AutomationSettingsResponse)
async def get_automation_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(AutomationSettings).where(AutomationSettings.user_id == current_user.id))
    settings_obj = res.scalar_one_or_none()
    if not settings_obj:
        settings_obj = AutomationSettings(user_id=current_user.id)
        db.add(settings_obj)
        await db.commit()
        await db.refresh(settings_obj)
    return settings_obj

@router.put("/settings", response_model=AutomationSettingsResponse)
async def update_automation_settings(
    req: AutomationSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(AutomationSettings).where(AutomationSettings.user_id == current_user.id))
    settings_obj = res.scalar_one_or_none()
    if not settings_obj:
        settings_obj = AutomationSettings(user_id=current_user.id)
        db.add(settings_obj)

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings_obj, field, value)

    settings_obj.updated_at = datetime.datetime.utcnow()
    await db.commit()
    await db.refresh(settings_obj)
    await log_audit_event(db, current_user.id, "automation_settings.updated")
    return settings_obj

@router.get("/runs", response_model=List[AutomationRunResponse])
async def list_automation_runs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(AutomationRun)
        .where(AutomationRun.user_id == current_user.id)
        .order_by(AutomationRun.started_at.desc())
        .limit(20)
    )
    return res.scalars().all()

@router.post("/uipath/trigger", response_model=UiPathJobResponse)
async def trigger_uipath_workflow(
    req: TriggerRpaRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check automation pause switch
    res = await db.execute(select(AutomationSettings).where(AutomationSettings.user_id == current_user.id))
    auto_sett = res.scalar_one_or_none()
    if auto_sett and auto_sett.is_globally_paused:
        raise HTTPException(
            status_code=400,
            detail="Automation is globally paused. Unpause in Automation Control Centre to trigger RPA workflows."
        )

    # Fetch application
    app_res = await db.execute(
        select(Application).where(and_(Application.id == req.application_id, Application.user_id == current_user.id))
    )
    application = app_res.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application record not found")

    job = await uipath_service.start_application_job(
        db=db,
        user_id=current_user.id,
        application=application,
        process_name=req.process_name or "JobApplicationSubmission"
    )
    return job

@router.get("/uipath/{job_id}/status")
async def get_uipath_job_status(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(UiPathJob).where(and_(UiPathJob.id == job_id, UiPathJob.user_id == current_user.id))
    )
    u_job = res.scalar_one_or_none()
    if not u_job:
        raise HTTPException(status_code=404, detail="UiPath job not found")

    status_data = await uipath_service.get_job_status(db, u_job)
    return status_data
