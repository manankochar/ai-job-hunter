import React, { useEffect, useState } from "react";
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
  DollarSign,
  ShieldAlert,
  Mail,
  RefreshCw
} from "lucide-react";
import { api } from "../lib/api";
import { UserPreferences } from "../lib/types";
import { Navbar } from "../components/Navbar";

export const PreferencesPage: React.FC = () => {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [targetTitles, setTargetTitles] = useState("");
  const [skills, setSkills] = useState("");
  const [locations, setLocations] = useState("");
  const [remotePref, setRemotePref] = useState("any");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [minSalary, setMinSalary] = useState(140000);
  const [targetCompanies, setTargetCompanies] = useState("");
  const [excludedCompanies, setExcludedCompanies] = useState("");
  const [excludedKeywords, setExcludedKeywords] = useState("");
  const [requiresSponsorship, setRequiresSponsorship] = useState(false);
  const [minMatchScore, setMinMatchScore] = useState(70);
  const [dailyEmails, setDailyEmails] = useState(10);

  const fetchPreferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPreferences();
      setPrefs(data);
      setTargetTitles((data.target_titles || []).join(", "));
      setSkills((data.skills || []).join(", "));
      setLocations((data.locations || []).join(", "));
      setRemotePref(data.remote_preference || "any");
      setExperienceLevel(data.experience_level || "mid");
      setMinSalary(data.min_salary || 140000);
      setTargetCompanies((data.target_companies || []).join(", "));
      setExcludedCompanies((data.excluded_companies || []).join(", "));
      setExcludedKeywords((data.excluded_keywords || []).join(", "));
      setRequiresSponsorship(data.requires_sponsorship || false);
      setMinMatchScore(data.min_match_score || 70);
      setDailyEmails(data.max_emails_per_day || 10);
    } catch (err: any) {
      setError(err.message || "Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updated = await api.updatePreferences({
        target_titles: targetTitles.split(",").map((s) => s.trim()).filter(Boolean),
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        locations: locations.split(",").map((s) => s.trim()).filter(Boolean),
        remote_preference: remotePref,
        experience_level: experienceLevel,
        min_salary: Number(minSalary),
        target_companies: targetCompanies.split(",").map((s) => s.trim()).filter(Boolean),
        excluded_companies: excludedCompanies.split(",").map((s) => s.trim()).filter(Boolean),
        excluded_keywords: excludedKeywords.split(",").map((s) => s.trim()).filter(Boolean),
        requires_sponsorship: requiresSponsorship,
        min_match_score: Number(minMatchScore),
        max_emails_per_day: Number(dailyEmails),
      });
      setPrefs(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Navbar
        title="Job Preferences & Automation Safeguards"
        subtitle="Control discovery targets, salary bands, exclusion rules, and daily outreach volume"
        onRefresh={fetchPreferences}
      />

      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Preferences successfully updated! Discovery scans will reflect your changes.</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Target Roles & Tech Stack */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Role & Tech Stack Criteria</h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Target Titles (Comma-separated)</label>
                <input
                  type="text"
                  value={targetTitles}
                  onChange={(e) => setTargetTitles(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer, Backend Developer, Platform Engineer"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Required Skills for AI Fit Evaluation</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Python, FastAPI, React, TypeScript, Docker, PostgreSQL"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 focus:border-indigo-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Workplace Mode</label>
                  <select
                    value={remotePref}
                    onChange={(e) => setRemotePref(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900"
                  >
                    <option value="any">Any (Remote, Hybrid, On-site)</option>
                    <option value="remote">Strictly Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900"
                  >
                    <option value="entry">Entry / Junior (0-2 years)</option>
                    <option value="mid">Mid-Level (2-5 years)</option>
                    <option value="senior">Senior (5-8 years)</option>
                    <option value="lead">Staff / Principal (8+ years)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="font-semibold text-slate-700">Minimum Annual Base Salary (USD)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    step="5000"
                    value={minSalary}
                    onChange={(e) => setMinSalary(parseInt(e.target.value) || 0)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 text-slate-900 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Exclusions & Strict Filters */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Exclusion Rules & Filters</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Target Companies (Prioritized in Discovery)</label>
                <input
                  type="text"
                  value={targetCompanies}
                  onChange={(e) => setTargetCompanies(e.target.value)}
                  placeholder="e.g. Linear, Figma, Cloudflare, Spotify, Ramp"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Excluded Companies (Never show or apply)</label>
                <input
                  type="text"
                  value={excludedCompanies}
                  onChange={(e) => setExcludedCompanies(e.target.value)}
                  placeholder="e.g. Unwanted Company, Competitor Inc"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Excluded Keywords (Filter out unwanted roles/tech)</label>
                <input
                  type="text"
                  value={excludedKeywords}
                  onChange={(e) => setExcludedKeywords(e.target.value)}
                  placeholder="e.g. PHP, C#, .NET, WordPress, Contract-to-Hire"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresSponsorship}
                    onChange={(e) => setRequiresSponsorship(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium text-slate-700">Requires visa sponsorship (H1B / Work Permit)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Automation & Quota Thresholds */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-indigo-500" />
              <span>Outreach & AI Matching Thresholds</span>
            </h3>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Minimum Fit Threshold for Automation</label>
                <select
                  value={minMatchScore}
                  onChange={(e) => setMinMatchScore(parseInt(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900"
                >
                  <option value={60}>60% Match</option>
                  <option value={70}>70% Match (Recommended)</option>
                  <option value={80}>80% Match</option>
                  <option value={90}>90% Match</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Max Recruiter Emails Per Day</label>
                <select
                  value={dailyEmails}
                  onChange={(e) => setDailyEmails(parseInt(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900"
                >
                  <option value={5}>5 emails / day</option>
                  <option value={10}>10 emails / day (Standard)</option>
                  <option value={20}>20 emails / day</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Preferences..." : "Save Preferences"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
