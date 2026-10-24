import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), default="Primary Resume")
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False) # "pdf", "docx", "txt"
    file_size_bytes = Column(Integer, default=0)
    raw_text = Column(Text, nullable=False)
    
    # Structured parsed content (contact, summary, experience, education, skills, projects, certifications)
    parsed_json = Column(JSON, default=dict)
    
    is_primary = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="resumes")
    versions = relationship("ResumeVersion", back_populates="resume", cascade="all, delete-orphan")
    skills = relationship("ResumeSkill", back_populates="resume", cascade="all, delete-orphan")

class ResumeVersion(Base):
    __tablename__ = "resume_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, default=1)
    tailored_job_title = Column(String(255), nullable=True)
    full_text = Column(Text, nullable=False)
    diff_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    resume = relationship("Resume", back_populates="versions")

class ResumeSkill(Base):
    __tablename__ = "resume_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), default="technical") # "frontend", "backend", "cloud", "ai/ml", "database", "soft"
    years_experience = Column(Integer, nullable=True)
    verified = Column(Boolean, default=True)
    
    resume = relationship("Resume", back_populates="skills")
