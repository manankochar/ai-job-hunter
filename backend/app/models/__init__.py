from app.core.database import Base
from app.models.user import User, UserProfile, UserPreferences, AuditLog
from app.models.resume import Resume, ResumeVersion, ResumeSkill
from app.models.job import (
    JobSource, SourceScanRun, Job, JobMatch,
    CompanyProfile, CompanyResearchSource, RecruiterContact
)
from app.models.application import Application, ApplicationEvent, FollowUpTask
from app.models.email import EmailMessage, EmailSyncCursor
from app.models.automation import AutomationSettings, AutomationRun, UiPathJob

__all__ = [
    "Base",
    "User",
    "UserProfile",
    "UserPreferences",
    "AuditLog",
    "Resume",
    "ResumeVersion",
    "ResumeSkill",
    "JobSource",
    "SourceScanRun",
    "Job",
    "JobMatch",
    "CompanyProfile",
    "CompanyResearchSource",
    "RecruiterContact",
    "Application",
    "ApplicationEvent",
    "FollowUpTask",
    "EmailMessage",
    "EmailSyncCursor",
    "AutomationSettings",
    "AutomationRun",
    "UiPathJob",
]
