import datetime
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, String, Text, JSON, Float, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class JobSource(Base):
    __tablename__ = "job_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(50), unique=True, nullable=False) # greenhouse, lever, ashby, direct
    display_name = Column(String(100), nullable=False)
    is_enabled = Column(Boolean, default=True)
    requires_credentials = Column(Boolean, default=False)
    auth_config = Column(JSON, default=dict)
    health_status = Column(String(50), default="healthy") # healthy, degraded, auth_required, unavailable
    last_synced_at = Column(DateTime, nullable=True)
    error_details = Column(Text, nullable=True)
    capabilities = Column(JSON, default=lambda: {
        "search": True,
        "detail": True,
        "submit_application": False,
        "recruiter_contacts": False
    })

class SourceScanRun(Base):
    __tablename__ = "source_scan_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source_name = Column(String(50), nullable=False)
    status = Column(String(50), default="running") # running, completed, failed
    jobs_found = Column(Integer, default=0)
    jobs_new = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50), nullable=False, index=True) # greenhouse, lever, ashby, direct
    source_id = Column(String(255), nullable=False, index=True)
    normalized_url = Column(String(500), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    company_name = Column(String(255), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("company_profiles.id", ondelete="SET NULL"), nullable=True)
    location = Column(String(255), default="Remote")
    remote_type = Column(String(50), default="remote") # remote, hybrid, onsite
    employment_type = Column(String(50), default="full-time")
    min_salary = Column(Integer, nullable=True)
    max_salary = Column(Integer, nullable=True)
    currency = Column(String(10), default="USD")
    original_url = Column(String(1000), nullable=False)
    description = Column(Text, nullable=False)
    skills_required = Column(JSON, default=list)
    skills_preferred = Column(JSON, default=list)
    experience_level = Column(String(50), nullable=True)
    posted_at = Column(DateTime, nullable=True)
    discovered_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    is_active = Column(Boolean, default=True)
    
    company = relationship("CompanyProfile", back_populates="jobs")
    matches = relationship("JobMatch", back_populates="job", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    recruiter_contacts = relationship("RecruiterContact", back_populates="job", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('source', 'source_id', name='uq_source_source_id'),
    )

class JobMatch(Base):
    __tablename__ = "job_matches"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    match_score = Column(Float, nullable=False) # 0 to 100
    score_explanation = Column(Text, nullable=False)
    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    role_relevance_score = Column(Float, default=0.0)
    skill_coverage_pct = Column(Float, default=0.0)
    experience_eligible = Column(Boolean, default=True)
    location_match = Column(Boolean, default=True)
    
    ai_model_used = Column(String(50), default="gemini-2.5-flash")
    analyzed_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    is_saved = Column(Boolean, default=False)
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="matches")
    job = relationship("Job", back_populates="matches")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'job_id', name='uq_user_job_match'),
    )

class CompanyProfile(Base):
    __tablename__ = "company_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), unique=True, nullable=False, index=True)
    domain = Column(String(255), nullable=True)
    overview = Column(Text, nullable=True)
    products_services = Column(Text, nullable=True)
    industry = Column(String(100), nullable=True)
    engineering_focus = Column(Text, nullable=True)
    tech_stack = Column(JSON, default=list)
    public_news = Column(Text, nullable=True)
    careers_url = Column(String(500), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    last_researched_at = Column(DateTime, nullable=True)
    
    jobs = relationship("Job", back_populates="company")
    research_sources = relationship("CompanyResearchSource", back_populates="company", cascade="all, delete-orphan")
    recruiter_contacts = relationship("RecruiterContact", back_populates="company", cascade="all, delete-orphan")

class CompanyResearchSource(Base):
    __tablename__ = "company_research_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("company_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    url = Column(String(1000), nullable=False)
    snippet = Column(Text, nullable=True)
    verified = Column(Boolean, default=True)
    fetched_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    company = relationship("CompanyProfile", back_populates="research_sources")

class RecruiterContact(Base):
    __tablename__ = "recruiter_contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("company_profiles.id", ondelete="CASCADE"), nullable=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True, index=True)
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=True) # e.g. "Senior Technical Recruiter"
    linkedin_url = Column(String(500), nullable=True)
    
    # Strict verification fields (Never fabricate)
    verification_status = Column(String(50), default="unverified") # verified, unverified, invalid
    verification_method = Column(String(100), nullable=True) # "official_job_post", "company_portal", "direct_inquiry"
    source_url = Column(String(1000), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    company = relationship("CompanyProfile", back_populates="recruiter_contacts")
    job = relationship("Job", back_populates="recruiter_contacts")
    emails = relationship("EmailMessage", back_populates="recruiter_contact")
