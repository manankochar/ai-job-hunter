import csv
import io
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
from app.core.database import get_db
from app.core.deps import get_current_user, log_audit_event
from app.models.user import User
from app.models.job import Job, JobMatch
from app.models.application import Application, ApplicationEvent, FollowUpTask
from app.schemas.schemas import (
    ApplicationCreate, ApplicationUpdate, ApplicationResponse,
    FollowUpCreate, FollowUpResponse, JobResponse, ApplicationEventResponse
)

router = APIRouter(prefix="/applications", tags=["Applications Tracker"])

VALID_STATUSES = [
    "Discovered", "Matched", "Saved", "Ready to Apply", "Applied",
    "Recruiter Contacted", "Recruiter Responded", "Interview",
    "Offer", "Rejected", "Withdrawn", "Archived"
]

@router.get("/", response_model=List[ApplicationResponse])
async def list_applications(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Application)
        .where(Application.user_id == current_user.id)
        .order_by(Application.updated_at.desc())
    )
    if status_filter and status_filter != "all":
        stmt = stmt.where(Application.status == status_filter)

    results = await db.execute(stmt)
    apps = results.scalars().all()

    output = []
    for a in apps:
        # Load job
        job_res = await db.execute(select(Job).where(Job.id == a.job_id))
        job = job_res.scalar_one_or_none()
        if not job:
            continue

        # Load events
        events_res = await db.execute(
            select(ApplicationEvent)
            .where(ApplicationEvent.application_id == a.id)
            .order_by(ApplicationEvent.created_at.desc())
        )
        events = events_res.scalars().all()

        output.append(ApplicationResponse(
            id=a.id,
            user_id=a.user_id,
            job_id=a.job_id,
            resume_id=a.resume_id,
            status=a.status,
            applied_at=a.applied_at,
            interview_date=a.interview_date,
            follow_up_date=a.follow_up_date,
            offer_amount=a.offer_amount,
            notes=a.notes,
            source=a.source,
            created_at=a.created_at,
            updated_at=a.updated_at,
            job=JobResponse(
                id=job.id,
                source=job.source,
                source_id=job.source_id,
                title=job.title,
                company_name=job.company_name,
                location=job.location,
                remote_type=job.remote_type,
                employment_type=job.employment_type,
                min_salary=job.min_salary,
                max_salary=job.max_salary,
                currency=job.currency,
                original_url=job.original_url,
                description=job.description,
                skills_required=job.skills_required or [],
                skills_preferred=job.skills_preferred or [],
                experience_level=job.experience_level,
                posted_at=job.posted_at,
                discovered_at=job.discovered_at,
                is_active=job.is_active,
                application_status=a.status
            ),
            events=[
                ApplicationEventResponse(
                    id=e.id,
                    event_type=e.event_type,
                    from_status=e.from_status,
                    to_status=e.to_status,
                    description=e.description,
                    metadata_json=e.metadata_json or {},
                    created_at=e.created_at
                )
                for e in events
            ]
        ))

    return output

@router.post("/", response_model=ApplicationResponse)
async def create_application(
    req: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if job exists
    job_res = await db.execute(select(Job).where(Job.id == req.job_id))
    job = job_res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check if application already exists
    existing = await db.execute(
        select(Application).where(and_(Application.user_id == current_user.id, Application.job_id == req.job_id))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="This job is already in your application pipeline.")

    app = Application(
        user_id=current_user.id,
        job_id=req.job_id,
        resume_id=req.resume_id,
        status=req.status if req.status in VALID_STATUSES else "Ready to Apply",
        notes=req.notes,
        source=job.source
    )
    db.add(app)
    await db.flush()

    event = ApplicationEvent(
        application_id=app.id,
        user_id=current_user.id,
        event_type="status_changed",
        from_status=None,
        to_status=app.status,
        description=f"Added job {job.title} at {job.company_name} to pipeline as {app.status}"
    )
    db.add(event)
    await db.commit()
    await db.refresh(app)

    await log_audit_event(db, current_user.id, "application.created", "application", str(app.id))

    return ApplicationResponse(
        id=app.id,
        user_id=app.user_id,
        job_id=app.job_id,
        resume_id=app.resume_id,
        status=app.status,
        applied_at=app.applied_at,
        interview_date=app.interview_date,
        follow_up_date=app.follow_up_date,
        offer_amount=app.offer_amount,
        notes=app.notes,
        source=app.source,
        created_at=app.created_at,
        updated_at=app.updated_at,
        job=JobResponse.from_orm(job),
        events=[ApplicationEventResponse.from_orm(event)]
    )

@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: int,
    req: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Application).where(and_(Application.id == application_id, Application.user_id == current_user.id))
    )
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    old_status = app.status

    if req.status and req.status in VALID_STATUSES and req.status != old_status:
        app.status = req.status
        if req.status == "Applied" and not app.applied_at:
            app.applied_at = datetime.datetime.utcnow()

        event = ApplicationEvent(
            application_id=app.id,
            user_id=current_user.id,
            event_type="status_changed",
            from_status=old_status,
            to_status=req.status,
            description=f"Status updated from {old_status} to {req.status}"
        )
        db.add(event)

    if req.interview_date is not None:
        app.interview_date = req.interview_date
    if req.follow_up_date is not None:
        app.follow_up_date = req.follow_up_date
    if req.offer_amount is not None:
        app.offer_amount = req.offer_amount
    if req.notes is not None:
        app.notes = req.notes
    if req.resume_id is not None:
        app.resume_id = req.resume_id

    app.updated_at = datetime.datetime.utcnow()
    await db.commit()
    await db.refresh(app)

    job_res = await db.execute(select(Job).where(Job.id == app.job_id))
    job = job_res.scalar_one_or_none()

    events_res = await db.execute(
        select(ApplicationEvent).where(ApplicationEvent.application_id == app.id).order_by(ApplicationEvent.created_at.desc())
    )
    events = events_res.scalars().all()

    return ApplicationResponse(
        id=app.id,
        user_id=app.user_id,
        job_id=app.job_id,
        resume_id=app.resume_id,
        status=app.status,
        applied_at=app.applied_at,
        interview_date=app.interview_date,
        follow_up_date=app.follow_up_date,
        offer_amount=app.offer_amount,
        notes=app.notes,
        source=app.source,
        created_at=app.created_at,
        updated_at=app.updated_at,
        job=JobResponse.from_orm(job),
        events=[ApplicationEventResponse.from_orm(e) for e in events]
    )

@router.delete("/{application_id}")
async def delete_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Application).where(and_(Application.id == application_id, Application.user_id == current_user.id))
    )
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    await db.delete(app)
    await db.commit()
    return {"message": "Application removed from tracker"}

@router.get("/export/csv")
async def export_applications_csv(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Exports user application data to CSV."""
    stmt = (
        select(Application, Job)
        .join(Job, Application.job_id == Job.id)
        .where(Application.user_id == current_user.id)
        .order_by(Application.created_at.desc())
    )
    res = await db.execute(stmt)
    rows = res.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Application ID", "Job Title", "Company", "Location", "Remote Type",
        "Status", "Applied Date", "Interview Date", "Follow Up Date",
        "Offer Amount", "Job URL", "Notes"
    ])

    for app, job in rows:
        writer.writerow([
            app.id,
            job.title,
            job.company_name,
            job.location,
            job.remote_type,
            app.status,
            app.applied_at.strftime("%Y-%m-%d %H:%M") if app.applied_at else "",
            app.interview_date.strftime("%Y-%m-%d %H:%M") if app.interview_date else "",
            app.follow_up_date.strftime("%Y-%m-%d") if app.follow_up_date else "",
            app.offer_amount or "",
            job.original_url,
            app.notes or ""
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=job_applications.csv"}
    )

@router.get("/follow-ups", response_model=List[FollowUpResponse])
async def list_follow_ups(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(FollowUpTask, Application, Job)
        .join(Application, FollowUpTask.application_id == Application.id)
        .join(Job, Application.job_id == Job.id)
        .where(FollowUpTask.user_id == current_user.id)
        .order_by(FollowUpTask.due_date.asc())
    )
    tasks = []
    for task, app, job in res.all():
        tasks.append(FollowUpResponse(
            id=task.id,
            application_id=task.application_id,
            title=task.title,
            due_date=task.due_date,
            status=task.status,
            notes=task.notes,
            company_name=job.company_name,
            job_title=job.title,
            created_at=task.created_at
        ))
    return tasks

@router.post("/follow-ups", response_model=FollowUpResponse)
async def create_follow_up(
    req: FollowUpCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    task = FollowUpTask(
        user_id=current_user.id,
        application_id=req.application_id,
        title=req.title,
        due_date=req.due_date,
        notes=req.notes,
        status="pending"
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return FollowUpResponse(
        id=task.id,
        application_id=task.application_id,
        title=task.title,
        due_date=task.due_date,
        status=task.status,
        notes=task.notes,
        created_at=task.created_at
    )
