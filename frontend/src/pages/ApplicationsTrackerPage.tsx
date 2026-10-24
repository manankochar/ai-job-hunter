import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Kanban,
  Table,
  Download,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  Plus,
  AlertCircle,
  CheckCircle2,
  Filter,
  FileText,
  Building2,
  Trash2,
  Edit2
} from "lucide-react";
import { api } from "../lib/api";
import { Application } from "../lib/types";
import { Navbar } from "../components/Navbar";

const KANBAN_COLUMNS = [
  { id: "Saved", label: "Saved", color: "border-slate-300" },
  { id: "Ready to Apply", label: "Ready to Apply", color: "border-indigo-400" },
  { id: "Applied", label: "Applied", color: "border-sky-400" },
  { id: "Recruiter Contacted", label: "Recruiter Contacted", color: "border-violet-400" },
  { id: "Interview", label: "Interview", color: "border-amber-400" },
  { id: "Offer", label: "Offer", color: "border-emerald-400" },
  { id: "Rejected", label: "Archived / Rejected", color: "border-slate-300" },
];

const ALL_STATUSES = [
  "Discovered", "Matched", "Saved", "Ready to Apply", "Applied",
  "Recruiter Contacted", "Recruiter Responded", "Interview",
  "Offer", "Rejected", "Withdrawn", "Archived"
];

export const ApplicationsTrackerPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Status update modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [interviewDate, setInterviewDate] = useState("");

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listApplications();
      setApplications(data);
    } catch (err: any) {
      setError(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleExportCsv = async () => {
    try {
      const csvText = await api.exportApplicationsCsv();
      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `job_applications_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const openStatusModal = (app: Application) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setNotes(app.notes || "");
    setInterviewDate(app.interview_date ? app.interview_date.slice(0, 16) : "");
    setModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedApp) return;
    try {
      const updated = await api.updateApplication(selectedApp.id, {
        status: newStatus,
        notes,
        interview_date: interviewDate ? new Date(interviewDate).toISOString() : undefined,
      });
      setApplications((prev) => prev.map((a) => (a.id === selectedApp.id ? updated : a)));
      setModalOpen(false);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove application from tracker?")) return;
    try {
      await api.deleteApplication(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      if (selectedApp?.id === id) setSelectedApp(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div>
      <Navbar
        title="Applications Pipeline & Tracker"
        subtitle="Manage and monitor job applications with real-time audit logs and timeline events"
        onRefresh={fetchApplications}
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Top Control Bar */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === "kanban"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>

            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === "table"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">{applications.length} Active Tracked Roles</span>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-subtle"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Kanban Board View */}
        {viewMode === "kanban" ? (
          <div className="flex gap-4 overflow-x-auto pb-4 items-start">
            {KANBAN_COLUMNS.map((col) => {
              const colApps = applications.filter((a) => {
                if (col.id === "Rejected") {
                  return a.status === "Rejected" || a.status === "Withdrawn" || a.status === "Archived";
                }
                return a.status === col.id;
              });

              return (
                <div
                  key={col.id}
                  className="w-72 bg-slate-100/70 border border-slate-200/90 rounded-2xl p-3 shrink-0 space-y-3"
                >
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-800 tracking-tight">{col.label}</span>
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center justify-center shadow-subtle">
                      {colApps.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 min-h-[160px]">
                    {colApps.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => openStatusModal(app)}
                        className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-card transition-all cursor-pointer space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                            {app.job.title}
                          </h4>
                          <span className="text-[10px] uppercase font-semibold text-slate-500 shrink-0">
                            {app.source}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{app.job.company_name}</span>
                        </p>

                        {app.interview_date && (
                          <div className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 p-1.5 rounded-lg flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Interview: {new Date(app.interview_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Updated {new Date(app.updated_at).toLocaleDateString()}</span>
                          <span className="text-indigo-600 hover:underline font-semibold flex items-center gap-0.5">
                            Manage →
                          </span>
                        </div>
                      </div>
                    ))}

                    {colApps.length === 0 && (
                      <div className="h-24 flex items-center justify-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        No applications
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="pb-3">Role & Company</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Applied Date</th>
                  <th className="pb-3">Interview Date</th>
                  <th className="pb-3">Source</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="font-bold text-slate-900">{app.job.title}</p>
                      <p className="text-slate-500 text-[11px]">{app.job.company_name} • {app.job.location}</p>
                    </td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">
                      {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 text-amber-700 font-medium">
                      {app.interview_date ? new Date(app.interview_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "—"}
                    </td>
                    <td className="py-3 text-slate-500 capitalize">{app.source}</td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => openStatusModal(app)}
                        className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-[11px]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="p-1 text-slate-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Status & Event Timeline Modal */}
        {modalOpen && selectedApp && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-5 p-6 animate-fade-in">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedApp.job.title}</h3>
                  <p className="text-xs text-slate-500">{selectedApp.job.company_name}</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              {/* Status Select & Date Inputs */}
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Application Pipeline Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-900"
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Interview Scheduled</label>
                    <input
                      type="datetime-local"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Notes & Interview Prep</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Phone screen with Engineering Director"
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs text-slate-800"
                    />
                  </div>
                </div>

                {/* Event Timeline History */}
                <div className="space-y-2 pt-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider block">Timeline Activity ({selectedApp.events.length})</span>
                  <div className="max-h-40 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50">
                    {selectedApp.events.length > 0 ? (
                      selectedApp.events.map((ev) => (
                        <div key={ev.id} className="text-[11px] space-y-0.5 border-b border-slate-200/60 pb-1.5 last:border-none last:pb-0">
                          <p className="font-medium text-slate-800">{ev.description}</p>
                          <span className="text-[10px] text-slate-400">{new Date(ev.created_at).toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-400">No events recorded.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedApp.id)}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold"
                >
                  Delete Application
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
