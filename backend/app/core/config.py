import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Job Hunter"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./ai_job_hunter.db",
        description="Async database connection string. Supports PostgreSQL (postgresql+asyncpg://...) or SQLite (sqlite+aiosqlite:///...)"
    )
    
    # Security
    SECRET_KEY: str = Field(
        default="ai-job-hunter-insecure-secret-key-change-in-production-2026",
        description="Secret key for JWT generation"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Fernet encryption key for OAuth tokens at rest (32 url-safe base64-encoded bytes)
    # Default is a generated valid Fernet key for local dev
    ENCRYPTION_KEY: str = Field(
        default="v9u12Jc6Bsm9y-l7cEaK17U_wB_X35o4F6KjL0Y7M8Q=",
        description="Fernet symmetric encryption key for OAuth tokens stored in DB"
    )
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    # Google Gemini AI
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API key")
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # Gmail OAuth
    GOOGLE_CLIENT_ID: str = Field(default="", description="Google OAuth Client ID")
    GOOGLE_CLIENT_SECRET: str = Field(default="", description="Google OAuth Client Secret")
    GOOGLE_REDIRECT_URI: str = "http://localhost:5173/auth/gmail/callback"
    
    # UiPath RPA Orchestrator
    UIPATH_BASE_URL: str = Field(default="https://cloud.uipath.com", description="UiPath Orchestrator base URL")
    UIPATH_ACCOUNT_LOGICAL_NAME: str = Field(default="", description="UiPath account name")
    UIPATH_TENANT_NAME: str = Field(default="", description="UiPath tenant name")
    UIPATH_FOLDER_ID: str = Field(default="", description="UiPath folder ID")
    UIPATH_CLIENT_ID: str = Field(default="", description="UiPath External Application Client ID")
    UIPATH_CLIENT_SECRET: str = Field(default="", description="UiPath Client Secret / User Key")
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_RESUME_SIZE_MB: int = 10
    
    # Daily automation safeguards
    DEFAULT_DAILY_EMAIL_LIMIT: int = 10
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
