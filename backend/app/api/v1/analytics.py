from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.schemas import AnalyticsPortalResponse
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics Portal"])

@router.get("/dashboard", response_model=AnalyticsPortalResponse)
async def get_dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns real database-backed SaaS metrics, conversion funnels,
    Recharts timeline data, source performance, and match score distributions.
    """
    return await analytics_service.get_dashboard_analytics(db, current_user.id)
