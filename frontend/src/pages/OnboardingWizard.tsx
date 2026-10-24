import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  User,
  Sliders,
  Mail,
  Compass,
  Cpu,
  FileCheck,
  Shield,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const STEPS = [
  { step: 1, title: "Personal Profile", desc: "Contact & background details", icon: User },
  { step: 2, title: "Resume Upload", desc: "PDF/DOCX extraction & skills", icon: Upload },
  { step: 3, title: "Job Preferences", desc: "Target titles, locations & salary", icon: Sliders },
  { step: 4, title: "Gmail Integration", desc: "Secure OAuth recruiter outreach", icon: Mail },
  { step: 5, title: "Job Sources", desc: "Greenhouse, Lever & Ashby feeds", icon: Compass },
  { step: 6, title: "Automation Rules", desc: "Sending limits & safeguards", icon: Cpu },
  { step: 7, title: "Review & Launch", desc: "Verify and activate pipeline", icon: FileCheck },
];

export const OnboardingWizard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [phone, setPhone] = useState("+1 (415) 555-0199");
  const [location, setLocation] = useState("San Francisco, CA");
  const [headline, setHeadline] = useState("Senior Full Stack Software Engineer");
  const [yearsExperience, setYearsExperience] = useState(5.0);

  const [targetTitles, setTargetTitles] = useState("Senior Full Stack Engineer, Backend Software Engineer");
  const [skills, setSkills] = useState("Python, FastAPI, React, TypeScript, PostgreSQL, Docker, AWS");
  const [remotePref, setRemotePref] = useState("any");
  const [minSalary, setMinSalary] = useState(140000);

  const [dailyLimit, setDailyLimit] = useState(10);
  const [reviewBeforeSend, setReviewBeforeSend] = useState(true);

  // Resume upload state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleUploadResumeAction = async () => {
    if (!resumeFile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.uploadResume(resumeFile);
      setResumeUploaded(true);
      if (res.parsed_json?.skills) {
        setExtractedSkills(res.parsed_json.skills);
        setSkills(res.parsed_json.skills.join(", "));
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload and parse resume");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    setLoading(true);
    setError(null);
    try {
      if (currentStep === 1) {
        await api.updateProfile({
          phone,
          location,
          headline,
          years_experience: Number(yearsExperience),
          onboarding_step: 2,
        });
      } else if (currentStep === 3) {
        await api.updatePreferences({
          target_titles: targetTitles.split(",").map((s) => s.trim()).filter(Boolean),
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          locations: [location],
          remote_preference: remotePref,
          min_salary: Number(minSalary),
        });
        await api.updateProfile({ onboarding_step: 4 });
      } else if (currentStep === 6) {
        await api.updateAutomationSettings({
          daily_email_limit: Number(dailyLimit),
          review_before_send: reviewBeforeSend,
        });
        await api.updateProfile({ onboarding_step: 7 });
      } else if (currentStep === 7) {
        // Mark complete and trigger initial discovery scan
        await api.updateProfile({
          onboarding_completed: true,
          onboarding_step: 7,
        });
        try {
          await api.triggerScan();
        } catch {
          // ignore scan error during onboarding
        }
        await refreshUser();
        navigate("/dashboard");
        return;
      }

      setCurrentStep((prev) => Math.min(STEPS.length, prev + 1));
    } catch (err: any) {
      setError(err.message || "Failed to save step progress");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-6">
      <div className="max-w-4xl mx-auto w-full py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Platform Onboarding</h1>
              <p className="text-xs text-slate-400">Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Skip for now →
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-7 gap-2">
          {STEPS.map((s) => {
            const isDone = s.step < currentStep;
            const isCurrent = s.step === currentStep;
            return (
              <div key={s.step} className="space-y-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    isDone
                      ? "bg-emerald-500"
                      : isCurrent
                      ? "bg-indigo-500"
                      : "bg-slate-800"
                  }`}
                />
                <span className="hidden md:block text-[10px] text-slate-400 truncate">
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Card Content */}
        <div className="p-8 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-6">
          {/* STEP 1: Personal Profile */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white">Candidate Identity & Contact</h2>
                <p className="text-xs text-slate-400">Used for resume metadata and recruiter outreach headers.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Professional Headline</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Years of Experience</label>
                  <input
                    type="number"
                    step="0.5"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Resume Upload */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white">Upload Your Resume</h2>
                <p className="text-xs text-slate-400">PDF or DOCX documents will be securely parsed by Gemini into structured qualifications.</p>
              </div>

              <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-8 text-center space-y-4 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <label htmlFor="resume-upload" className="cursor-pointer text-indigo-400 hover:text-indigo-300 font-semibold text-sm">
                    Select a resume document
                  </label>
                  <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleResumeChange}
                    className="hidden"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {resumeFile ? resumeFile.name : "Supported formats: PDF, DOCX (Max 10MB)"}
                  </p>
                </div>

                {resumeFile && !resumeUploaded && (
                  <button
                    onClick={handleUploadResumeAction}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? "Parsing with Gemini..." : "Parse & Extract Skills"}
                  </button>
                )}

                {resumeUploaded && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Successfully parsed! Extracted {extractedSkills.length} verified technical skills.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Job Preferences */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white">Configure Job Preferences</h2>
                <p className="text-xs text-slate-400">Fine-tune the criteria used to filter and score postings.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Target Job Titles (Comma-separated)</label>
                  <input
                    type="text"
                    value={targetTitles}
                    onChange={(e) => setTargetTitles(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Key Skills (Used for Semantic Matching)</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:border-indigo-500"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Workplace Preference</label>
                    <select
                      value={remotePref}
                      onChange={(e) => setRemotePref(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:border-indigo-500"
                    >
                      <option value="any">Any (Remote, Hybrid or Onsite)</option>
                      <option value="remote">Strictly Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Minimum Annual Salary (USD)</label>
                    <input
                      type="number"
                      step="5000"
                      value={minSalary}
                      onChange={(e) => setMinSalary(parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Gmail Connection */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white">Connect Your Gmail Account</h2>
                <p className="text-xs text-slate-400">
                  Enables controlled recruiter outreach and automatic interview reply tracking.
                  Tokens are encrypted with AES Fernet.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center font-bold">
                    M
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Google Gmail Integration</p>
                    <p className="text-xs text-slate-400">
                      {user?.gmail_connected
                        ? `Connected as ${user.gmail_email || user.email}`
                        : "Requires minimal scopes: send & readonly"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user?.gmail_connected ? (
                    <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected
                    </span>
                  ) : (
                    <button
                      onClick={async () => {
                        await api.connectGmailCallback("mock_code");
                        await refreshUser();
                      }}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
                    >
                      Connect Gmail Sandbox
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Job Sources */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white">Active Job Discovery Connectors</h2>
                <p className="text-xs text-slate-400">Configured to query official APIs directly. No unauthorized scraping.</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Greenhouse</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">Active</span>
                  </div>
                  <p className="text-xs text-slate-400">Public job board API connector (Figma, Cloudflare, Databricks).</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Lever</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">Active</span>
                  </div>
                  <p className="text-xs text-slate-400">Direct postings API connector (Spotify, Affirm, Eventbrite).</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Ashby</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">Active</span>
                  </div>
                  <p className="text-xs text-slate-400">Official Ashby posting API connector (Linear, Ramp, Retool).</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Automation Rules */}
          {currentStep === 6 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white">Automation Safeguards</h2>
                <p className="text-xs text-slate-400">Configure safety thresholds to ensure high conversion and deliverability.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Review Before Send (Recommended)</p>
                    <p className="text-xs text-slate-400">AI drafts outreach emails for your manual review before anything is dispatched.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={reviewBeforeSend}
                    onChange={(e) => setReviewBeforeSend(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Daily Recruiter Outreach Limit</p>
                    <p className="text-xs text-slate-400">Hard cap to protect mailbox reputation and prevent rate limiting.</p>
                  </div>
                  <select
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(parseInt(e.target.value))}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-sm"
                  >
                    <option value={5}>5 emails / day</option>
                    <option value={10}>10 emails / day</option>
                    <option value={20}>20 emails / day</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Review & Finish */}
          {currentStep === 7 && (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Your Career Pipeline is Ready</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Clicking "Activate Pipeline" will initiate your first job scan across Greenhouse, Lever, and Ashby,
                  evaluate candidate match scores with Gemini, and populate your live dashboard.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left max-w-md mx-auto text-xs space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Headline:</span>
                  <span className="font-semibold text-white">{headline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Workplace:</span>
                  <span className="font-semibold text-white capitalize">{remotePref}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Min Salary:</span>
                  <span className="font-semibold text-white">${minSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Daily Email Limit:</span>
                  <span className="font-semibold text-white">{dailyLimit} / day</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
              className="px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? "Saving..." : currentStep === 7 ? "Activate Pipeline" : "Continue"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
