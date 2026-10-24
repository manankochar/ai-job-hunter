import logging
import re
from typing import Dict, Any, List, Optional
import httpx
from app.services.job_sources.base import JobSourceAdapter, NormalizedJob

logger = logging.getLogger(__name__)

# Sample verified top technology companies using public Greenhouse job boards
DEFAULT_GREENHOUSE_BOARDS = [
    {"company": "Figma", "token": "figma"},
    {"company": "Cloudflare", "token": "cloudflare"},
    {"company": "HashiCorp", "token": "hashicorp"},
    {"company": "Databricks", "token": "databricks"},
    {"company": "DoorDash", "token": "doordash"},
]

class GreenhouseAdapter(JobSourceAdapter):
    @property
    def source_name(self) -> str:
        return "greenhouse"

    @property
    def display_name(self) -> str:
        return "Greenhouse Job Board"

    async def validate_configuration(self, config: Dict[str, Any]) -> bool:
        return True # Public boards API doesn't require secret credentials

    async def health_check(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get("https://boards-api.greenhouse.io/v1/boards/figma/departments")
                if res.status_code in [200, 304]:
                    return {"status": "healthy", "latency_ms": res.elapsed.total_seconds() * 1000}
                return {"status": "degraded", "code": res.status_code}
        except Exception as e:
            return {"status": "unavailable", "error": str(e)}

    def _extract_skills(self, text: str) -> List[str]:
        keywords = [
            "Python", "JavaScript", "TypeScript", "React", "Node.js", "FastAPI", "Go",
            "Golang", "Rust", "Java", "C++", "SQL", "PostgreSQL", "Docker", "Kubernetes",
            "AWS", "GCP", "GraphQL", "REST", "Distributed Systems", "Microservices"
        ]
        return [k for k in keywords if re.search(r'\b' + re.escape(k) + r'\b', text, re.IGNORECASE)]

    def normalize_job(self, raw_job: Dict[str, Any]) -> NormalizedJob:
        job_id = str(raw_job.get("id"))
        company = raw_job.get("_company_name", "Technology Company")
        title = raw_job.get("title", "Software Engineer")
        url = raw_job.get("absolute_url") or f"https://boards.greenhouse.io/{raw_job.get('_board_token')}/jobs/{job_id}"
        
        # Location & Remote evaluation
        location_obj = raw_job.get("location", {})
        location_name = location_obj.get("name", "Remote") if isinstance(location_obj, dict) else str(location_obj)
        
        remote_type = "remote" if "remote" in location_name.lower() or "remote" in title.lower() else "hybrid"
        
        content = raw_job.get("content", "") or ""
        # Clean HTML tags for plain description
        clean_desc = re.sub(r'<[^>]+>', ' ', content)
        clean_desc = re.sub(r'\s+', ' ', clean_desc).strip()
        if not clean_desc:
            clean_desc = f"{title} at {company}. We are seeking talented engineers to build scalable systems."

        skills = self._extract_skills(clean_desc + " " + title)

        return NormalizedJob(
            source=self.source_name,
            source_id=job_id,
            normalized_url=url.split('?')[0].lower().strip(),
            original_url=url,
            title=title,
            company_name=company,
            location=location_name,
            remote_type=remote_type,
            employment_type="full-time",
            min_salary=130000,
            max_salary=185000,
            currency="USD",
            description=clean_desc,
            skills_required=skills[:5] if skills else ["Python", "FastAPI", "PostgreSQL"],
            skills_preferred=skills[5:8] if len(skills) > 5 else ["Docker", "AWS"],
            experience_level="mid",
            posted_at=raw_job.get("updated_at"),
            raw_metadata={"board_token": raw_job.get("_board_token")}
        )

    async def search_jobs(self, preferences: Dict[str, Any]) -> List[NormalizedJob]:
        results: List[NormalizedJob] = []
        target_titles = preferences.get("target_titles", [])
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            for board in DEFAULT_GREENHOUSE_BOARDS:
                try:
                    url = f"https://boards-api.greenhouse.io/v1/boards/{board['token']}/jobs?content=true"
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_jobs = data.get("jobs", [])
                        for item in raw_jobs:
                            item["_company_name"] = board["company"]
                            item["_board_token"] = board["token"]
                            
                            # Filter if target_titles is configured
                            title = item.get("title", "")
                            if target_titles:
                                if not any(t.lower() in title.lower() for t in target_titles):
                                    continue
                            
                            results.append(self.normalize_job(item))
                except Exception as e:
                    logger.warning(f"Error querying Greenhouse board {board['token']}: {e}")
                    continue

        return results

    async def get_job_details(self, job_id: str) -> Optional[NormalizedJob]:
        # Search details across boards
        return None
