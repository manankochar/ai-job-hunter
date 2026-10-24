import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  Briefcase,
  Mail,
  Calendar,
  Award,
  Clock,
  ArrowUpRight,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Inbox
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid
} from "recharts";
import { api } from "../lib/api";
import { DashboardAnalytics, Application, FollowUpTask } from "../lib/types";
import { Navbar } from "../components/Navbar";

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, appsData, tasksData] = await Promise.all([
        api.getDashboardAnalytics(),
        api.listApplications(),
        api.listFollowUps(),
      ]);
      setData(analyticsData);
      setApplications(appsData);
      setFollowUps(tasksData);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const metrics = data?.metrics;

  return (
    <div>
      <Navbar
        title="Pipeline Overview"
        subtitle="Live metrics computed directly from database records"
        onRefresh={fetchDashboardData}
      />

      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Jobs Discovered</span>
              <Compass className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics ? metrics.total_discovered : 0}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <span>{metrics ? metrics.matching_preferences : 0} match preference criteria</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Applications In Pipeline</span>
              <Briefcase className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics ? metrics.applications_submitted : 0}
            </div>
            <div className="text-[11px] text-slate-500">
              {metrics?.application_conversion_rate || 0}% apply rate from matches
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Recruiter Outreach</span>
              <Mail className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics ? metrics.recruiter_emails_sent : 0}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium">
              {metrics?.email_response_rate || 0}% recruiter response rate
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Interviews Scheduled</span>
              <Calendar className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics ? metrics.interviews_scheduled : 0}
            </div>
            <div className="text-[11px] text-amber-600 font-medium">
              {metrics ? metrics.offers_received : 0} offers received
            </div>
          </div>
        </div>

        {/* Charts: Activity Timeline & Match Score Distribution */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Activity Over Time Area Chart */}
          <div className="lg:col-span-2 p-6 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Application & Outreach Activity</h3>
                <p className="text-xs text-slate-500">Daily breakdown over the past 7 days</p>
              </div>
              <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-full">
                Database Verified
              </span>
            </div>

            <div className="h-64 w-full">
              {data && data.activity_timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.activity_timeline}>
                    <defs>
                      <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="applications" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorApps)" name="Applications" />
                    <Area type="monotone" dataKey="emails" stroke="#0ea5e9" strokeWidth={2} fillOpacity={0} name="Emails Sent" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No activity recorded yet for this user.
                </div>
              )}
            </div>
          </div>

          {/* Match Score Distribution Bar Chart */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Match Score Distribution</h3>
              <p className="text-xs text-slate-500">Gemini evaluations for discovered jobs</p>
            </div>

            <div className="h-64 w-full">
              {data && data.match_score_distribution.some(d => d.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.match_score_distribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="range_label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }} />
                    <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Matched Jobs" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-slate-400">
                  <Inbox className="w-8 h-8 text-slate-300 mb-2" />
                  <span>Zero-state: Click "Run Job Scan" above to populate discovery and compute fit scores.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Active Pipeline Table & Upcoming Follow-ups */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Pipeline */}
          <div className="lg:col-span-2 p-6 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active Applications</h3>
                <p className="text-xs text-slate-500">Recent opportunities in your pipeline</p>
              </div>
              <Link to="/applications" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
                View Kanban Board <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {applications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="pb-3">Role & Company</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Source</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applications.slice(0, 5).map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-slate-900">{app.job.title}</p>
                          <p className="text-slate-500 text-[11px]">{app.job.company_name} • {app.job.location}</p>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${
                            app.status === "Interview" ? "bg-amber-100 text-amber-800" :
                            app.status === "Recruiter Contacted" ? "bg-violet-100 text-violet-800" :
                            app.status === "Applied" ? "bg-sky-100 text-sky-800" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500 capitalize">{app.source}</td>
                        <td className="py-3 text-right">
                          <Link
                            to={`/discovery/${app.job_id}`}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 inline-block"
                            title="View Job Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No applications added yet. Browse <Link to="/discovery" className="text-indigo-600 font-medium hover:underline">Job Discovery</Link> to add opportunities.
              </div>
            )}
          </div>

          {/* Upcoming Tasks & Follow-ups */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upcoming Follow-ups</h3>
                <p className="text-xs text-slate-500">Tasks requiring candidate attention</p>
              </div>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>

            {followUps.length > 0 ? (
              <div className="space-y-3">
                {followUps.map((task) => (
                  <div key={task.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <p className="text-xs font-semibold text-slate-900">{task.title}</p>
                    <p className="text-[11px] text-slate-500">{task.company_name} • Due: {new Date(task.due_date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                <CheckCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p>All follow-ups caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
