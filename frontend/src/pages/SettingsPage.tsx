import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Shield,
  Trash2,
  Mail,
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  User,
  Save,
  RefreshCw,
  LogOut
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [integrations, setIntegrations] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile Form
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [headline, setHeadline] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [intStatus, logs, prof] = await Promise.all([
        api.getIntegrationsStatus(),
        api.getAuditLogs(),
        api.getProfile(),
      ]);
      setIntegrations(intStatus);
      setAuditLogs(logs);
      setFullName(user?.full_name || "");
      setHeadline(prof.headline || "");
      setPhone(prof.phone || "");
      setLocation(prof.location || "");
    } catch (err: any) {
      setError(err.message || "Failed to load settings data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile({ headline, phone, location });
      setSuccess("Profile settings updated!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGmailMock = async () => {
    try {
      await api.connectGmailCallback("mock_code");
      await refreshUser();
      await fetchData();
      setSuccess("Gmail Sandbox connected successfully!");
    } catch (err: any) {
      alert(`Gmail connect failed: ${err.message}`);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!confirm("Disconnect Gmail account? Active automated outreach will be suspended.")) return;
    try {
      await api.disconnectGmail();
      await refreshUser();
      await fetchData();
      setSuccess("Gmail account disconnected.");
    } catch (err: any) {
      alert(`Disconnect failed: ${err.message}`);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt("Type DELETE to permanently erase your account and all associated resumes and data:");
    if (confirmation !== "DELETE") return;
    try {
      await api.deleteAccount();
      logout();
      navigate("/");
    } catch (err: any) {
      alert(`Account deletion failed: ${err.message}`);
    }
  };

  return (
    <div>
      <Navbar
        title="Settings & Integrations"
        subtitle="Manage OAuth tokens, API configurations, audit compliance logs, and account retention"
        onRefresh={fetchData}
      />

      <div className="p-8 max-w-5xl mx-auto space-y-8">
        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Candidate Profile Details */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            <span>User Profile & Identification</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Account Email</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all"
              >
                {saving ? "Saving..." : "Update Profile"}
              </button>
            </div>
          </form>
        </div>

        {/* Integration Statuses: Honest Reporting */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Integrations & API Health</h3>
            <span className="text-[11px] text-slate-400 font-medium">Verified Live Status</span>
          </div>

          {integrations && (
            <div className="space-y-3 text-xs">
              {/* Gemini */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{integrations.gemini.name}</h4>
                    <p className="text-slate-500 text-[11px]">{integrations.gemini.description}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  integrations.gemini.is_configured ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"
                }`}>
                  {integrations.gemini.status}
                </span>
              </div>

              {/* Gmail */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{integrations.gmail.name}</h4>
                    <p className="text-slate-500 text-[11px]">
                      {integrations.gmail.is_connected
                        ? `Connected (${integrations.gmail.email})`
                        : "Disconnected. Connect to enable outreach."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {integrations.gmail.is_connected ? (
                    <button
                      onClick={handleDisconnectGmail}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-semibold"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectGmailMock}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 text-[11px] font-semibold shadow-sm"
                    >
                      Connect Gmail Sandbox
                    </button>
                  )}
                </div>
              </div>

              {/* UiPath */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{integrations.uipath.name}</h4>
                    <p className="text-slate-500 text-[11px]">{integrations.uipath.details || integrations.uipath.description}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                  {integrations.uipath.status}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Compliance Audit Trail */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Compliance & Audit Trail</h3>
          <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 last:border-none last:pb-0">
                <span className="font-semibold text-slate-800">{log.action}</span>
                <span className="text-[11px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone: Account & Data Deletion */}
        <div className="p-6 rounded-2xl bg-red-50/50 border border-red-200 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" />
              <span>Danger Zone: Permanent Account & Data Deletion (GDPR)</span>
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Permanently purges your account, resumes, OAuth tokens, preferences, applications, and email outreach records from the database.
            </p>
          </div>

          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-sm"
          >
            Permanently Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};
