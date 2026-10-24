import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  X,
  Plus,
  ExternalLink,
  Sparkles,
  Building2,
  MapPin,
  DollarSign,
  AlertCircle,
  Eye,
  CheckCircle2,
  FileSearch
} from "lucide-react";
import { api } from "../lib/api";
import { Job } from "../lib/types";
import { Navbar } from "../components/Navbar";

export const JobDiscoveryPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [remoteType, setRemoteType] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [savedOnly, setSavedOnly] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listJobs({
        q: searchQuery || undefined,
        remote_type: remoteType,
        source: sourceFilter,
        min_score: minMatchScore > 0 ? minMatchScore : undefined,
        saved_only: savedOnly,
      });
      setJobs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load discovered jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [remoteType, sourceFilter, minMatchScore, savedOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleToggleSave = async (jobId: number) => {
    try {
      const res = await api.toggleSaveJob(jobId);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, is_saved: res.is_saved } : j))
      );
    } catch (err: any) {
      alert(`Could not save job: ${err.message}`);
    }
  };

  const handleDismiss = async (jobId: number) => {
    try {
      await api.dismissJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err: any) {
      alert(`Could not dismiss job: ${err.message}`);
    }
  };

  const handleAddToPipeline = async (jobId: number) => {
    try {
      await api.createApplication({ job_id: jobId, status: "Ready to Apply" });
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, application_status: "Ready to Apply" } : j))
      );
      alert("Job added to application pipeline!");
    } catch (err: any) {
      alert(err.message || "Failed to add job to pipeline");
    }
  };

  return (
    <div>
      <Navbar
        title="Job Discovery"
        subtitle="Multi-source postings normalized from Greenhouse, Lever, and Ashby feeds"
        onRefresh={fetchJobs}
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Search & Filter Header */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search by role title, company or technical skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={remoteType}
              onChange={(e) => setRemoteType(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs"
            >
              <option value="all">All Locations</option>
              <option value="remote">Remote Only</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs"
            >
              <option value="all">All Connectors</option>
              <option value="greenhouse">Greenhouse</option>
              <option value="lever">Lever</option>
              <option value="ashby">Ashby</option>
            </select>

            <select
              value={minMatchScore}
              onChange={(e) => setMinMatchScore(parseInt(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs"
            >
              <option value={0}>Any Match Score</option>
              <option value={70}>70%+ Match</option>
              <option value={80}>80%+ Match</option>
              <option value={90}>90%+ Match</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer text-slate-600 ml-auto select-none">
              <input
                type="checkbox"
                checked={savedOnly}
                onChange={(e) => setSavedOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Saved jobs only</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Jobs List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => {
              const score = job.match_score || 0;
              const isHighMatch = score >= 85;
              const hasApplied = Boolean(job.application_status);

              return (
                <div
                  key={job.id}
                  className="p-6 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 transition-all shadow-subtle hover:shadow-card space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/discovery/${job.id}`}
                          className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                        >
                          {job.title}
                        </Link>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {job.source}
                        </span>
                        {hasApplied && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                            Status: {job.application_status}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {job.company_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {job.location} ({job.remote_type})
                        </span>
                        {job.min_salary && (
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                            ${job.min_salary.toLocaleString()} - ${job.max_salary?.toLocaleString() || "competitive"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <div className="flex items-center gap-3 shrink-0">
                      {score > 0 && (
                        <div
                          className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                            isHighMatch
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-indigo-50 border-indigo-200 text-indigo-800"
                          }`}
                        >
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-bold">{Math.round(score)}% Match</span>
                        </div>
                      )}

                      <button
                        onClick={() => handleToggleSave(job.id)}
                        className={`p-2 rounded-lg border transition-colors ${
                          job.is_saved
                            ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                            : "border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                        title={job.is_saved ? "Remove from saved" : "Save job"}
                      >
                        {job.is_saved ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDismiss(job.id)}
                        className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Dismiss job"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Skills tags */}
                  {job.skills_required && job.skills_required.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {job.skills_required.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <p className="text-slate-500 line-clamp-1 max-w-xl">
                      {job.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/discovery/${job.id}`}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>View Match Analysis</span>
                      </Link>

                      {!hasApplied ? (
                        <button
                          onClick={() => handleAddToPipeline(job.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Pipeline</span>
                        </button>
                      ) : (
                        <Link
                          to="/applications"
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-medium border border-emerald-200"
                        >
                          In Pipeline
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-3">
            <FileSearch className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No jobs match your current search filters</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your remote preference, minimum score, or run a new discovery scan to fetch latest postings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
