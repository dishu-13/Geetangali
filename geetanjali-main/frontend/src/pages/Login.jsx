import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../lib/api";
import { ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import GeetanjaliLogo from "../components/GeetanjaliLogo";

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("owner@luxurysalon.com");
  const [password, setPassword] = useState("owner123");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name}`);
      nav(u.role === "owner" ? "/owner" : "/manager");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (which) => {
    if (which === "owner") {
      setEmail("owner@luxurysalon.com");
      setPassword("owner123");
    } else {
      setEmail("manager@luxurysalon.com");
      setPassword("manager123");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#F8FAFC]">
      {/* Left panel: Ultra-Luxury Obsidian & Champagne Gold Hero */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <GeetanjaliLogo size="md" />
        </div>

        <div className="relative z-10 max-w-lg my-auto space-y-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-400/10 border border-amber-400/30 text-amber-300 font-extrabold text-xs uppercase tracking-widest rounded-full">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Luxury Salon Operations Suite
          </span>
          <h1 className="font-serif-lux text-4xl xl:text-6xl font-bold text-white leading-tight tracking-tight">
            High-trust operations & <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">automated salon analytics.</span>
          </h1>
          <p className="text-slate-300 text-base leading-relaxed font-medium">
            Real-time inventory intelligence, automated commission payouts, stock leakage detection, and POS reconciliation.
          </p>
        </div>

        <div className="relative z-10 text-xs font-semibold text-slate-400 flex justify-between items-center">
          <span>© Geetanjali Salon Operations Platform</span>
          <span className="text-amber-400/80 font-bold">PostgreSQL Engine Enabled</span>
        </div>
      </div>

      {/* Right panel: High-contrast sign-in form */}
      <div className="flex items-center justify-center px-6 py-12 bg-white">
        <form onSubmit={submit} className="w-full max-w-md" data-testid="login-form">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <GeetanjaliLogo size="md" />
          </div>

          <div className="lss-overline text-amber-800 mb-1">Sign In</div>
          <h2 className="font-serif-lux text-4xl font-bold text-slate-950 tracking-tight mb-2">Welcome Back</h2>
          <p className="text-sm font-medium text-slate-600 mb-8">Enter your credentials to access the operations workspace.</p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Email Address</label>
              <input
                data-testid="login-email"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-950 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-xs"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Password</label>
              <input
                data-testid="login-password"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-950 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-xs"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit"
            className="w-full mt-8 py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-extrabold text-sm tracking-wide rounded-xl transition-all shadow-md shadow-amber-500/20 border border-amber-300/40 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />}
            <span>{loading ? "Signing in..." : "Sign In to Platform"}</span>
            {!loading && <ArrowRight className="w-4 h-4 text-slate-950" />}
          </button>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Quick Demo Login</div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                data-testid="quick-owner"
                onClick={() => quickFill("owner")}
                className="py-2.5 px-3 bg-amber-50/80 hover:bg-amber-100/80 text-amber-950 font-extrabold text-xs rounded-xl transition-colors border border-amber-300/60 text-center shadow-xs"
              >
                Owner Demo
              </button>
              <button
                type="button"
                data-testid="quick-manager"
                onClick={() => quickFill("manager")}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-950 font-extrabold text-xs rounded-xl transition-colors border border-slate-300 text-center shadow-xs"
              >
                Manager Demo
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
