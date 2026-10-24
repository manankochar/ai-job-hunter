import secrets
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user, log_audit_event
from app.models.user import User, AuditLog
from app.services.gemini_service import gemini_service
from app.services.gmail_service import gmail_service
from app.services.uipath_service import uipath_service
from app.services.job_sources.greenhouse import GreenhouseAdapter
from app.services.job_sources.lever import LeverAdapter
from app.services.job_sources.ashby import AshbyAdapter

router = APIRouter(prefix="/integrations", tags=["Integrations & Settings"])

class GmailCallbackRequest(BaseModel):
    code: str

@router.get("/status")
async def get_integrations_status(
    current_user: User = Depends(get_current_user)
):
    """
    Honest reporting of integration statuses. Never fabricates connection states.
    """
    uipath_health = await uipath_service.health_check()
    gh_adapter = GreenhouseAdapter()
    lever_adapter = LeverAdapter()
    ashby_adapter = AshbyAdapter()

    gh_health = await gh_adapter.health_check()
    lever_health = await lever_adapter.health_check()
    ashby_health = await ashby_adapter.health_check()

    return {
        "gemini": {
            "name": "Google Gemini AI",
            "is_configured": gemini_service.is_configured,
            "status": "connected" if gemini_service.is_configured else "fallback_mode",
            "model": settings.GEMINI_MODEL,
            "description": "Used for resume parsing, job matching, company research, and recruiter outreach drafting."
        },
        "gmail": {
            "name": "Google Gmail API",
            "is_connected": current_user.gmail_connected,
            "email": current_user.gmail_email,
            "status": "connected" if current_user.gmail_connected else "disconnected",
            "scopes": current_user.gmail_scopes or [],
            "description": "Used for controlled recruiter emails and reply tracking with user consent."
        },
        "uipath": {
            "name": "UiPath RPA Orchestrator",
            "is_configured": uipath_service.is_configured,
            "status": uipath_health.get("status", "mock_mode"),
            "details": uipath_health.get("message", ""),
            "description": "Used for permitted enterprise application workflow automation."
        },
        "job_sources": {
            "greenhouse": {
                "name": "Greenhouse Job Board",
                "status": gh_health.get("status", "healthy"),
                "type": "Public API Connector"
            },
            "lever": {
                "name": "Lever Postings API",
                "status": lever_health.get("status", "healthy"),
                "type": "Public API Connector"
            },
            "ashby": {
                "name": "Ashby Job Board",
                "status": ashby_health.get("status", "healthy"),
                "type": "Public API Connector"
            },
            "linkedin": {
                "name": "LinkedIn Jobs",
                "status": "requires_partner_credentials",
                "type": "Enterprise Partner API",
                "description": "Official integration requires approved LinkedIn Talent Solutions Partner API credentials. Unauthorized scraping is disabled."
            },
            "workday": {
                "name": "Workday",
                "status": "requires_tenant_credentials",
                "type": "Enterprise API",
                "description": "Integration requires client-specific Workday REST API client credentials."
            }
        }
    }

@router.get("/gmail/auth-url")
async def get_gmail_auth_url(
    current_user: User = Depends(get_current_user)
):
    state = secrets.token_urlsafe(16)
    auth_url = gmail_service.get_authorization_url(state=state)
    return {"auth_url": auth_url, "state": state}

@router.post("/gmail/callback")
async def handle_gmail_callback(
    req: GmailCallbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        tokens = await gmail_service.exchange_code_for_tokens(req.code)
        await gmail_service.save_gmail_connection(db, current_user, tokens)
        await log_audit_event(db, current_user.id, "gmail.connected", details={"email": tokens.get("email")})
        return {
            "status": "connected",
            "email": current_user.gmail_email,
            "is_mock": tokens.get("is_mock", False)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to connect Gmail: {str(e)}")

@router.post("/gmail/disconnect")
async def disconnect_gmail(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await gmail_service.disconnect_gmail(db, current_user)
    await log_audit_event(db, current_user.id, "gmail.disconnected")
    return {"status": "disconnected"}

@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(AuditLog)
        .where(AuditLog.user_id == current_user.id)
        .order_by(AuditLog.timestamp.desc())
        .limit(limit)
    )
    logs = res.scalars().all()
    return [
        {
            "id": l.id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": l.details,
            "timestamp": l.timestamp
        }
        for l in logs
    ]
