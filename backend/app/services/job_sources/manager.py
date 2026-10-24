import datetime
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.job import Job, JobSource, SourceScanRun, JobMatch, CompanyProfile, RecruiterContact
from app.models.resume import Resume
from app.models.user import UserPreferences
from app.services.job_sources.base import JobSourceAdapter, NormalizedJob
from app.services.job_sources.greenhouse import GreenhouseAdapter
from app.services.job_sources.lever import LeverAdapter
from app.services.job_sources.ashby import AshbyAdapter
from app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

class JobDiscoveryManager:
    def __init__(self):
        self.adapters: Dict[str, JobSourceAdapter] = {
            "greenhouse": GreenhouseAdapter(),
            "lever": LeverAdapter(),
            "ashby": AshbyAdapter(),
        }

    def get_adapter(self, source_name: str) -> Optional[JobSourceAdapter]:
        return self.adapters.get(source_name)

    async def run_discovery_scan(self, db: AsyncSession, user_id: int) -> Dict[str, Any]:
        """
        Executes a job discovery scan across enabled sources for the specified user.
        Deduplicates postings, persists new jobs, and computes match scores.
        """
        # Fetch user preferences
        pref_result = await db.execute(select(UserPreferences).where(UserPreferences.user_id == user_id))
        preferences = pref_result.scalar_one_or_none()
        
        pref_dict = {}
        if preferences:
            pref_dict = {
                "target_titles": preferences.target_titles or [],
                "skills": preferences.skills or [],
                "locations": preferences.locations or [],
                "remote_preference": preferences.remote_preference or "any",
                "min_salary": preferences.min_salary,
                "excluded_companies": preferences.excluded_companies or [],
                "excluded_keywords": preferences.excluded_keywords or [],
            }

        # Fetch primary resume for matching
        resume_result = await db.execute(
            select(Resume).where(and_(Resume.user_id == user_id, Resume.is_primary == True))
        )
        primary_resume = resume_result.scalar_one_or_none()
        resume_skills = []
        resume_summary = ""
        if primary_resume and primary_resume.parsed_json:
            resume_skills = primary_resume.parsed_json.get("skills", [])
            resume_summary = primary_resume.parsed_json.get("summary", "")

        total_discovered = 0
        total_new = 0

        for source_name, adapter in self.adapters.items():
            scan_run = SourceScanRun(
                user_id=user_id,
                source_name=source_name,
                status="running",
                started_at=datetime.datetime.utcnow()
            )
            db.add(scan_run)
            await db.commit()

            try:
                jobs: List[NormalizedJob] = await adapter.search_jobs(pref_dict)
                total_discovered += len(jobs)
                source_new = 0

                for norm_job in jobs:
                    # Exclude filtered companies or keywords
                    if pref_dict.get("excluded_companies"):
                        if any(c.lower() in norm_job.company_name.lower() for c in pref_dict["excluded_companies"]):
                            continue
                    if pref_dict.get("excluded_keywords"):
                        if any(kw.lower() in norm_job.title.lower() or kw.lower() in norm_job.description.lower() for kw in pref_dict["excluded_keywords"]):
                            continue

                    # Deduplication check
                    existing_job_res = await db.execute(
                        select(Job).where(
                            (Job.source == norm_job.source) & (Job.source_id == norm_job.source_id) |
                            (Job.normalized_url == norm_job.normalized_url)
                        )
                    )
                    existing_job = existing_job_res.scalar_one_or_none()

                    if not existing_job:
                        # Ensure company profile exists
                        company_res = await db.execute(
                            select(CompanyProfile).where(CompanyProfile.company_name == norm_job.company_name)
                        )
                        company = company_res.scalar_one_or_none()
                        if not company:
                            company = CompanyProfile(
                                company_name=norm_job.company_name,
                                industry="Software & Technology",
                                careers_url=norm_job.original_url
                            )
                            db.add(company)
                            await db.flush()

                        new_job = Job(
                            source=norm_job.source,
                            source_id=norm_job.source_id,
                            normalized_url=norm_job.normalized_url,
                            original_url=norm_job.original_url,
                            title=norm_job.title,
                            company_name=norm_job.company_name,
                            company_id=company.id,
                            location=norm_job.location,
                            remote_type=norm_job.remote_type,
                            employment_type=norm_job.employment_type,
                            min_salary=norm_job.min_salary,
                            max_salary=norm_job.max_salary,
                            currency=norm_job.currency,
                            description=norm_job.description,
                            skills_required=norm_job.skills_required,
                            skills_preferred=norm_job.skills_preferred,
                            experience_level=norm_job.experience_level,
                            posted_at=datetime.datetime.utcnow()
                        )
                        db.add(new_job)
                        await db.flush()
                        target_job = new_job
                        source_new += 1
                        total_new += 1
                    else:
                        target_job = existing_job

                    # Calculate Job Match for this user if not already calculated
                    match_res = await db.execute(
                        select(JobMatch).where(
                            and_(JobMatch.user_id == user_id, JobMatch.job_id == target_job.id)
                        )
                    )
                    existing_match = match_res.scalar_one_or_none()

                    if not existing_match:
                        match_data = await gemini_service.match_resume_to_job(
                            resume_skills=resume_skills,
                            resume_summary=resume_summary,
                            job_title=target_job.title,
                            job_description=target_job.description,
                            job_required_skills=target_job.skills_required or [],
                            job_preferred_skills=target_job.skills_preferred or [],
                            user_preferences=pref_dict
                        )

                        job_match = JobMatch(
                            user_id=user_id,
                            job_id=target_job.id,
                            match_score=match_data.get("match_score", 65.0),
                            score_explanation=match_data.get("score_explanation", "Fit calculated based on skills and background."),
                            matched_skills=match_data.get("matched_skills", []),
                            missing_skills=match_data.get("missing_skills", []),
                            role_relevance_score=match_data.get("role_relevance_score", 70.0),
                            skill_coverage_pct=match_data.get("skill_coverage_pct", 60.0),
                            experience_eligible=match_data.get("experience_eligible", True),
                            location_match=match_data.get("location_match", True),
                            ai_model_used=match_data.get("ai_model_used", "deterministic-fallback"),
                        )
                        db.add(job_match)

                scan_run.status = "completed"
                scan_run.jobs_found = len(jobs)
                scan_run.jobs_new = source_new
                scan_run.completed_at = datetime.datetime.utcnow()
                await db.commit()

            except Exception as e:
                logger.error(f"Error during scan on {source_name}: {e}")
                scan_run.status = "failed"
                scan_run.error_message = str(e)
                scan_run.completed_at = datetime.datetime.utcnow()
                await db.commit()

        return {
            "status": "completed",
            "total_discovered": total_discovered,
            "total_new": total_new,
            "scan_timestamp": datetime.datetime.utcnow().isoformat()
        }

job_discovery_manager = JobDiscoveryManager()
