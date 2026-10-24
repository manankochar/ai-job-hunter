import React, { useState } from "react";
import { RefreshCw, Play, Shield, Bell, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../lib/api";

interface NavbarProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ title, subtitle, onRefresh }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleQuickScan = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await api.triggerScan();
      setScanMessage(`Scan finished! Found ${res.total_discovered} jobs (${res.total_new} new).`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setScanMessage(`Scan error: ${err.message}`);
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanMessage(null), 5000);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-20 px-8 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {scanMessage && (
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{scanMessage}</span>
          </div>
        )}

        <button
          onClick={handleQuickScan}
          disabled={isScanning}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin text-indigo-600" : ""}`} />
          <span>{isScanning ? "Scanning Sources..." : "Run Job Scan"}</span>
        </button>

        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh current view"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
