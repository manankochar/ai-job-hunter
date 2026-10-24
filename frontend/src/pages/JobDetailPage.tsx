import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Building2,
  MapPin,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Mail,
  ShieldCheck,
  RefreshCw,
  Plus,
  Bookmark,
  Share2
} from "lucide-react";
import { api } from "../lib/api";
import { Job, JobMatchExplanation, CompanyResearch, RecruiterContact } from "../lib/types";
import { Navbar } from "../components/Navbar";

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id || "0");
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [match, setMatch] = useState<JobMatchExplanation | null>(null);
  const [research, setResearch] = useState<CompanyResearch | null>(null);
  const [recruiter, setRecruiter] = useState<RecruiterContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [researchLoading, setResearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobDetails = async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const [jobData, matchData, researchData, recruiterData] = await Promise.all([
        api.getJobDetail(jobId),
        api.getJobMatch(jobId),
        api.getCompanyResearch(jobId),
        api.getRecruiterContact(jobId),
      ]);
      setJob(jobData);
      setMatch(matchData);
      setResearch(researchData);
      setRecruiter(recruiterData);
    } catch (err: any) {
      setError(err.message || "Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const handleRefreshResearch = async () => {
    if (!jobId) return;
    setResearchLoading(true);
    try {
      const refreshed = await api.getCompanyResearch(jobId, true);
      setResearch(refreshed);
    } catch (err: any) {
      alert(`Could not refresh research: ${err.message}`);
    } finally {
      setResearchLoading(false);
    }
  };

  const handleAddToPipeline = async () => {
    if (!job) return;
    try {
      await api.createApplication({ job_id: job.id, status: "Ready to Apply" });
      setJob({ ...job, application_status: "Ready to Apply" });
      alert("Added to Application Tracker!");
    } catch (err: any) {
      alert(err.message || "Failed to add application");
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar title="Job Analysis" />
        <div className="p-8 max-w-6xl mx-auto">
          <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div>
        <Navbar title="Job Not Found" />
        <div className="p-12 text-center text-slate-500">
          <p>Job posting not found.</p>
          <Link to="/discovery" className="text-indigo-600 font-semibold mt-2 inline-block">
            ← Return to Discovery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title={job.title} subtitle={`${job.company_name} • Discovered via ${job.source}`} />

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <Link
          to="/discovery"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Job Discovery</span>
        </Link>

        {/* Top Header Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {job.source}
                </span>
                {job.application_status && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                    Pipeline: {job.application_status}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-700 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {job.company_name}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {job.location} ({job.remote_type})
                </span>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <a
                href={job.original_url}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span>Original Posting</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              {!job.application_status ? (
                <button
                  onClick={handleAddToPipeline}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Pipeline</span>
                </button>
              ) : (
                <Link
                  to="/applications"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  View in Tracker
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column (2 cols): Match Breakdown & Complete Job Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gemini AI Match Explanation Card */}
            {match && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/40 border border-indigo-200 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Gemini Match Evaluation</h2>
                      <p className="text-[11px] text-slate-500">Evaluated with {match.ai_model_used}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-sm">
                    {Math.round(match.match_score)}% Fit
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-white/70 p-3 rounded-lg border border-indigo-100">
                  {match.score_explanation}
                </p>

                {/* Matched vs Missing Skills */}
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Candidate Matched Skills ({match.matched_skills.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {match.matched_skills.map((s, idx) => (
                        <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-900 font-medium border border-emerald-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Missing / Preferred Requirements ({match.missing_skills.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {match.missing_skills.length > 0 ? (
                        match.missing_skills.map((s, idx) => (
                          <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-amber-100/70 text-amber-900 font-medium border border-amber-200">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400">All required qualifications covered!</span>
                      )}
                    </div>
                  </div>
                </div>

                {match.tailoring_suggestions.length > 0 && (
                  <div className="pt-2 border-t border-indigo-100/80 text-xs text-indigo-900">
                    <span className="font-semibold">Tailoring Recommendation: </span>
                    <span>{match.tailoring_suggestions.join(" • ")}</span>
                  </div>
                )}
              </div>
            )}

            {/* Complete Job Description */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
              <h3 className="text-base font-bold text-slate-900">Full Job Description</h3>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line space-y-2">
                {job.description}
              </div>
            </div>
          </div>

          {/* Right Column (1 col): Company Research & Verified Recruiter */}
          <div className="space-y-6">
            {/* Recruiter Contact Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hiring Contact</h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  recruiter && recruiter.verification_status === "verified"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {recruiter ? recruiter.verification_status : "Portal Submission"}
                </span>
              </div>

              {recruiter ? (
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{recruiter.full_name || "Technical Recruiter"}</p>
                    <p className="text-slate-500 text-[11px]">{recruiter.title || "Talent Acquisition"}</p>
                  </div>
                  <p className="text-slate-700 font-mono text-[11px]">{recruiter.email}</p>
                  <p className="text-[10px] text-slate-400">Verified via: {recruiter.verification_method}</p>

                  <Link
                    to={`/emails?target_email=${encodeURIComponent(recruiter.email)}&job_id=${job.id}`}
                    className="w-full mt-2 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Draft Recruiter Email</span>
                  </Link>
                </div>
              ) : (
                <div className="text-xs text-slate-500 space-y-2">
                  <p>No verified direct recruiter email discovered for this specific post.</p>
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                    <strong>Safeguard:</strong> AI Job Hunter does not fabricate email addresses. Standard portal application recommended.
                  </div>
                </div>
              )}
            </div>

            {/* Company Research Card */}
            {research && (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Company Intelligence</h3>
                  <button
                    onClick={handleRefreshResearch}
                    disabled={researchLoading}
                    title="Refresh research with Gemini"
                    className="text-slate-400 hover:text-slate-700 p-1 rounded"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${researchLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">Industry: </span>
                    <span className="text-slate-600">{research.industry || "Technology"}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-800">Overview: </span>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{research.overview}</p>
                  </div>

                  {research.engineering_focus && (
                    <div>
                      <span className="font-semibold text-slate-800">Engineering Focus: </span>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{research.engineering_focus}</p>
                    </div>
                  )}

                  {research.tech_stack && research.tech_stack.length > 0 && (
                    <div>
                      <span className="font-semibold text-slate-800 block mb-1">Observed Stack:</span>
                      <div className="flex flex-wrap gap-1">
                        {research.tech_stack.map((t, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {research.sources && research.sources.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-700 block mb-1">Grounded Sources:</span>
                      <div className="space-y-1">
                        {research.sources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 truncate"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{s.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
