import datetime
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, String, Text, JSON, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class EmailMessage(Base):
    __tablename__ = "email_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="SET NULL"), nullable=True, index=True)
    recruiter_contact_id = Column(Integer, ForeignKey("recruiter_contacts.id", ondelete="SET NULL"), nullable=True)
    
    recipient_email = Column(String(255), nullable=False)
    recipient_name = Column(String(255), nullable=True)
    subject = Column(String(500), nullable=False)
    body_html = Column(Text, nullable=False)
    body_text = Column(Text, nullable=False)
    
    # Status: "draft", "queued", "sent", "failed", "skipped"
    status = Column(String(50), default="draft", index=True)
    
    # Gmail API tracking
    gmail_message_id = Column(String(255), nullable=True, index=True)
    gmail_thread_id = Column(String(255), nullable=True, index=True)
    
    # Classification & Reply Tracking
    is_reply = Column(Boolean, default=False)
    reply_classification = Column(String(50), nullable=True) # interview_invitation, rejection, clarification_needed, auto_reply, positive_inquiry
    reply_summary = Column(Text, nullable=True)
    
    # Attachments
    has_attachment = Column(Boolean, default=False)
    attachment_name = Column(String(255), nullable=True)
    
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="email_messages")
    application = relationship("Application", back_populates="emails")
    recruiter_contact = relationship("RecruiterContact", back_populates="emails")

class EmailSyncCursor(Base):
    __tablename__ = "email_sync_cursors"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    last_history_id = Column(String(255), nullable=True)
    last_sync_at = Column(DateTime, default=datetime.datetime.utcnow)
    sync_status = Column(String(50), default="idle") # idle, syncing, error
    error_message = Column(Text, nullable=True)
