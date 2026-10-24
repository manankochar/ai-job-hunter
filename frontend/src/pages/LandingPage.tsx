import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  Mail,
  Cpu,
  BarChart2,
  CheckCircle,
  Lock,
  Globe,
  Database,
  Search,
  ExternalLink
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const LandingPage: React.FC = () => {
  const { isAuthenticated, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoSignIn = async () => {
    await googleLogin();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <span className="font-extrabold text-white tracking-tight text-lg">AI Job Hunter</span>
              <span className="text-[11px] text-slate-400 block -mt-0.5">Autonomous Career Platform</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Architecture</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
            <a href="#pricing" className="hover:text-white transition-colors">Plans</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth?mode=login"
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <button
                  onClick={handleDemoSignIn}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
                >
                  <span>Quick Demo Access</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Multi-User Autonomous Career SaaS • Powered by Google Gemini & UiPath</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Stop searching manually. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-200 to-sky-400">
              Automate your entire job hunt
            </span> with AI & RPA.
          </h1>

          <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            AI Job Hunter connects directly to official Greenhouse, Lever, and Ashby postings, parses your resume,
            evaluates candidate skill match with Gemini, drafts personalized recruiter emails, and submits applications
            through verified UiPath RPA workflows.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={handleDemoSignIn}
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition-all shadow-xl shadow-indigo-600/25 flex items-center gap-2"
            >
              <span>Explore Live Platform</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              to="/auth?mode=register"
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base border border-slate-700 transition-colors"
            >
              Create Account
            </Link>
          </div>

          {/* Social Proof / Security Badges */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400 max-w-4xl mx-auto border-t border-slate-800/80">
            <div className="flex items-center justify-center gap-2 p-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Multi-Tenant Row Level Security</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-2">
              <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>AES Fernet Encrypted OAuth</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-2">
              <Globe className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Zero Unauthorized Scraping</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Review-Before-Send Safeguards</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 px-6 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white tracking-tight">Engineered for Technical Job Seekers</h2>
            <p className="text-slate-400 text-sm">
              Every feature is built on actual database records, honest integration reporting, and deterministic fallbacks.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Gemini Semantic Matching</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Objective 0-100% scoring combining required skill coverage, experience eligibility, and role relevance.
                Includes evidence-based explanations and missing requirement tags.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Verified Recruiter Outreach</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Personalized email drafting grounded strictly on resume facts. Sends via official Gmail API with configurable
                daily limits, anti-spam safeguards, and automatic reply classification.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">UiPath RPA Integration</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                First-class UiPath Orchestrator client that initiates automated application workflows, monitors execution states,
                and prompts for user intervention when CAPTCHAs or declaration questions arise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing-Ready Plan Structure */}
      <section id="pricing" className="py-20 px-6 border-t border-slate-800 bg-slate-900">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-white tracking-tight">Transparent, Fair Plans</h2>
            <p className="text-slate-400 text-sm">Full functionality available during demonstration mode with complete sandbox safety.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Starter</h3>
                <p className="text-xs text-slate-400 mt-1">For active individual job searches</p>
                <div className="mt-4 text-3xl font-extrabold text-white">$0 <span className="text-xs text-slate-500 font-normal">/ forever</span></div>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Greenhouse & Lever Discovery</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Resume parsing & skill extraction</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Up to 5 recruiter outreach emails / day</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Kanban application tracker</li>
              </ul>
              <button onClick={handleDemoSignIn} className="w-full py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm font-semibold transition-colors">
                Get Started
              </button>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-2xl bg-slate-950 border-2 border-indigo-500 relative space-y-6 shadow-xl shadow-indigo-500/10">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider">
                Popular
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Professional</h3>
                <p className="text-xs text-slate-400 mt-1">For career acceleration & high volume search</p>
                <div className="mt-4 text-3xl font-extrabold text-white">$29 <span className="text-xs text-slate-500 font-normal">/ month</span></div>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> All Job Sources (Ashby, Greenhouse, Lever)</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Unlimited Gemini Semantic Match Explanations</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Deep Company Research with Source Grounding</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> UiPath RPA submission integration</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Automated reply classification & scheduling</li>
              </ul>
              <button onClick={handleDemoSignIn} className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-md shadow-indigo-600/30">
                Launch Pro Experience
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Enterprise / Agency</h3>
                <p className="text-xs text-slate-400 mt-1">For staffing teams & career coaches</p>
                <div className="mt-4 text-3xl font-extrabold text-white">Custom</div>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Multi-candidate pipeline management</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Dedicated UiPath Tenant & Process Orchestrator</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Custom Workday & Enterprise Connectors</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Audit logs & SOC2 compliance reporting</li>
              </ul>
              <button onClick={handleDemoSignIn} className="w-full py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm font-semibold transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800 text-center text-xs text-slate-500 space-y-3">
        <p>© 2026 AI Job Hunter. Production-grade autonomous multi-user SaaS.</p>
        <p>Built with React, TypeScript, FastAPI, PostgreSQL, Google Gemini AI, Gmail API, and UiPath RPA.</p>
      </footer>
    </div>
  );
};
