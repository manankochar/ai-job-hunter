import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Compass,
  Briefcase,
  FileText,
  Mail,
  Sliders,
  Cpu,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Job Discovery", href: "/discovery", icon: Compass },
  { name: "Applications Tracker", href: "/applications", icon: Briefcase },
  { name: "Resume Vault", href: "/resumes", icon: FileText },
  { name: "Email Centre", href: "/emails", icon: Mail },
  { name: "Automation Control", href: "/automation", icon: Cpu },
  { name: "Analytics Portal", href: "/analytics", icon: BarChart3 },
  { name: "Job Preferences", href: "/preferences", icon: Sliders },
  { name: "Settings & Integrations", href: "/settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none text-slate-300">
      {/* Brand & Logo */}
      <div>
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <span className="font-bold text-slate-100 tracking-tight text-base flex items-center gap-1.5">
              AI Job Hunter
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                SaaS
              </span>
            </span>
            <span className="text-[11px] text-slate-400 block -mt-0.5">Autonomous Career Platform</span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"
                  }`}
                />
                <span className="truncate">{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile & footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30">
        <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold text-xs flex items-center justify-center border border-indigo-500/30 shrink-0">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.full_name || "Candidate"}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-md hover:bg-slate-700/60 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-2 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>Multi-User Verified Sandbox</span>
        </div>
      </div>
    </aside>
  );
};
