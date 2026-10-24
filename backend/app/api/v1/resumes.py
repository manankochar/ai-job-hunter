import io
import os
import uuid
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update
from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user, log_audit_event
from app.models.user import User, UserPreferences
from app.models.resume import Resume, ResumeVersion, ResumeSkill
from app.schemas.schemas import ResumeResponse, ResumeUpdate
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/resumes", tags=["Resumes"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

def extract_text_from_file(file_bytes: bytes, file_ext: str) -> str:
    """Extract plain text from uploaded PDF, DOCX, or TXT file."""
    text = ""
    if file_ext == ".pdf":
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        for page in reader.pages:
            text += page.extract_text() or ""
    elif file_ext == ".docx":
        import docx
        doc = docx.Document(io.BytesIO(file_bytes))
        for para in doc.paragraphs:
            text += para.text + "\n"
    elif file_ext == ".txt":
        text = file_bytes.decode("utf-8", errors="ignore")
    return text.strip()

@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    title: str = Form("Primary Resume"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Validate extension
    _, ext = os.path.splitext(file.filename or "")
    ext = ext.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF, DOCX, or TXT document.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > settings.MAX_RESUME_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size ({settings.MAX_RESUME_SIZE_MB}MB).",
        )

    # Extract raw text
    try:
        raw_text = extract_text_from_file(file_bytes, ext)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read document: {str(e)}"
        )

    if not raw_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document appears to be empty or unreadable text."
        )

    # Save file to disk
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Parse with Gemini AI
    parsed_json = await gemini_service.parse_and_structure_resume(raw_text)

    # If this is the user's first resume, mark as primary
    existing_resumes = await db.execute(select(Resume).where(Resume.user_id == current_user.id))
    has_resumes = len(existing_resumes.scalars().all()) > 0
    is_primary = not has_resumes

    new_resume = Resume(
        user_id=current_user.id,
        title=title,
        file_name=file.filename,
        file_path=file_path,
        file_type=ext.lstrip('.'),
        file_size_bytes=len(file_bytes),
        raw_text=raw_text,
        parsed_json=parsed_json,
        is_primary=is_primary,
    )
    db.add(new_resume)
    await db.flush()

    # Store initial ResumeVersion
    version = ResumeVersion(
        resume_id=new_resume.id,
        user_id=current_user.id,
        version_number=1,
        full_text=raw_text,
        diff_summary="Initial uploaded version"
    )
    db.add(version)

    # Extract and store skills
    extracted_skills = parsed_json.get("skills", [])
    for skill_name in extracted_skills:
        skill_obj = ResumeSkill(
            resume_id=new_resume.id,
            user_id=current_user.id,
            skill_name=skill_name,
            category="technical",
            verified=True
        )
        db.add(skill_obj)

    # Also automatically sync skills to user preferences if empty
    user_prefs_res = await db.execute(select(UserPreferences).where(UserPreferences.user_id == current_user.id))
    user_prefs = user_prefs_res.scalar_one_or_none()
    if user_prefs and (not user_prefs.skills or len(user_prefs.skills) == 0):
        user_prefs.skills = extracted_skills[:10]

    await db.commit()
    await db.refresh(new_resume)

    await log_audit_event(
        db, current_user.id, "resume.uploaded", "resume", str(new_resume.id), {"file_name": file.filename}
    )

    return ResumeResponse(
        id=new_resume.id,
        title=new_resume.title,
        file_name=new_resume.file_name,
        file_type=new_resume.file_type,
        file_size_bytes=new_resume.file_size_bytes,
        parsed_json=new_resume.parsed_json,
        is_primary=new_resume.is_primary,
        created_at=new_resume.created_at,
        skills=[{"skill_name": s} for s in extracted_skills]
    )

@router.get("/", response_model=List[ResumeResponse])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Resume).where(Resume.user_id == current_user.id).order_by(Resume.created_at.desc())
    )
    resumes = res.scalars().all()
    results = []
    for r in resumes:
        skills = r.parsed_json.get("skills", []) if r.parsed_json else []
        results.append(ResumeResponse(
            id=r.id,
            title=r.title,
            file_name=r.file_name,
            file_type=r.file_type,
            file_size_bytes=r.file_size_bytes,
            parsed_json=r.parsed_json or {},
            is_primary=r.is_primary,
            created_at=r.created_at,
            skills=[{"skill_name": s} for s in skills]
        ))
    return results

@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Resume).where(and_(Resume.id == resume_id, Resume.user_id == current_user.id))
    )
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    skills = r.parsed_json.get("skills", []) if r.parsed_json else []
    return ResumeResponse(
        id=r.id,
        title=r.title,
        file_name=r.file_name,
        file_type=r.file_type,
        file_size_bytes=r.file_size_bytes,
        parsed_json=r.parsed_json or {},
        is_primary=r.is_primary,
        created_at=r.created_at,
        skills=[{"skill_name": s} for s in skills]
    )

@router.put("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
    resume_id: int,
    req: ResumeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Allows user to correct extracted resume fields or update title/primary flag."""
    res = await db.execute(
        select(Resume).where(and_(Resume.id == resume_id, Resume.user_id == current_user.id))
    )
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Resume not found")

    if req.title is not None:
        r.title = req.title
    if req.parsed_json is not None:
        r.parsed_json = req.parsed_json
    if req.is_primary is True:
        # Mark all other resumes as non-primary
        await db.execute(
            update(Resume).where(Resume.user_id == current_user.id).values(is_primary=False)
        )
        r.is_primary = True

    await db.commit()
    await db.refresh(r)

    skills = r.parsed_json.get("skills", []) if r.parsed_json else []
    return ResumeResponse(
        id=r.id,
        title=r.title,
        file_name=r.file_name,
        file_type=r.file_type,
        file_size_bytes=r.file_size_bytes,
        parsed_json=r.parsed_json or {},
        is_primary=r.is_primary,
        created_at=r.created_at,
        skills=[{"skill_name": s} for s in skills]
    )

@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Resume).where(and_(Resume.id == resume_id, Resume.user_id == current_user.id))
    )
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Remove file from disk
    if os.path.exists(r.file_path):
        try:
            os.remove(r.file_path)
        except Exception:
            pass

    await db.delete(r)
    await db.commit()
    await log_audit_event(db, current_user.id, "resume.deleted", "resume", str(resume_id))
    return {"message": "Resume successfully deleted"}
