import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Sparkles, ArrowRight, Lock, Mail, User, AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [isRegister, setIsRegister] = useState(initialMode === "register");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password, fullName);
      } else {
        await login(email, password);
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await googleLogin();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("alex.developer@gmail.com");
    setPassword("password123");
    setIsRegister(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <span className="font-extrabold text-white text-xl tracking-tight">AI Job Hunter</span>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isRegister ? "Create your SaaS account" : "Welcome back to your pipeline"}
          </h2>
          <p className="text-xs text-slate-400">
            {isRegister
              ? "Start autonomous multi-source job matching and outreach"
              : "Access your personalized application tracker and analytics"}
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Auth Button */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-700 text-slate-100 font-medium text-sm flex items-center justify-center gap-3 transition-colors shadow-sm disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-950 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold absolute">
              or continue with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Developer"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.developer@gmail.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Pre-fill */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              Fill demo credentials (alex.developer@gmail.com)
            </button>
          </div>

          <div className="text-center text-xs text-slate-400">
            {isRegister ? (
              <span>
                Already have an account?{" "}
                <button
                  onClick={() => setIsRegister(false)}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{" "}
                <button
                  onClick={() => setIsRegister(true)}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Register here
                </button>
              </span>
            )}
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>OAuth Tokens Encrypted with AES Fernet at Rest</span>
        </div>
      </div>
    </div>
  );
};
