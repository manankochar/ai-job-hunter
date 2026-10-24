from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from app.core.database import get_db
from app.core.deps import get_current_user, log_audit_event
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job, RecruiterContact
from app.models.email import EmailMessage
from app.models.application import Application
from app.schemas.schemas import (
    EmailDraftGenerateRequest, EmailDraftCreate, EmailResponse, SyncRepliesResponse, RecruiterContactResponse
)
from app.services.gemini_service import gemini_service
from app.services.gmail_service import gmail_service

router = APIRouter(prefix="/emails", tags=["Email Centre"])

@router.post("/generate")
async def generate_email_draft(
    req: EmailDraftGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch job
    job_res = await db.execute(select(Job).where(Job.id == req.job_id))
    job = job_res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Fetch primary resume
    resume_res = await db.execute(
        select(Resume).where(and_(Resume.user_id == current_user.id, Resume.is_primary == True))
    )
    resume = resume_res.scalar_one_or_none()
    skills = resume.parsed_json.get("skills", []) if resume and resume.parsed_json else []
    summary = resume.parsed_json.get("summary", "") if resume and resume.parsed_json else ""

    recruiter_name = None
    recruiter_email = None
    if req.recruiter_contact_id:
        c_res = await db.execute(select(RecruiterContact).where(RecruiterContact.id == req.recruiter_contact_id))
        c = c_res.scalar_one_or_none()
        if c:
            recruiter_name = c.full_name
            recruiter_email = c.email

    draft = await gemini_service.generate_recruiter_email(
        candidate_name=current_user.full_name,
        candidate_summary=summary,
        candidate_skills=skills,
        recruiter_name=recruiter_name,
        job_title=job.title,
        company_name=job.company_name,
        job_url=job.original_url,
        tone=req.tone or "professional"
    )

    return {
        "job_id": job.id,
        "company_name": job.company_name,
        "recipient_email": recruiter_email or f"hiring@{job.company_name.lower().replace(' ', '')}.com",
        "recipient_name": recruiter_name or "Hiring Team",
        "subject": draft["subject"],
        "body_text": draft["body_text"],
        "body_html": draft["body_html"]
    }

@router.get("/drafts", response_model=List[EmailResponse])
async def list_emails(
    status_filter: Optional[str] = Query(None, description="draft, sent, failed, skipped"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(EmailMessage)
        .where(EmailMessage.user_id == current_user.id)
        .order_by(EmailMessage.created_at.desc())
    )
    if status_filter:
        stmt = stmt.where(EmailMessage.status == status_filter)

    results = await db.execute(stmt)
    return results.scalars().all()

@router.post("/drafts", response_model=EmailResponse)
async def save_draft(
    req: EmailDraftCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    email = EmailMessage(
        user_id=current_user.id,
        application_id=req.application_id,
        recruiter_contact_id=req.recruiter_contact_id,
        recipient_email=req.recipient_email,
        recipient_name=req.recipient_name,
        subject=req.subject,
        body_text=req.body_text,
        body_html=req.body_html or f"<p>{req.body_text.replace(chr(10), '<br/>')}</p>",
        status="draft",
        has_attachment=req.attach_resume
    )
    db.add(email)
    await db.commit()
    await db.refresh(email)
    return email

@router.post("/{email_id}/send")
async def send_email(
    email_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(EmailMessage).where(and_(EmailMessage.id == email_id, EmailMessage.user_id == current_user.id))
    )
    msg = res.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Email message not found")

    # Load resume bytes if attachment requested
    attachment_bytes = None
    attachment_filename = None
    if msg.has_attachment:
        resume_res = await db.execute(
            select(Resume).where(and_(Resume.user_id == current_user.id, Resume.is_primary == True))
        )
        resume = resume_res.scalar_one_or_none()
        if resume:
            attachment_filename = f"{current_user.full_name.replace(' ', '_')}_Resume.{resume.file_type}"
            try:
                with open(resume.file_path, "rb") as f:
                    attachment_bytes = f.read()
            except Exception:
                pass

    result = await gmail_service.send_email_message(
        db=db,
        user=current_user,
        email_message=msg,
        attachment_bytes=attachment_bytes,
        attachment_filename=attachment_filename
    )
    await log_audit_event(db, current_user.id, "email.sent", "email", str(msg.id), details=result)
    return result

@router.post("/sync", response_model=SyncRepliesResponse)
async def sync_replies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Synchronizes recruiter responses and classifies email messages."""
    res = await gmail_service.sync_replies(db, current_user)
    return SyncRepliesResponse(
        synced_count=res.get("synced_count", 0),
        replies_found=res.get("replies_found", 0),
        last_sync_at=datetime.datetime.utcnow(),
        status=res.get("status", "completed")
    )

@router.get("/contacts", response_model=List[RecruiterContactResponse])
async def list_recruiter_contacts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List recruiter contacts with explicit verification badges."""
    res = await db.execute(select(RecruiterContact).order_by(RecruiterContact.verification_status.asc()))
    contacts = res.scalars().all()
    return contacts
