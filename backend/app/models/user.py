import datetime
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, String, Text, JSON, Float, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True) # Optional for pure OAuth users
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Encrypted Gmail integration tokens
    gmail_connected = Column(Boolean, default=False)
    gmail_email = Column(String(255), nullable=True)
    gmail_access_token_encrypted = Column(Text, nullable=True)
    gmail_refresh_token_encrypted = Column(Text, nullable=True)
    gmail_token_expires_at = Column(DateTime, nullable=True)
    gmail_scopes = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")
    automation_settings = relationship("AutomationSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    matches = relationship("JobMatch", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    email_messages = relationship("EmailMessage", back_populates="user", cascade="all, delete-orphan")
    automation_runs = relationship("AutomationRun", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    headline = Column(String(255), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    portfolio_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    years_experience = Column(Float, default=0.0)
    
    # Onboarding tracking
    onboarding_completed = Column(Boolean, default=False)
    onboarding_step = Column(Integer, default=1)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="profile")

class UserPreferences(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    target_titles = Column(JSON, default=list) # e.g. ["Full Stack Engineer", "Backend Developer"]
    skills = Column(JSON, default=list)        # e.g. ["Python", "FastAPI", "React", "PostgreSQL"]
    locations = Column(JSON, default=list)     # e.g. ["San Francisco, CA", "Remote", "New York, NY"]
    remote_preference = Column(String(50), default="any") # "remote", "hybrid", "onsite", "any"
    employment_types = Column(JSON, default=lambda: ["full-time"]) # ["full-time", "contract", "internship"]
    experience_level = Column(String(50), default="mid") # "entry", "mid", "senior", "lead"
    min_salary = Column(Integer, nullable=True)
    target_companies = Column(JSON, default=list)
    excluded_companies = Column(JSON, default=list)
    excluded_keywords = Column(JSON, default=list)
    requires_sponsorship = Column(Boolean, default=False)
    min_match_score = Column(Integer, default=70) # Minimum match percentage to consider
    daily_scan_frequency = Column(Integer, default=1) # scans per day
    max_emails_per_day = Column(Integer, default=10)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="preferences")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False) # e.g. "email.sent", "resume.uploaded", "account.deleted"
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(String(100), nullable=True)
    details = Column(JSON, default=dict)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    user = relationship("User", back_populates="audit_logs")
