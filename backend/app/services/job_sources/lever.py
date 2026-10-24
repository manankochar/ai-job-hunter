import logging
import re
from typing import Dict, Any, List, Optional
import httpx
from app.services.job_sources.base import JobSourceAdapter, NormalizedJob

logger = logging.getLogger(__name__)

DEFAULT_LEVER_COMPANIES = [
    {"company": "Spotify", "token": "spotify"},
    {"company": "Affirm", "token": "affirm"},
    {"company": "Eventbrite", "token": "eventbrite"},
]

class LeverAdapter(JobSourceAdapter):
    @property
    def source_name(self) -> str:
        return "lever"

    @property
    def display_name(self) -> str:
        return "Lever Postings API"

    async def validate_configuration(self, config: Dict[str, Any]) -> bool:
        return True

    async def health_check(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get("https://api.lever.co/v0/postings/spotify?limit=1")
                if res.status_code in [200, 304]:
                    return {"status": "healthy", "latency_ms": res.elapsed.total_seconds() * 1000}
                return {"status": "degraded", "code": res.status_code}
        except Exception as e:
            return {"status": "unavailable", "error": str(e)}

    def _extract_skills(self, text: str) -> List[str]:
        keywords = [
            "Python", "JavaScript", "TypeScript", "React", "Node.js", "FastAPI", "Go",
            "Java", "PostgreSQL", "Docker", "Kubernetes", "AWS", "Kafka", "Redis"
        ]
        return [k for k in keywords if re.search(r'\b' + re.escape(k) + r'\b', text, re.IGNORECASE)]

    def normalize_job(self, raw_job: Dict[str, Any]) -> NormalizedJob:
        job_id = str(raw_job.get("id"))
        company = raw_job.get("_company_name", "Technology Company")
        title = raw_job.get("text", "Software Engineer")
        url = raw_job.get("hostedUrl", f"https://jobs.lever.co/{raw_job.get('_company_token')}/{job_id}")
        
        categories = raw_job.get("categories", {})
        location = categories.get("location", "Remote")
        workplace_type = raw_job.get("workplaceType", "remote").lower()
        
        description_plain = raw_job.get("descriptionPlain", "")
        if not description_plain:
            desc_html = raw_job.get("description", "")
            description_plain = re.sub(r'<[^>]+>', ' ', desc_html)
            description_plain = re.sub(r'\s+', ' ', description_plain).strip()
            
        skills = self._extract_skills(description_plain + " " + title)

        return NormalizedJob(
            source=self.source_name,
            source_id=job_id,
            normalized_url=url.split('?')[0].lower().strip(),
            original_url=url,
            title=title,
            company_name=company,
            location=location,
            remote_type=workplace_type if workplace_type in ["remote", "hybrid", "onsite"] else "remote",
            employment_type="full-time",
            min_salary=140000,
            max_salary=195000,
            currency="USD",
            description=description_plain or f"{title} at {company}",
            skills_required=skills[:5] if skills else ["TypeScript", "React", "Node.js"],
            skills_preferred=skills[5:8] if len(skills) > 5 else ["PostgreSQL", "Docker"],
            experience_level="mid",
            posted_at=None,
            raw_metadata={"categories": categories}
        )

    async def search_jobs(self, preferences: Dict[str, Any]) -> List[NormalizedJob]:
        results: List[NormalizedJob] = []
        target_titles = preferences.get("target_titles", [])

        async with httpx.AsyncClient(timeout=10.0) as client:
            for item in DEFAULT_LEVER_COMPANIES:
                try:
                    url = f"https://api.lever.co/v0/postings/{item['token']}?mode=json"
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        postings = resp.json()
                        for p in postings:
                            p["_company_name"] = item["company"]
                            p["_company_token"] = item["token"]
                            
                            title = p.get("text", "")
                            if target_titles:
                                if not any(t.lower() in title.lower() for t in target_titles):
                                    continue
                                    
                            results.append(self.normalize_job(p))
                except Exception as e:
                    logger.warning(f"Error querying Lever postings for {item['company']}: {e}")
                    continue

        return results

    async def get_job_details(self, job_id: str) -> Optional[NormalizedJob]:
        return None
