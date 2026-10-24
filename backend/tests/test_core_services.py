import pytest
import datetime
from app.services.gemini_service import gemini_service
from app.services.job_sources.greenhouse import GreenhouseAdapter
from app.services.job_sources.lever import LeverAdapter
from app.services.job_sources.ashby import AshbyAdapter
from app.services.uipath_service import uipath_service

@pytest.mark.asyncio
async def test_auth_registration_and_login(client):
    # 1. Register new user
    reg_payload = {
        "email": "test.user@example.com",
        "password": "SecurePassword123!",
        "full_name": "Test User"
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 200
    token_data = reg_res.json()
    assert "access_token" in token_data
    assert token_data["email"] == "test.user@example.com"
    token = token_data["access_token"]

    # 2. Login with valid credentials
    login_payload = {
        "email": "test.user@example.com",
        "password": "SecurePassword123!"
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 3. Access protected profile route
    headers = {"Authorization": f"Bearer {token}"}
    prof_res = await client.get("/api/v1/users/profile", headers=headers)
    assert prof_res.status_code == 200
    assert prof_res.json()["user_id"] == token_data["user_id"]

@pytest.mark.asyncio
async def test_resume_parser_fallback():
    sample_text = """
    Jane Doe
    jane.doe@example.com
    (555) 123-4567
    Senior Full Stack Engineer with experience building scalable web applications.
    Skills: Python, TypeScript, React, PostgreSQL, Docker, AWS, FastAPI.
    """
    parsed = await gemini_service.parse_and_structure_resume(sample_text)
    assert parsed["full_name"] is not None
    assert parsed["email"] == "jane.doe@example.com"
    skills = [s.lower() for s in parsed.get("skills", [])]
    assert "python" in skills
    assert "react" in skills
    assert "fastapi" in skills

@pytest.mark.asyncio
async def test_job_match_score_calculation():
    resume_skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "React"]
    job_required = ["Python", "FastAPI", "PostgreSQL"]
    job_preferred = ["Docker", "Kubernetes"]

    result = await gemini_service.match_resume_to_job(
        resume_skills=resume_skills,
        resume_summary="Experienced backend software engineer.",
        job_title="Senior Python Backend Engineer",
        job_description="Seeking a Python Backend Engineer to build robust APIs with FastAPI and PostgreSQL.",
        job_required_skills=job_required,
        job_preferred_skills=job_preferred,
        user_preferences={}
    )

    assert result["match_score"] >= 80.0
    assert "score_explanation" in result
    assert "Python" in result["matched_skills"] or "python" in [s.lower() for s in result["matched_skills"]]

@pytest.mark.asyncio
async def test_job_source_normalizers():
    # 1. Greenhouse Normalization
    gh_adapter = GreenhouseAdapter()
    gh_raw = {
        "id": 12345,
        "title": "Backend Software Engineer",
        "absolute_url": "https://boards.greenhouse.io/figma/jobs/12345?gh_jid=12345",
        "location": {"name": "Remote"},
        "content": "<p>We are looking for engineers with Python, PostgreSQL, and Docker experience.</p>",
        "_company_name": "Figma",
        "_board_token": "figma"
    }
    norm_gh = gh_adapter.normalize_job(gh_raw)
    assert norm_gh.source == "greenhouse"
    assert norm_gh.title == "Backend Software Engineer"
    assert norm_gh.company_name == "Figma"
    assert norm_gh.remote_type == "remote"
    assert "https://boards.greenhouse.io/figma/jobs/12345" in norm_gh.normalized_url

    # 2. Lever Normalization
    lever_adapter = LeverAdapter()
    lever_raw = {
        "id": "lever-99",
        "text": "Frontend Engineer",
        "hostedUrl": "https://jobs.lever.co/spotify/lever-99",
        "categories": {"location": "Remote"},
        "descriptionPlain": "Build user interfaces with TypeScript and React.",
        "_company_name": "Spotify"
    }
    norm_lever = lever_adapter.normalize_job(lever_raw)
    assert norm_lever.source == "lever"
    assert norm_lever.company_name == "Spotify"
    assert "TypeScript" in norm_lever.skills_required or "React" in norm_lever.skills_required

@pytest.mark.asyncio
async def test_uipath_mock_adapter():
    assert uipath_service.is_configured is False
    health = await uipath_service.health_check()
    assert health["status"] == "mock_mode"
    assert health["configured"] is False

@pytest.mark.asyncio
async def test_analytics_empty_denominators(client):
    # Register a brand new user with 0 applications
    reg_res = await client.post("/api/v1/auth/register", json={
        "email": "empty.user@example.com",
        "password": "Password123!",
        "full_name": "Empty User"
    })
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch dashboard analytics
    analytics_res = await client.get("/api/v1/analytics/dashboard", headers=headers)
    assert analytics_res.status_code == 200
    data = analytics_res.json()
    metrics = data["metrics"]
    
    # Must safely handle empty division without crashing or throwing NaN
    assert metrics["application_conversion_rate"] == 0.0
    assert metrics["email_response_rate"] == 0.0
    assert metrics["interview_conversion_rate"] == 0.0
    assert metrics["offer_conversion_rate"] == 0.0
