import React, { useEffect, useState } from "react";
import {
  Cpu,
  Power,
  Play,
  RotateCw,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  PlayCircle,
  FileCode,
  Terminal,
  Activity
} from "lucide-react";
import { api } from "../lib/api";
import { AutomationSettings, AutomationRun, Application } from "../lib/types";
import { Navbar } from "../components/Navbar";

export const AutomationPage: React.FC = () => {
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // UiPath Trigger state
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [uipathStatus, setUipathStatus] = useState<any | null>(null);

  const fetchAutomationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sett, runList, appList] = await Promise.all([
        api.getAutomationSettings(),
        api.listAutomationRuns(),
        api.listApplications(),
      ]);
      setSettings(sett);
      setRuns(runList);
      setApplications(appList);
      if (appList.length > 0 && !selectedAppId) {
        setSelectedAppId(appList[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load automation settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomationData();
  }, []);

  const handleToggleGlobalPause = async () => {
    if (!settings) return;
    setActionLoading(true);
    try {
      const updated = await api.updateAutomationSettings({
        is_globally_paused: !settings.is_globally_paused,
      });
      setSettings(updated);
      setNotification(
        updated.is_globally_paused
          ? "Automation is now GLOBALLY PAUSED. All automated scans and jobs suspended."
          : "Automation resumed."
      );
    } catch (err: any) {
      alert(`Toggle failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFeature = async (feature: keyof AutomationSettings, value: boolean) => {
    if (!settings) return;
    try {
      const updated = await api.updateAutomationSettings({ [feature]: value });
      setSettings(updated);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleTriggerUiPathWorkflow = async () => {
    if (!selectedAppId) return;
    setActionLoading(true);
    setError(null);
    try {
      const job = await api.triggerUiPath({ application_id: selectedAppId });
      setNotification(`UiPath workflow submitted! (Orchestrator Job ID: ${job.orchestrator_job_id})`);
      setUipathStatus(job);

      // Poll status once after 2 seconds
      setTimeout(async () => {
        try {
          const pollRes = await api.getUiPathStatus(job.id);
          setUipathStatus(pollRes);
          await fetchAutomationData();
        } catch {
          // ignore
        }
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Failed to trigger UiPath automation");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <Navbar
        title="Automation Control Centre & UiPath RPA"
        subtitle="Global pause switch, scheduled task triggers, Orchestrator execution logs, and manual intervention handlers"
        onRefresh={fetchAutomationData}
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {notification && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-emerald-700 text-xs">✕</button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Global Pause Master Switch Card */}
        {settings && (
          <div
            className={`p-6 rounded-2xl border transition-all shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              settings.is_globally_paused
                ? "bg-red-50/70 border-red-300"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  settings.is_globally_paused
                    ? "bg-red-600 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                <Power className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Global Automation Master Switch:{" "}
                  <span className={settings.is_globally_paused ? "text-red-600 font-extrabold" : "text-emerald-600 font-extrabold"}>
                    {settings.is_globally_paused ? "PAUSED" : "ACTIVE & RUNNING"}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  {settings.is_globally_paused
                    ? "All automated job scans, recruiter outreach tasks, and UiPath bots are paused."
                    : "Scheduled scans and automated safeguards are operating within configured quotas."}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleGlobalPause}
              disabled={actionLoading}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2 shrink-0 ${
                settings.is_globally_paused
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                  : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{settings.is_globally_paused ? "Resume Automation" : "Emergency Pause"}</span>
            </button>
          </div>
        )}

        {/* Feature Toggles & Automation Safeguards */}
        {settings && (
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Scheduled Job Scans</h3>
                <input
                  type="checkbox"
                  checked={settings.auto_scan_enabled}
                  onChange={(e) => handleToggleFeature("auto_scan_enabled", e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>
              <p className="text-xs text-slate-500">
                Runs daily scans across Greenhouse, Lever, and Ashby connectors for new openings.
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                <span>Last run: {settings.last_scan_run ? new Date(settings.last_scan_run).toLocaleDateString() : "Today"}</span>
                <span className="text-indigo-600 font-semibold">Daily</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Automated Email Outreach</h3>
                <input
                  type="checkbox"
                  checked={settings.auto_email_enabled}
                  onChange={(e) => handleToggleFeature("auto_email_enabled", e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>
              <p className="text-xs text-slate-500">
                Dispatches approved recruiter emails up to daily limit. Enforces verified contact checks.
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                <span>Daily cap: {settings.daily_email_limit} emails</span>
                <span className="font-semibold text-slate-700">Review First</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">UiPath Application Bot</h3>
                <input
                  type="checkbox"
                  checked={settings.auto_uipath_enabled}
                  onChange={(e) => handleToggleFeature("auto_uipath_enabled", e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>
              <p className="text-xs text-slate-500">
                Triggers UiPath RPA workflows for supported applicant submission portals.
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                <span>Min fit threshold: {settings.match_threshold}%</span>
                <span className="text-emerald-600 font-semibold">Active Adapter</span>
              </div>
            </div>
          </div>
        )}

        {/* UiPath RPA Interactive Launcher */}
        <div className="p-6 rounded-2xl bg-white border border-indigo-200 shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Execute UiPath Application Automation</h3>
                <p className="text-xs text-slate-500">Dispatches authorized submission workflow to configured UiPath Orchestrator</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Orchestrator Adapter
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-semibold text-slate-700">Select Tracked Application for RPA Submission</label>
              <select
                value={selectedAppId || ""}
                onChange={(e) => setSelectedAppId(parseInt(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 font-medium"
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.job.title} — {app.job.company_name} (Status: {app.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <button
                onClick={handleTriggerUiPathWorkflow}
                disabled={actionLoading || !selectedAppId || settings?.is_globally_paused}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{actionLoading ? "Submitting RPA Job..." : "Start UiPath Bot"}</span>
              </button>
            </div>
          </div>

          {/* UiPath Execution Status Monitor */}
          {uipathStatus && (
            <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-indigo-400">
                <span className="flex items-center gap-1.5 font-bold">
                  <Terminal className="w-3.5 h-3.5" />
                  UiPath Orchestrator Execution Status
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  uipathStatus.status === "Successful" ? "bg-emerald-500/20 text-emerald-300" :
                  uipathStatus.status === "Running" ? "bg-indigo-500/20 text-indigo-300" :
                  "bg-amber-500/20 text-amber-300"
                }`}>
                  State: {uipathStatus.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-1">
                <p>Orchestrator Job ID: {uipathStatus.orchestrator_job_id}</p>
                {uipathStatus.output && (
                  <p className="text-emerald-400">Confirmation: {JSON.stringify(uipathStatus.output)}</p>
                )}
                {uipathStatus.error && (
                  <p className="text-red-400">Error: {uipathStatus.error}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Execution Run History */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Automation History & Audit Log</h3>
            <span className="text-xs text-slate-500">{runs.length} Runs logged</span>
          </div>

          {runs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Processed</th>
                    <th className="pb-3">Succeeded</th>
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {runs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="py-3 font-semibold text-slate-900 capitalize">{r.run_type.replace('_', ' ')}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          r.status === "success" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{r.items_processed} items</td>
                      <td className="py-3 text-emerald-600 font-medium">{r.items_succeeded} passed</td>
                      <td className="py-3 text-slate-400">{new Date(r.started_at).toLocaleString()}</td>
                      <td className="py-3 text-slate-500 max-w-xs truncate">{r.log_output || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">No background automation runs recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
