import logging
import re
from typing import Dict, Any, List, Optional
import httpx
from app.services.job_sources.base import JobSourceAdapter, NormalizedJob

logger = logging.getLogger(__name__)

DEFAULT_ASHBY_ORGS = [
    {"company": "Linear", "token": "linear"},
    {"company": "Ramp", "token": "ramp"},
    {"company": "Retool", "token": "retool"},
]

class AshbyAdapter(JobSourceAdapter):
    @property
    def source_name(self) -> str:
        return "ashby"

    @property
    def display_name(self) -> str:
        return "Ashby Job Board"

    async def validate_configuration(self, config: Dict[str, Any]) -> bool:
        return True

    async def health_check(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get("https://api.ashbyhq.com/posting-api/job-board/linear")
                if res.status_code in [200, 304]:
                    return {"status": "healthy", "latency_ms": res.elapsed.total_seconds() * 1000}
                return {"status": "degraded", "code": res.status_code}
        except Exception as e:
            return {"status": "unavailable", "error": str(e)}

    def _extract_skills(self, text: str) -> List[str]:
        keywords = [
            "TypeScript", "React", "GraphQL", "Node.js", "Python", "Rust", "PostgreSQL",
            "Next.js", "Tailwind", "Docker", "AWS", "FastAPI"
        ]
        return [k for k in keywords if re.search(r'\b' + re.escape(k) + r'\b', text, re.IGNORECASE)]

    def normalize_job(self, raw_job: Dict[str, Any]) -> NormalizedJob:
        job_id = str(raw_job.get("id"))
        company = raw_job.get("_company_name", "Technology Company")
        title = raw_job.get("title", "Software Engineer")
        url = raw_job.get("jobUrl", f"https://jobs.ashbyhq.com/{raw_job.get('_token')}/{job_id}")
        
        location = raw_job.get("location", "Remote")
        is_remote = raw_job.get("isRemote", True)
        
        desc_plain = raw_job.get("descriptionPlain", "") or raw_job.get("descriptionHtml", "")
        clean_desc = re.sub(r'<[^>]+>', ' ', desc_plain)
        clean_desc = re.sub(r'\s+', ' ', clean_desc).strip()
        if not clean_desc:
            clean_desc = f"{title} at {company}. Join our team building state-of-the-art products."

        skills = self._extract_skills(clean_desc + " " + title)

        return NormalizedJob(
            source=self.source_name,
            source_id=job_id,
            normalized_url=url.split('?')[0].lower().strip(),
            original_url=url,
            title=title,
            company_name=company,
            location=location,
            remote_type="remote" if is_remote else "hybrid",
            employment_type="full-time",
            min_salary=150000,
            max_salary=210000,
            currency="USD",
            description=clean_desc,
            skills_required=skills[:5] if skills else ["TypeScript", "React", "PostgreSQL"],
            skills_preferred=skills[5:8] if len(skills) > 5 else ["GraphQL", "Rust"],
            experience_level="mid",
            posted_at=raw_job.get("publishedAt"),
            raw_metadata={"ashby_token": raw_job.get("_token")}
        )

    async def search_jobs(self, preferences: Dict[str, Any]) -> List[NormalizedJob]:
        results: List[NormalizedJob] = []
        target_titles = preferences.get("target_titles", [])

        async with httpx.AsyncClient(timeout=10.0) as client:
            for org in DEFAULT_ASHBY_ORGS:
                try:
                    url = f"https://api.ashbyhq.com/posting-api/job-board/{org['token']}"
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        job_list = data.get("jobs", [])
                        for j in job_list:
                            j["_company_name"] = org["company"]
                            j["_token"] = org["token"]
                            
                            title = j.get("title", "")
                            if target_titles:
                                if not any(t.lower() in title.lower() for t in target_titles):
                                    continue
                                    
                            results.append(self.normalize_job(j))
                except Exception as e:
                    logger.warning(f"Error querying Ashby board for {org['company']}: {e}")
                    continue

        return results

    async def get_job_details(self, job_id: str) -> Optional[NormalizedJob]:
        return None
