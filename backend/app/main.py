import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base
import app.models # Registers all SQLAlchemy models
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.resumes import router as resumes_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.applications import router as applications_router
from app.api.v1.emails import router as emails_router
from app.api.v1.automation import router as automation_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.integrations import router as integrations_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_job_hunter")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema initialized.")
    yield
    logger.info("Shutting down application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multi-User Job Search and Application Automation SaaS API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development allow all; can be scoped to settings.CORS_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(resumes_router, prefix=settings.API_V1_STR)
app.include_router(jobs_router, prefix=settings.API_V1_STR)
app.include_router(applications_router, prefix=settings.API_V1_STR)
app.include_router(emails_router, prefix=settings.API_V1_STR)
app.include_router(automation_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(integrations_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected"
    }

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API. Visit /docs for OpenAPI documentation."
    }
