from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
from app.core.database import get_db
from app.core.deps import get_current_user, log_audit_event
from app.models.user import User, UserPreferences
from app.models.resume import Resume
from app.models.job import Job, JobMatch, CompanyProfile, CompanyResearchSource, RecruiterContact
from app.models.application import Application
from app.schemas.schemas import (
    JobResponse, JobMatchExplanation, CompanyResearchResponse, RecruiterContactResponse
)
from app.services.job_sources.manager import job_discovery_manager
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/jobs", tags=["Job Discovery"])

@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    q: Optional[str] = Query(None, description="Search keyword in title, company or skills"),
    remote_type: Optional[str] = Query(None, description="remote, hybrid, or onsite"),
    source: Optional[str] = Query(None, description="greenhouse, lever, ashby"),
    min_score: Optional[int] = Query(None, description="Minimum match percentage"),
    saved_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Job).join(JobMatch, and_(JobMatch.job_id == Job.id, JobMatch.user_id == current_user.id), isouter=True)

    conditions = [Job.is_active == True]
    if q:
        conditions.append(or_(
            Job.title.ilike(f"%{q}%"),
            Job.company_name.ilike(f"%{q}%"),
            Job.description.ilike(f"%{q}%")
        ))
    if remote_type and remote_type != "all":
        conditions.append(Job.remote_type == remote_type)
    if source and source != "all":
        conditions.append(Job.source == source)

    stmt = stmt.where(and_(*conditions))

    results = await db.execute(stmt)
    jobs = results.scalars().all()

    # Get user match records and application statuses
    matches_res = await db.execute(
        select(JobMatch).where(JobMatch.user_id == current_user.id)
    )
    matches_map = {m.job_id: m for m in matches_res.scalars().all()}

    apps_res = await db.execute(
        select(Application).where(Application.user_id == current_user.id)
    )
    apps_map = {a.job_id: a.status for a in apps_res.scalars().all()}

    output = []
    for job in jobs:
        m = matches_map.get(job.id)
        match_score = m.match_score if m else None
        is_saved = m.is_saved if m else False
        is_dismissed = m.is_dismissed if m else False

        if is_dismissed and not saved_only:
            continue

        if saved_only and not is_saved:
            continue

        if min_score is not None and (match_score is None or match_score < min_score):
            continue

        output.append(JobResponse(
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
            match_score=match_score,
            is_saved=is_saved,
            is_dismissed=is_dismissed,
            application_status=apps_map.get(job.id)
        ))

    # Sort by match score descending
    output.sort(key=lambda x: (x.match_score or 0), reverse=True)
    return output

@router.get("/{job_id}", response_model=JobResponse)
async def get_job_detail(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Job).where(Job.id == job_id))
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    m_res = await db.execute(
        select(JobMatch).where(and_(JobMatch.job_id == job_id, JobMatch.user_id == current_user.id))
    )
    m = m_res.scalar_one_or_none()

    app_res = await db.execute(
        select(Application).where(and_(Application.job_id == job_id, Application.user_id == current_user.id))
    )
    app = app_res.scalar_one_or_none()

    return JobResponse(
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
        match_score=m.match_score if m else None,
        is_saved=m.is_saved if m else False,
        is_dismissed=m.is_dismissed if m else False,
        application_status=app.status if app else None
    )

@router.get("/{job_id}/match", response_model=JobMatchExplanation)
async def get_match_explanation(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Job).where(Job.id == job_id))
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    m_res = await db.execute(
        select(JobMatch).where(and_(JobMatch.job_id == job_id, JobMatch.user_id == current_user.id))
    )
    m = m_res.scalar_one_or_none()

    if not m:
        # Calculate now
        resume_res = await db.execute(
            select(Resume).where(and_(Resume.user_id == current_user.id, Resume.is_primary == True))
        )
        resume = resume_res.scalar_one_or_none()
        skills = resume.parsed_json.get("skills", []) if resume and resume.parsed_json else []
        summary = resume.parsed_json.get("summary", "") if resume and resume.parsed_json else ""

        match_data = await gemini_service.match_resume_to_job(
            resume_skills=skills,
            resume_summary=summary,
            job_title=job.title,
            job_description=job.description,
            job_required_skills=job.skills_required or [],
            job_preferred_skills=job.skills_preferred or [],
            user_preferences={}
        )
        m = JobMatch(
            user_id=current_user.id,
            job_id=job.id,
            match_score=match_data.get("match_score", 70.0),
            score_explanation=match_data.get("score_explanation", "Fit evaluated based on requirements."),
            matched_skills=match_data.get("matched_skills", []),
            missing_skills=match_data.get("missing_skills", []),
            role_relevance_score=match_data.get("role_relevance_score", 75.0),
            skill_coverage_pct=match_data.get("skill_coverage_pct", 70.0),
            experience_eligible=match_data.get("experience_eligible", True),
            location_match=match_data.get("location_match", True),
            ai_model_used=match_data.get("ai_model_used", "gemini-2.5-flash"),
        )
        db.add(m)
        await db.commit()
        await db.refresh(m)

    return JobMatchExplanation(
        job_id=job.id,
        match_score=m.match_score,
        score_explanation=m.score_explanation,
        matched_skills=m.matched_skills or [],
        missing_skills=m.missing_skills or [],
        role_relevance_score=m.role_relevance_score,
        skill_coverage_pct=m.skill_coverage_pct,
        experience_eligible=m.experience_eligible,
        location_match=m.location_match,
        ai_model_used=m.ai_model_used,
        tailoring_suggestions=[
            f"Demonstrate experience with {s} in project descriptions" for s in (m.missing_skills or [])[:2]
        ]
    )

@router.get("/{job_id}/research", response_model=CompanyResearchResponse)
async def get_company_research(
    job_id: int,
    refresh: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Job).where(Job.id == job_id))
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    company_res = await db.execute(select(CompanyProfile).where(CompanyProfile.company_name == job.company_name))
    company = company_res.scalar_one_or_none()

    if not company or not company.overview or refresh:
        # Run company research
        research_data = await gemini_service.research_company(job.company_name, job.original_url)
        if not company:
            company = CompanyProfile(company_name=job.company_name)
            db.add(company)

        company.domain = research_data.get("domain")
        company.overview = research_data.get("overview")
        company.products_services = research_data.get("products_services")
        company.industry = research_data.get("industry")
        company.engineering_focus = research_data.get("engineering_focus")
        company.tech_stack = research_data.get("tech_stack", [])
        company.public_news = research_data.get("public_news")
        company.careers_url = research_data.get("careers_url") or job.original_url
        company.last_researched_at = datetime.datetime.utcnow()
        await db.flush()

        # Add research sources
        for s in research_data.get("sources", []):
            src_obj = CompanyResearchSource(
                company_id=company.id,
                title=s.get("title", "Company Portal"),
                url=s.get("url", company.careers_url or ""),
                snippet=s.get("snippet", ""),
                verified=True
            )
            db.add(src_obj)

        await db.commit()
        await db.refresh(company)

    # Fetch sources
    srcs_res = await db.execute(
        select(CompanyResearchSource).where(CompanyResearchSource.company_id == company.id)
    )
    sources = [
        {"title": s.title, "url": s.url, "snippet": s.snippet, "verified": s.verified}
        for s in srcs_res.scalars().all()
    ]

    return CompanyResearchResponse(
        company_name=company.company_name,
        domain=company.domain,
        overview=company.overview,
        products_services=company.products_services,
        industry=company.industry,
        engineering_focus=company.engineering_focus,
        tech_stack=company.tech_stack or [],
        public_news=company.public_news,
        careers_url=company.careers_url,
        linkedin_url=company.linkedin_url,
        last_researched_at=company.last_researched_at,
        sources=sources
    )

@router.get("/{job_id}/recruiter", response_model=Optional[RecruiterContactResponse])
async def get_recruiter_contact(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve verified recruiter contact. Never fabricates contact information."""
    res = await db.execute(
        select(RecruiterContact).where(RecruiterContact.job_id == job_id)
    )
    contact = res.scalar_one_or_none()
    if not contact:
        return None
    return RecruiterContactResponse.from_orm(contact)

@router.post("/{job_id}/save")
async def toggle_save_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(JobMatch).where(and_(JobMatch.job_id == job_id, JobMatch.user_id == current_user.id))
    )
    m = res.scalar_one_or_none()
    if not m:
        m = JobMatch(user_id=current_user.id, job_id=job_id, match_score=75.0, score_explanation="Saved by user", is_saved=True)
        db.add(m)
    else:
        m.is_saved = not m.is_saved
    await db.commit()
    return {"job_id": job_id, "is_saved": m.is_saved}

@router.post("/{job_id}/dismiss")
async def dismiss_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(JobMatch).where(and_(JobMatch.job_id == job_id, JobMatch.user_id == current_user.id))
    )
    m = res.scalar_one_or_none()
    if not m:
        m = JobMatch(user_id=current_user.id, job_id=job_id, match_score=50.0, score_explanation="Dismissed by user", is_dismissed=True)
        db.add(m)
    else:
        m.is_dismissed = True
    await db.commit()
    return {"job_id": job_id, "is_dismissed": True}

@router.post("/scan")
async def trigger_job_scan(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Triggers on-demand job discovery scan across Greenhouse, Lever, Ashby."""
    result = await job_discovery_manager.run_discovery_scan(db, current_user.id)
    await log_audit_event(db, current_user.id, "job_scan.triggered", details=result)
    return result
