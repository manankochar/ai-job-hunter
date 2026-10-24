import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# ----------------- AUTH SCHEMAS -----------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    onboarding_completed: bool

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None # Google ID token or mock code
    email: Optional[EmailStr] = None
    name: Optional[str] = None

# ----------------- USER PROFILE & PREFS -----------------
class UserProfileUpdate(BaseModel):
    phone: Optional[str] = None
    location: Optional[str] = None
    headline: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    bio: Optional[str] = None
    years_experience: Optional[float] = None
    onboarding_completed: Optional[bool] = None
    onboarding_step: Optional[int] = None

class UserProfileResponse(BaseModel):
    id: int
    user_id: int
    phone: Optional[str]
    location: Optional[str]
    headline: Optional[str]
    linkedin_url: Optional[str]
    github_url: Optional[str]
    portfolio_url: Optional[str]
    bio: Optional[str]
    years_experience: float
    onboarding_completed: bool
    onboarding_step: int
    
    model_config = ConfigDict(from_attributes=True)

class UserPreferencesUpdate(BaseModel):
    target_titles: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    remote_preference: Optional[str] = None # "remote", "hybrid", "onsite", "any"
    employment_types: Optional[List[str]] = None
    experience_level: Optional[str] = None
    min_salary: Optional[int] = None
    target_companies: Optional[List[str]] = None
    excluded_companies: Optional[List[str]] = None
    excluded_keywords: Optional[List[str]] = None
    requires_sponsorship: Optional[bool] = None
    min_match_score: Optional[int] = None
    daily_scan_frequency: Optional[int] = None
    max_emails_per_day: Optional[int] = None

class UserPreferencesResponse(BaseModel):
    id: int
    target_titles: List[str]
    skills: List[str]
    locations: List[str]
    remote_preference: str
    employment_types: List[str]
    experience_level: str
    min_salary: Optional[int]
    target_companies: List[str]
    excluded_companies: List[str]
    excluded_keywords: List[str]
    requires_sponsorship: bool
    min_match_score: int
    daily_scan_frequency: int
    max_emails_per_day: int
    
    model_config = ConfigDict(from_attributes=True)

# ----------------- RESUME SCHEMAS -----------------
class ResumeSkillItem(BaseModel):
    skill_name: str
    category: str = "technical"
    years_experience: Optional[int] = None
    verified: bool = True

class ResumeParsedData(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    skills: List[str] = []
    experience: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    certifications: List[str] = []
    projects: List[Dict[str, Any]] = []

class ResumeResponse(BaseModel):
    id: int
    title: str
    file_name: str
    file_type: str
    file_size_bytes: int
    parsed_json: Dict[str, Any]
    is_primary: bool
    created_at: datetime.datetime
    skills: List[Dict[str, Any]] = []
    
    model_config = ConfigDict(from_attributes=True)

class ResumeUpdate(BaseModel):
    title: Optional[str] = None
    parsed_json: Optional[Dict[str, Any]] = None
    is_primary: Optional[bool] = None

# ----------------- JOB & MATCH SCHEMAS -----------------
class JobResponse(BaseModel):
    id: int
    source: str
    source_id: str
    title: str
    company_name: str
    location: str
    remote_type: str
    employment_type: str
    min_salary: Optional[int]
    max_salary: Optional[int]
    currency: str
    original_url: str
    description: str
    skills_required: List[str]
    skills_preferred: List[str]
    experience_level: Optional[str]
    posted_at: Optional[datetime.datetime]
    discovered_at: datetime.datetime
    is_active: bool
    
    match_score: Optional[float] = None
    is_saved: Optional[bool] = False
    is_dismissed: Optional[bool] = False
    application_status: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class JobMatchExplanation(BaseModel):
    job_id: int
    match_score: float
    score_explanation: str
    matched_skills: List[str]
    missing_skills: List[str]
    role_relevance_score: float
    skill_coverage_pct: float
    experience_eligible: bool
    location_match: bool
    ai_model_used: str
    tailoring_suggestions: List[str] = []

class CompanyResearchResponse(BaseModel):
    company_name: str
    domain: Optional[str]
    overview: Optional[str]
    products_services: Optional[str]
    industry: Optional[str]
    engineering_focus: Optional[str]
    tech_stack: List[str]
    public_news: Optional[str]
    careers_url: Optional[str]
    linkedin_url: Optional[str]
    last_researched_at: Optional[datetime.datetime]
    sources: List[Dict[str, Any]] = []

class RecruiterContactResponse(BaseModel):
    id: int
    full_name: Optional[str]
    email: str
    title: Optional[str]
    linkedin_url: Optional[str]
    verification_status: str # "verified", "unverified", "invalid"
    verification_method: Optional[str]
    source_url: Optional[str]
    verified_at: Optional[datetime.datetime]
    
    model_config = ConfigDict(from_attributes=True)

# ----------------- APPLICATION SCHEMAS -----------------
class ApplicationCreate(BaseModel):
    job_id: int
    resume_id: Optional[int] = None
    status: str = "Ready to Apply"
    notes: Optional[str] = None

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    interview_date: Optional[datetime.datetime] = None
    follow_up_date: Optional[datetime.datetime] = None
    offer_amount: Optional[str] = None
    notes: Optional[str] = None
    resume_id: Optional[int] = None

class ApplicationEventResponse(BaseModel):
    id: int
    event_type: str
    from_status: Optional[str]
    to_status: Optional[str]
    description: str
    metadata_json: Dict[str, Any]
    created_at: datetime.datetime
    
    model_config = ConfigDict(from_attributes=True)

class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    job_id: int
    resume_id: Optional[int]
    status: str
    applied_at: Optional[datetime.datetime]
    interview_date: Optional[datetime.datetime]
    follow_up_date: Optional[datetime.datetime]
    offer_amount: Optional[str]
    notes: Optional[str]
    source: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    job: JobResponse
    events: List[ApplicationEventResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

class FollowUpCreate(BaseModel):
    application_id: int
    title: str
    due_date: datetime.datetime
    notes: Optional[str] = None

class FollowUpResponse(BaseModel):
    id: int
    application_id: int
    title: str
    due_date: datetime.datetime
    status: str
    notes: Optional[str]
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    created_at: datetime.datetime
    
    model_config = ConfigDict(from_attributes=True)

# ----------------- EMAIL SCHEMAS -----------------
class EmailDraftGenerateRequest(BaseModel):
    job_id: int
    recruiter_contact_id: Optional[int] = None
    tone: Optional[str] = "professional" # professional, conversational, concise

class EmailDraftCreate(BaseModel):
    application_id: Optional[int] = None
    recruiter_contact_id: Optional[int] = None
    recipient_email: EmailStr
    recipient_name: Optional[str] = None
    subject: str
    body_text: str
    body_html: Optional[str] = None
    attach_resume: bool = True

class EmailResponse(BaseModel):
    id: int
    recipient_email: str
    recipient_name: Optional[str]
    subject: str
    body_html: str
    body_text: str
    status: str # "draft", "queued", "sent", "failed", "skipped"
    is_reply: bool
    reply_classification: Optional[str]
    reply_summary: Optional[str]
    gmail_message_id: Optional[str]
    error_message: Optional[str]
    sent_at: Optional[datetime.datetime]
    created_at: datetime.datetime
    
    model_config = ConfigDict(from_attributes=True)

class SyncRepliesResponse(BaseModel):
    synced_count: int
    replies_found: int
    last_sync_at: datetime.datetime
    status: str

# ----------------- AUTOMATION SCHEMAS -----------------
class AutomationSettingsUpdate(BaseModel):
    is_globally_paused: Optional[bool] = None
    auto_scan_enabled: Optional[bool] = None
    auto_email_enabled: Optional[bool] = None
    auto_uipath_enabled: Optional[bool] = None
    review_before_send: Optional[bool] = None
    daily_email_limit: Optional[int] = None
    match_threshold: Optional[int] = None

class AutomationSettingsResponse(BaseModel):
    is_globally_paused: bool
    auto_scan_enabled: bool
    auto_email_enabled: bool
    auto_uipath_enabled: bool
    review_before_send: bool
    daily_email_limit: int
    match_threshold: int
    last_scan_run: Optional[datetime.datetime]
    next_scheduled_scan: Optional[datetime.datetime]
    
    model_config = ConfigDict(from_attributes=True)

class AutomationRunResponse(BaseModel):
    id: int
    run_type: str
    status: str
    items_processed: int
    items_succeeded: int
    items_failed: int
    log_output: Optional[str]
    started_at: datetime.datetime
    completed_at: Optional[datetime.datetime]
    
    model_config = ConfigDict(from_attributes=True)

class UiPathJobResponse(BaseModel):
    id: int
    application_id: int
    process_name: str
    orchestrator_job_id: Optional[str]
    status: str
    manual_intervention_reason: Optional[str]
    error_message: Optional[str]
    started_at: datetime.datetime
    completed_at: Optional[datetime.datetime]
    
    model_config = ConfigDict(from_attributes=True)

class TriggerRpaRequest(BaseModel):
    application_id: int
    process_name: Optional[str] = "JobApplicationSubmission"

# ----------------- ANALYTICS SCHEMAS -----------------
class DashboardMetrics(BaseModel):
    total_discovered: int
    matching_preferences: int
    applications_submitted: int
    recruiter_emails_sent: int
    responses_received: int
    interviews_scheduled: int
    offers_received: int
    upcoming_followups: int
    
    application_conversion_rate: float
    email_response_rate: float
    interview_conversion_rate: float
    offer_conversion_rate: float

class StatusCount(BaseModel):
    status: str
    count: int

class SourceCount(BaseModel):
    source: str
    discovered: int
    applied: int
    interviews: int

class ActivityPoint(BaseModel):
    date: str
    applications: int
    emails: int
    interviews: int

class MatchScoreBucket(BaseModel):
    range_label: str # "90-100%", "80-89%", "70-79%", "<70%"
    count: int
    responded_count: int

class AnalyticsPortalResponse(BaseModel):
    metrics: DashboardMetrics
    status_distribution: List[StatusCount]
    source_performance: List[SourceCount]
    activity_timeline: List[ActivityPoint]
    match_score_distribution: List[MatchScoreBucket]
    avg_days_to_apply: float
