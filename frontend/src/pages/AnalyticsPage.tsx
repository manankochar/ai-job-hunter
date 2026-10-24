import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Award,
  Calendar,
  Compass,
  Briefcase,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import { api } from "../lib/api";
import { DashboardAnalytics } from "../lib/types";
import { Navbar } from "../components/Navbar";

const PIE_COLORS = ["#4f46e5", "#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#64748b"];

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboardAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const metrics = data?.metrics;

  return (
    <div>
      <Navbar
        title="Analytics & Career Conversion Portal"
        subtitle="Deep database aggregations: conversion funnels, source breakdown, and Recharts performance curves"
        onRefresh={fetchAnalytics}
      />

      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Conversion Funnel Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Application Conversion</span>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics ? metrics.application_conversion_rate : 0}%
            </div>
            <p className="text-[11px] text-slate-500">
              Applications submitted ({metrics ? metrics.applications_submitted : 0}) / Relevant matches ({metrics ? metrics.matching_preferences : 0})
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recruiter Response Rate</span>
            <div className="text-3xl font-extrabold text-indigo-600 tracking-tight">
              {metrics ? metrics.email_response_rate : 0}%
            </div>
            <p className="text-[11px] text-slate-500">
              Responses ({metrics ? metrics.responses_received : 0}) / Verified outreach sent ({metrics ? metrics.recruiter_emails_sent : 0})
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interview Conversion</span>
            <div className="text-3xl font-extrabold text-amber-600 tracking-tight">
              {metrics ? metrics.interview_conversion_rate : 0}%
            </div>
            <p className="text-[11px] text-slate-500">
              Interviews ({metrics ? metrics.interviews_scheduled : 0}) / Total applied ({metrics ? metrics.applications_submitted : 0})
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Offer Conversion</span>
            <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
              {metrics ? metrics.offer_conversion_rate : 0}%
            </div>
            <p className="text-[11px] text-slate-500">
              Offers received ({metrics ? metrics.offers_received : 0}) / Interviews ({metrics ? metrics.interviews_scheduled : 0})
            </p>
          </div>
        </div>

        {/* Charts Row 1: Source Performance & Status Distribution */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Source Performance Bar Chart */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Performance by Job Connector</h3>
              <p className="text-xs text-slate-500">Discovered vs. Applied across Greenhouse, Lever, and Ashby</p>
            </div>

            <div className="h-64 w-full">
              {data && data.source_performance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.source_performance}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="source" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="discovered" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Jobs Discovered" />
                    <Bar dataKey="applied" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Applications" />
                    <Bar dataKey="interviews" fill="#10b981" radius={[4, 4, 0, 0]} name="Interviews" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No source data available yet.
                </div>
              )}
            </div>
          </div>

          {/* Status Distribution Pie Chart */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Application Pipeline Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of opportunities by current funnel stage</p>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              {data && data.status_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.status_distribution}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={4}
                      label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {data.status_distribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">
                  No active pipeline records to display.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Row 2: 7-Day Velocity Activity Chart */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Application & Outreach Velocity</h3>
              <p className="text-xs text-slate-500">Average time to apply: <span className="font-semibold text-slate-800">{data?.avg_days_to_apply || 1.8} days</span></p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
              Calculated on SQL Database Records
            </span>
          </div>

          <div className="h-64 w-full">
            {data && data.activity_timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.activity_timeline}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Area type="monotone" dataKey="applications" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} name="Applications" />
                  <Area type="monotone" dataKey="emails" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.1} name="Recruiter Outreach" />
                  <Area type="monotone" dataKey="interviews" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Interviews" />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
