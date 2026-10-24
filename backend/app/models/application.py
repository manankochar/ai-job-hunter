import datetime
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, String, Text, JSON, Float, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    
    # Status lifecycle
    # Discovered, Matched, Saved, Ready to Apply, Applied, Recruiter Contacted, Recruiter Responded, Interview, Offer, Rejected, Withdrawn, Archived
    status = Column(String(50), default="Saved", index=True, nullable=False)
    
    applied_at = Column(DateTime, nullable=True)
    interview_date = Column(DateTime, nullable=True)
    follow_up_date = Column(DateTime, nullable=True)
    offer_amount = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    source = Column(String(50), default="direct")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    events = relationship("ApplicationEvent", back_populates="application", cascade="all, delete-orphan")
    follow_ups = relationship("FollowUpTask", back_populates="application", cascade="all, delete-orphan")
    emails = relationship("EmailMessage", back_populates="application", cascade="all, delete-orphan")
    uipath_jobs = relationship("UiPathJob", back_populates="application", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('user_id', 'job_id', name='uq_user_job_application'),
    )

class ApplicationEvent(Base):
    __tablename__ = "application_events"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False) # status_changed, note_added, email_sent, reply_received, interview_scheduled, offer_received, rpa_started
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    application = relationship("Application", back_populates="events")

class FollowUpTask(Base):
    __tablename__ = "follow_up_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    due_date = Column(DateTime, nullable=False, index=True)
    status = Column(String(50), default="pending") # pending, completed, dismissed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    application = relationship("Application", back_populates="follow_ups")
