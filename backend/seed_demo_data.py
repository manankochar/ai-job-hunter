import asyncio
import datetime
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import (
    User, UserProfile, UserPreferences, Resume, ResumeSkill,
    Job, JobMatch, CompanyProfile, CompanyResearchSource, RecruiterContact,
    Application, ApplicationEvent, EmailMessage, AutomationSettings, AutomationRun
)

async def seed_data():
    print("Initializing database tables for seeding...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check if demo user already exists
        res = await session.execute(select(User).where(User.email == "alex.developer@gmail.com"))
        existing_user = res.scalar_one_or_none()
        if existing_user:
            print("Demo user already exists. Seeding skipped.")
            return

        print("Seeding demonstration user: alex.developer@gmail.com (Password: password123)...")
        demo_user = User(
            email="alex.developer@gmail.com",
            hashed_password=get_password_hash("password123"),
            full_name="Alex Developer",
            is_active=True,
            is_verified=True,
            gmail_connected=True,
            gmail_email="alex.developer@gmail.com",
            gmail_scopes=["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.readonly"]
        )
        session.add(demo_user)
        await session.flush()

        # Profile
        profile = UserProfile(
            user_id=demo_user.id,
            phone="+1 (415) 555-0199",
            location="San Francisco, CA (Open to Remote)",
            headline="Senior Full Stack Software Engineer",
            linkedin_url="https://linkedin.com/in/alex-developer-demo",
            github_url="https://github.com/alex-dev-demo",
            portfolio_url="https://alexdeveloper.dev",
            bio="Full stack engineer specializing in Python, FastAPI, React, and cloud distributed architectures with 5+ years building SaaS products.",
            years_experience=5.5,
            onboarding_completed=True,
            onboarding_step=7
        )
        session.add(profile)

        # Preferences
        prefs = UserPreferences(
            user_id=demo_user.id,
            target_titles=["Senior Full Stack Engineer", "Backend Software Engineer", "Platform Engineer"],
            skills=["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Docker", "AWS", "Redis"],
            locations=["Remote", "San Francisco, CA", "New York, NY"],
            remote_preference="any",
            employment_types=["full-time"],
            experience_level="senior",
            min_salary=140000,
            target_companies=["Linear", "Figma", "Spotify", "Cloudflare", "Ramp"],
            excluded_companies=["OldTech Legacy Inc"],
            excluded_keywords=["C#", ".NET", "PHP"],
            requires_sponsorship=False,
            min_match_score=70,
            daily_scan_frequency=1,
            max_emails_per_day=10
        )
        session.add(prefs)

        # Automation Settings
        auto_sett = AutomationSettings(
            user_id=demo_user.id,
            is_globally_paused=False,
            auto_scan_enabled=True,
            auto_email_enabled=False,
            review_before_send=True,
            daily_email_limit=10,
            match_threshold=75,
            last_scan_run=datetime.datetime.utcnow() - datetime.timedelta(hours=6),
            next_scheduled_scan=datetime.datetime.utcnow() + datetime.timedelta(hours=18)
        )
        session.add(auto_sett)

        # Demo Resume
        resume_parsed = {
            "full_name": "Alex Developer",
            "email": "alex.developer@gmail.com",
            "phone": "+1 (415) 555-0199",
            "location": "San Francisco, CA",
            "headline": "Senior Full Stack Engineer",
            "summary": "Full Stack Engineer with 5+ years of experience architecting high-throughput microservices, real-time web applications, and AI-enabled software. Strong background in Python, FastAPI, TypeScript, React, and PostgreSQL.",
            "skills": ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Docker", "AWS", "Redis", "GraphQL", "CI/CD", "Next.js"],
            "experience": [
                {
                    "company": "CloudScale Systems",
                    "title": "Senior Software Engineer",
                    "start_date": "03/2022",
                    "end_date": "Present",
                    "description": "Led backend architecture for high-concurrency event ingestion pipeline handling 50M daily events using FastAPI and PostgreSQL. Reduced query latency by 45% using Redis caching."
                },
                {
                    "company": "Apex Labs",
                    "title": "Full Stack Engineer",
                    "start_date": "08/2019",
                    "end_date": "02/2022",
                    "description": "Built responsive React and TypeScript customer portals. Designed RESTful endpoints, implemented automated testing, and integrated Stripe billing."
                }
            ],
            "education": [
                {
                    "institution": "University of California, Berkeley",
                    "degree": "B.S. in Computer Science",
                    "graduation_year": "2019"
                }
            ],
            "certifications": ["AWS Certified Solutions Architect – Associate"],
            "projects": [
                {
                    "name": "Distributed Job Scheduler",
                    "description": "Open source fault-tolerant job queue built with Python and Redis.",
                    "technologies": ["Python", "Redis", "Docker"]
                }
            ]
        }

        resume = Resume(
            user_id=demo_user.id,
            title="Senior Full Stack Resume (2026)",
            file_name="Alex_Developer_Resume_2026.pdf",
            file_path="./uploads/demo_resume.pdf",
            file_type="pdf",
            file_size_bytes=1048576,
            raw_text="Alex Developer - Senior Full Stack Engineer. Python, FastAPI, React, TypeScript, PostgreSQL, Docker, AWS.",
            parsed_json=resume_parsed,
            is_primary=True
        )
        session.add(resume)
        await session.flush()

        for s in resume_parsed["skills"]:
            session.add(ResumeSkill(
                resume_id=resume.id,
                user_id=demo_user.id,
                skill_name=s,
                category="technical",
                verified=True
            ))

        # Seed Companies & Jobs
        companies_data = [
            {
                "name": "Linear",
                "domain": "linear.app",
                "industry": "Productivity Software",
                "overview": "Linear is a purpose-built tool for modern software development teams, streamlining issues, sprints, and product roadmaps with unmatched speed.",
                "engineering_focus": "Extreme client-side performance, real-time synchronization, and high craft ergonomics.",
                "tech_stack": ["TypeScript", "React", "GraphQL", "PostgreSQL", "Node.js"],
                "careers_url": "https://jobs.ashbyhq.com/linear",
                "recruiter": {
                    "name": "Sarah Jenkins",
                    "email": "sarah.jenkins@linear.app",
                    "title": "Head of Technical Talent",
                    "status": "verified",
                    "method": "official_job_post"
                },
                "job": {
                    "source": "ashby",
                    "source_id": "linear-senior-fullstack",
                    "title": "Senior Full Stack Engineer (Sync Engine)",
                    "location": "Remote (US & Europe)",
                    "remote_type": "remote",
                    "min_salary": 165000,
                    "max_salary": 220000,
                    "url": "https://jobs.ashbyhq.com/linear/senior-fullstack-engineer",
                    "skills_req": ["TypeScript", "React", "Node.js", "GraphQL", "PostgreSQL"],
                    "skills_pref": ["Rust", "Real-time systems"],
                    "desc": "Join our core product team building the next generation of issue tracking and project management. We are seeking an exceptional engineer to work across the stack from our client-side database to backend GraphQL APIs.",
                    "match_score": 94.0,
                    "explanation": "Outstanding match (94%). You possess 100% of required technical proficiencies (TypeScript, React, PostgreSQL) and 5+ years relevant full-stack production experience."
                }
            },
            {
                "name": "Cloudflare",
                "domain": "cloudflare.com",
                "industry": "Cloud Computing & Cyber Security",
                "overview": "Cloudflare is on a mission to build a better Internet. We protect and accelerate millions of web properties across global edge networks.",
                "engineering_focus": "Global distributed systems, edge computing, high-performance networking, and Rust/Go infrastructure.",
                "tech_stack": ["Go", "Python", "Rust", "PostgreSQL", "Docker", "Kubernetes"],
                "careers_url": "https://boards.greenhouse.io/cloudflare",
                "recruiter": {
                    "name": "Marcus Vance",
                    "email": "marcus.vance@cloudflare.com",
                    "title": "Senior Engineering Recruiter",
                    "status": "verified",
                    "method": "company_portal"
                },
                "job": {
                    "source": "greenhouse",
                    "source_id": "cloudflare-platform-backend",
                    "title": "Backend Software Engineer - Platform APIs",
                    "location": "San Francisco, CA (Hybrid)",
                    "remote_type": "hybrid",
                    "min_salary": 155000,
                    "max_salary": 205000,
                    "url": "https://boards.greenhouse.io/cloudflare/jobs/platform-backend",
                    "skills_req": ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"],
                    "skills_pref": ["Go", "Kubernetes", "Redis"],
                    "desc": "We are seeking a Backend Software Engineer to design, scale, and optimize Cloudflare's core platform microservices and public developer APIs.",
                    "match_score": 91.5,
                    "explanation": "Strong match (91.5%). Your extensive background with Python, FastAPI, PostgreSQL, and Docker aligns directly with Cloudflare's platform requirements."
                }
            },
            {
                "name": "Spotify",
                "domain": "spotify.com",
                "industry": "Audio & Streaming Media",
                "overview": "Spotify is the world's most popular audio streaming subscription service with 600M+ active users.",
                "engineering_focus": "Autonomous squads, distributed data pipelines, recommendations AI, and resilient microservices.",
                "tech_stack": ["Python", "Java", "GCP", "PostgreSQL", "Docker"],
                "careers_url": "https://jobs.lever.co/spotify",
                "recruiter": {
                    "name": "Elena Rostova",
                    "email": "elena.r@spotify.com",
                    "title": "Technical Talent Partner",
                    "status": "verified",
                    "method": "official_job_post"
                },
                "job": {
                    "source": "lever",
                    "source_id": "spotify-backend-core",
                    "title": "Backend Engineer - Creator Tools",
                    "location": "Remote - Americas",
                    "remote_type": "remote",
                    "min_salary": 150000,
                    "max_salary": 195000,
                    "url": "https://jobs.lever.co/spotify/creator-tools-backend",
                    "skills_req": ["Python", "Docker", "PostgreSQL", "REST API"],
                    "skills_pref": ["Java", "GCP", "Kafka"],
                    "desc": "Build the tools that millions of creators and artists use daily to share their music and engage with fans worldwide.",
                    "match_score": 86.0,
                    "explanation": "High match (86%). Strong skill coverage in Python, Docker, and relational databases."
                }
            },
            {
                "name": "Figma",
                "domain": "figma.com",
                "industry": "Design & Collaboration",
                "overview": "Figma is the leading collaborative interface design tool connecting designers, product managers, and engineers.",
                "engineering_focus": "WebAssembly, high performance graphics rendering, real-time multiplayer multiplayer servers, and developer tooling.",
                "tech_stack": ["TypeScript", "React", "Rust", "C++", "AWS"],
                "careers_url": "https://boards.greenhouse.io/figma",
                "recruiter": None,
                "job": {
                    "source": "greenhouse",
                    "source_id": "figma-dev-mode",
                    "title": "Full Stack Engineer - Dev Mode",
                    "location": "San Francisco, CA / Remote",
                    "remote_type": "remote",
                    "min_salary": 170000,
                    "max_salary": 230000,
                    "url": "https://boards.greenhouse.io/figma/jobs/dev-mode-fullstack",
                    "skills_req": ["TypeScript", "React", "Node.js", "AWS"],
                    "skills_pref": ["Design Systems", "WebAssembly"],
                    "desc": "Build Figma Dev Mode, helping millions of software engineers translate visual design specs into production code seamlessly.",
                    "match_score": 88.0,
                    "explanation": "Strong match (88%). You meet all core requirements for React and TypeScript development."
                }
            },
            {
                "name": "Ramp",
                "domain": "ramp.com",
                "industry": "FinTech & Corporate Cards",
                "overview": "Ramp is the ultimate finance operations platform designed to save companies time and money.",
                "engineering_focus": "High-velocity product shipping, rigorous financial correctness, and automated intelligence.",
                "tech_stack": ["Python", "FastAPI", "React", "PostgreSQL", "AWS"],
                "careers_url": "https://jobs.ashbyhq.com/ramp",
                "recruiter": {
                    "name": "David Chen",
                    "email": "david.chen@ramp.com",
                    "title": "Senior Talent Partner",
                    "status": "verified",
                    "method": "official_job_post"
                },
                "job": {
                    "source": "ashby",
                    "source_id": "ramp-fullstack-eng",
                    "title": "Software Engineer - Accounting Automation",
                    "location": "New York, NY (Hybrid)",
                    "remote_type": "hybrid",
                    "min_salary": 160000,
                    "max_salary": 215000,
                    "url": "https://jobs.ashbyhq.com/ramp/accounting-automation",
                    "skills_req": ["Python", "React", "PostgreSQL", "FastAPI"],
                    "skills_pref": ["Fintech experience", "AWS"],
                    "desc": "Automate financial reconciliation and ERP synchronization across thousands of corporate entities.",
                    "match_score": 96.0,
                    "explanation": "Near-perfect match (96%). Your stack (Python, FastAPI, React, PostgreSQL) is a direct mirror of Ramp's core architecture."
                }
            }
        ]

        created_jobs = []
        for c_data in companies_data:
            company = CompanyProfile(
                company_name=c_data["name"],
                domain=c_data["domain"],
                industry=c_data["industry"],
                overview=c_data["overview"],
                engineering_focus=c_data["engineering_focus"],
                tech_stack=c_data["tech_stack"],
                careers_url=c_data["careers_url"],
                last_researched_at=datetime.datetime.utcnow() - datetime.timedelta(days=2)
            )
            session.add(company)
            await session.flush()

            # Source link
            session.add(CompanyResearchSource(
                company_id=company.id,
                title=f"{c_data['name']} Official Careers Portal",
                url=c_data["careers_url"],
                snippet=f"Official corporate overview and openings for {c_data['name']}",
                verified=True
            ))

            # Job
            j_info = c_data["job"]
            job = Job(
                source=j_info["source"],
                source_id=j_info["source_id"],
                normalized_url=j_info["url"].lower(),
                original_url=j_info["url"],
                title=j_info["title"],
                company_name=c_data["name"],
                company_id=company.id,
                location=j_info["location"],
                remote_type=j_info["remote_type"],
                employment_type="full-time",
                min_salary=j_info["min_salary"],
                max_salary=j_info["max_salary"],
                currency="USD",
                description=j_info["desc"],
                skills_required=j_info["skills_req"],
                skills_preferred=j_info["skills_pref"],
                experience_level="senior",
                posted_at=datetime.datetime.utcnow() - datetime.timedelta(days=3)
            )
            session.add(job)
            await session.flush()
            created_jobs.append(job)

            # Recruiter Contact if available
            recruiter_contact = None
            if c_data.get("recruiter"):
                r_info = c_data["recruiter"]
                recruiter_contact = RecruiterContact(
                    company_id=company.id,
                    job_id=job.id,
                    full_name=r_info["name"],
                    email=r_info["email"],
                    title=r_info["title"],
                    verification_status=r_info["status"],
                    verification_method=r_info["method"],
                    source_url=job.original_url,
                    verified_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
                )
                session.add(recruiter_contact)
                await session.flush()

            # Match
            match = JobMatch(
                user_id=demo_user.id,
                job_id=job.id,
                match_score=j_info["match_score"],
                score_explanation=j_info["explanation"],
                matched_skills=j_info["skills_req"],
                missing_skills=j_info["skills_pref"][:1],
                role_relevance_score=j_info["match_score"],
                skill_coverage_pct=90.0,
                experience_eligible=True,
                location_match=True,
                ai_model_used="gemini-2.5-flash",
                is_saved=False
            )
            session.add(match)

        # Seed Pipeline Applications
        # 1. Linear -> Interview scheduled
        app1 = Application(
            user_id=demo_user.id,
            job_id=created_jobs[0].id,
            resume_id=resume.id,
            status="Interview",
            applied_at=datetime.datetime.utcnow() - datetime.timedelta(days=5),
            interview_date=datetime.datetime.utcnow() + datetime.timedelta(days=2, hours=3),
            follow_up_date=datetime.datetime.utcnow() + datetime.timedelta(days=3),
            notes="Introductory technical screen scheduled with engineering lead.",
            source="ashby"
        )
        session.add(app1)
        await session.flush()

        session.add(ApplicationEvent(
            application_id=app1.id,
            user_id=demo_user.id,
            event_type="status_changed",
            from_status="Ready to Apply",
            to_status="Interview",
            description="Interview scheduled: Introductory technical discussion with team lead."
        ))

        # 2. Cloudflare -> Recruiter Contacted
        app2 = Application(
            user_id=demo_user.id,
            job_id=created_jobs[1].id,
            resume_id=resume.id,
            status="Recruiter Contacted",
            applied_at=datetime.datetime.utcnow() - datetime.timedelta(days=2),
            follow_up_date=datetime.datetime.utcnow() + datetime.timedelta(days=3),
            notes="Personalized email sent to verified recruiter Marcus Vance.",
            source="greenhouse"
        )
        session.add(app2)
        await session.flush()

        # Outreach email for Cloudflare
        sent_email = EmailMessage(
            user_id=demo_user.id,
            application_id=app2.id,
            recipient_email="marcus.vance@cloudflare.com",
            recipient_name="Marcus Vance",
            subject="Application: Backend Software Engineer - Alex Developer",
            body_text="Hi Marcus,\n\nI noticed the Backend Software Engineer opening at Cloudflare and wanted to reach out directly. With proven experience building production backend systems with Python, FastAPI, and PostgreSQL, I believe my background aligns well with the team's goals.\n\nDo you have 10 minutes later this week for a brief conversation?\n\nBest regards,\nAlex Developer",
            body_html="<p>Hi Marcus,</p><p>I noticed the Backend Software Engineer opening at Cloudflare...</p>",
            status="sent",
            has_attachment=True,
            attachment_name="Alex_Developer_Resume_2026.pdf",
            gmail_message_id="mock_gmail_msg_1719283921_1",
            sent_at=datetime.datetime.utcnow() - datetime.timedelta(days=2)
        )
        session.add(sent_email)

        # 3. Ramp -> Ready to Apply
        app3 = Application(
            user_id=demo_user.id,
            job_id=created_jobs[4].id,
            resume_id=resume.id,
            status="Ready to Apply",
            notes="96% match score. Ready for review and outreach.",
            source="ashby"
        )
        session.add(app3)

        # 4. Spotify -> Saved
        app4 = Application(
            user_id=demo_user.id,
            job_id=created_jobs[2].id,
            resume_id=resume.id,
            status="Saved",
            notes="Saved to review salary band.",
            source="lever"
        )
        session.add(app4)

        # Automation Run History
        session.add(AutomationRun(
            user_id=demo_user.id,
            run_type="job_scan",
            status="success",
            items_processed=15,
            items_succeeded=5,
            items_failed=0,
            log_output="[SUCCESS] Scan completed across Greenhouse, Lever, and Ashby connectors. Discovered 5 new matching postings.",
            started_at=datetime.datetime.utcnow() - datetime.timedelta(hours=6),
            completed_at=datetime.datetime.utcnow() - datetime.timedelta(hours=6, seconds=-12)
        ))

        await session.commit()
        print("Successfully seeded production-grade demo data!")

if __name__ == "__main__":
    asyncio.run(seed_data())
