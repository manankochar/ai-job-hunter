import datetime
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, String, Text, JSON, Float, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class AutomationSettings(Base):
    __tablename__ = "automation_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Global pause switch
    is_globally_paused = Column(Boolean, default=False)
    
    # Feature-specific automation controls
    auto_scan_enabled = Column(Boolean, default=True)
    auto_email_enabled = Column(Boolean, default=False) # Safe default: false
    auto_uipath_enabled = Column(Boolean, default=False) # Safe default: false
    
    # Safeguards & Limits
    review_before_send = Column(Boolean, default=True) # Default: user reviews drafts before sending
    daily_email_limit = Column(Integer, default=10)
    match_threshold = Column(Integer, default=75) # minimum match score for automated pipeline
    
    scan_frequency_hours = Column(Integer, default=24) # daily scan
    last_scan_run = Column(DateTime, nullable=True)
    next_scheduled_scan = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="automation_settings")

class AutomationRun(Base):
    __tablename__ = "automation_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    run_type = Column(String(50), nullable=False) # "job_scan", "email_outreach", "sync_replies", "uipath_submission"
    status = Column(String(50), default="running") # "running", "success", "failed", "paused"
    items_processed = Column(Integer, default=0)
    items_succeeded = Column(Integer, default=0)
    items_failed = Column(Integer, default=0)
    log_output = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="automation_runs")

class UiPathJob(Base):
    __tablename__ = "uipath_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    
    process_name = Column(String(255), default="JobApplicationAutomation")
    process_key = Column(String(255), nullable=True)
    orchestrator_job_id = Column(String(255), nullable=True, index=True)
    
    # UiPath execution statuses:
    # "Pending", "Running", "Successful", "Faulted", "Stopped", "RequiresManualIntervention"
    status = Column(String(50), default="Pending", index=True)
    
    input_arguments = Column(JSON, default=dict)
    output_arguments = Column(JSON, default=dict)
    manual_intervention_reason = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    application = relationship("Application", back_populates="uipath_jobs")
