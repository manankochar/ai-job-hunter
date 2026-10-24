# AI JOB HUNTER — Multi-User Job Search & Application Automation SaaS

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![UiPath](https://img.shields.io/badge/RPA-UiPath%20Orchestrator-FA4616?logo=uipath&logoColor=white)](https://www.uipath.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20SQLite-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)

**AI Job Hunter** is a production-oriented, multi-user web SaaS platform that automates the technical job search lifecycle. It allows candidates to discover open positions across public Greenhouse, Lever, and Ashby job boards, structure and parse resumes, evaluate job fit using Google Gemini AI, draft personalized recruiter outreach emails via connected Gmail, automate application submissions through UiPath RPA workflows, and monitor their pipeline with real-time analytics.

---

## Key Capabilities

1. **Multi-Source Job Discovery Connectors**
   - Direct API connectors for **Greenhouse Public Boards**, **Lever Postings API**, and **Ashby Job Boards**.
   - URL normalization and job deduplication at the database level.
   - Honest status reporting for external partner networks (e.g. LinkedIn, Workday) that require partner authorization.

2. **Google Gemini AI Engine**
   - Structured JSON resume parsing (skills, experience, education, projects).
   - Evidence-based 0–100% semantic fit scoring with matched vs. missing skills breakdown.
   - Grounded company intelligence research with source citation links.
   - High-converting recruiter email generation grounded strictly in candidate qualifications.
   - Recruiter email reply classification (interview invitation, rejection, clarification, inquiry).
   - **Prompt Injection Guardrails:** Sanitizes and bounds all untrusted input (resumes, postings, emails).
   - **Deterministic Fallbacks:** Operates seamlessly even when external AI API keys are unconfigured.

3. **Gmail OAuth & Controlled Outreach**
   - Minimum required OAuth scopes (`send`, `readonly`, `userinfo.email`).
   - Tokens encrypted at rest using **AES Fernet symmetric cryptography**.
   - **Strict Verification Guardrails:** Outreach is only dispatched to verified contacts; never fabricates email addresses.
   - **Review-Before-Send Safeguards:** By default, drafts require user approval before sending.
   - Enforces configurable daily limits and duplicate protections.
   - Automatic reply synchronization and interview stage advancement.

4. **UiPath RPA Orchestrator Integration**
   - First-class UiPath adapter for authorized application submissions.
   - Submits jobs, tracks execution status (`Pending`, `Running`, `Successful`, `Faulted`), and surfaces manual intervention prompts (e.g., CAPTCHAs, declarations).
   - Includes high-fidelity mock adapter for local development when live Orchestrator credentials are not configured.

5. **Application Pipeline & Analytics Portal**
   - Dual **Kanban Board** and **Table View** with complete status lifecycle.
   - Event audit timeline, interview scheduling, and CSV export.
   - Analytics portal computed from real database aggregations:
     - Conversion funnels (Application rate, response rate, interview conversion, offer conversion).
     - Performance by job source connector.
     - Recharts 7-day velocity and activity curves.
     - Match score distributions with safe empty-denominator handling.

6. **Enterprise Security & Privacy (GDPR)**
   - Multi-tenant architecture: every user accesses solely their own resumes, preferences, and applications.
   - Permanent account and data deletion cascading across all tables and file uploads.
   - Comprehensive compliance audit logs.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │        React + TypeScript SPA        │
                      │  (Tailwind CSS, Lucide, Recharts)    │
                      └──────────────────┬───────────────────┘
                                         │ REST API / JWT
                      ┌──────────────────▼───────────────────┐
                      │          FastAPI Backend             │
                      │   (Pydantic v2, SQLAlchemy 2.0)      │
                      └─┬──────────────┬───────────────┬─────┘
                        │              │               │
       ┌────────────────▼───┐  ┌───────▼──────┐  ┌─────▼──────────────┐
       │   Google Gemini    │  │  Gmail API   │  │UiPath Orchestrator │
       │  Semantic Matcher  │  │OAuth2 Send   │  │   RPA Adapter      │
       └────────────────────┘  └──────────────┘  └────────────────────┘
                                       │
                      ┌────────────────▼─────────────────────┐
                      │    PostgreSQL / Async SQLite         │
                      │ (Users, Resumes, Jobs, Applications) │
                      └──────────────────────────────────────┘
```

---

## Quickstart Guide

### Option A: Local Development (Quick Run)

#### 1. Backend Setup
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt email-validator

# Run database seed with demo data
python seed_demo_data.py

# Start FastAPI backend
uvicorn app.main:app --reload --port 8000
```
- API Documentation (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)

#### 2. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
- Open [http://localhost:5173](http://localhost:5173) in your browser.

#### Demo User Credentials:
- **Email:** `alex.developer@gmail.com`
- **Password:** `password123`
*(Or click "Quick Demo Access" on the landing page)*

---

### Option B: Docker Compose (Full Stack)

```bash
# Clone and enter workspace
cd "AI JOB HUNTER"

# Start PostgreSQL, Backend, and Frontend containers
docker-compose up -d --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## UiPath Orchestrator Configuration Guide

To connect the application to an active UiPath Orchestrator cloud instance:

1. Log in to [UiPath Automation Cloud](https://cloud.uipath.com).
2. Navigate to **Admin** > **External Applications** > **Add Application**.
3. Set Application Type to **Confidential Application** with scopes:
   - `OR.Jobs`
   - `OR.Execution`
4. Copy the generated **Client ID** and **Client Secret**.
5. Update your `.env` or Docker configuration:
   ```env
   UIPATH_BASE_URL=https://cloud.uipath.com
   UIPATH_ACCOUNT_LOGICAL_NAME=your_account_name
   UIPATH_TENANT_NAME=your_tenant_name
   UIPATH_FOLDER_ID=your_folder_id
   UIPATH_CLIENT_ID=your_client_id
   UIPATH_CLIENT_SECRET=your_client_secret
   ```
6. When these environment variables are left blank, the application automatically runs in **high-fidelity mock RPA mode**, generating realistic execution IDs, status transitions, and portal confirmation tokens.

---

## Running Automated Tests

Run the backend test suite:
```powershell
cd backend
.\.venv\Scripts\pytest -v
```

Run the frontend TypeScript production build check:
```powershell
cd frontend
npm run build
```

---

## License

Proprietary SaaS Architecture. Designed and built for technical job seekers.
