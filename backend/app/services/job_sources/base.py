from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class NormalizedJob(BaseModel):
    source: str
    source_id: str
    normalized_url: str
    original_url: str
    title: str
    company_name: str
    location: str
    remote_type: str # remote, hybrid, onsite
    employment_type: str # full-time, part-time, contract, internship
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    currency: str = "USD"
    description: str
    skills_required: List[str] = []
    skills_preferred: List[str] = []
    experience_level: Optional[str] = "mid"
    posted_at: Optional[str] = None
    raw_metadata: Dict[str, Any] = {}

class JobSourceAdapter(ABC):
    @property
    @abstractmethod
    def source_name(self) -> str:
        """Identifier for the job source (e.g. greenhouse, lever, ashby)"""
        pass

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human readable display name"""
        pass

    @abstractmethod
    async def validate_configuration(self, config: Dict[str, Any]) -> bool:
        """Validate credentials or required tokens if needed"""
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Check API availability and status"""
        pass

    @abstractmethod
    async def search_jobs(self, preferences: Dict[str, Any]) -> List[NormalizedJob]:
        """Query open postings matching given criteria"""
        pass

    @abstractmethod
    async def get_job_details(self, job_id: str) -> Optional[NormalizedJob]:
        """Retrieve full details for a single posting"""
        pass

    @abstractmethod
    def normalize_job(self, raw_job: Dict[str, Any]) -> NormalizedJob:
        """Transform raw source API representation into standard NormalizedJob"""
        pass
