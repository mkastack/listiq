import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Link } from "@tanstack/react-router";

interface AdminSignInProps {
  onSignIn: () => void;
}

export function AdminSignIn({ onSignIn }: AdminSignInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showMFA, setShowMFA] = useState(false);
  const [mfaCode, setMFACode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Fetch settings to check if MFA is enabled
    const { data: settings } = await supabase.from("settings").select("mfa_enabled").single();
    const isMFAActive = settings?.mfa_enabled;

    if (showMFA) {
      if (mfaCode === "123456") {
        // Simulation of MFA verification
        onSignIn();
      } else {
        setError("Invalid verification code. Please try again.");
        setIsLoading(false);
      }
      return;
    }

    // Admin Email Restriction
    if (email !== "admin@listiq.com") {
      setError("Access Denied: Only the system administrator can access this panel.");
      setIsLoading(false);
      return;
    }

    // Admin Bypass for specific user credentials
    if (email === "admin@listiq.com" && password === "iotaiq@26") {
      if (isMFAActive) {
        setShowMFA(true);
        setIsLoading(false);
      } else {
        onSignIn();
      }
      return;
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
    } else if (data.session) {
      if (isMFAActive) {
        setShowMFA(true);
        setIsLoading(false);
      } else {
        onSignIn();
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-[#0F172A] bg-[#F8FAFC] font-['DM_Sans']">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');
        .font-heading { font-family: 'Plus Jakarta Sans', sans-serif; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `,
        }}
      />

      {/* Left Side: Login Form */}
      <main className="w-full md:w-1/2 lg:w-[45%] flex flex-col justify-center items-center p-8 md:p-12 lg:p-24 bg-white relative">
        <div className="w-full max-w-[400px]">
          {/* Branding Mobile Only */}
          <div className="flex items-center gap-3 mb-12 md:hidden">
            <div className="flex items-center bg-[#0F172A] px-4 py-2 rounded-lg shadow-xl shadow-slate-900/10">
              <span className="font-heading font-extrabold text-white tracking-tight text-xl">
                List
              </span>
              <span className="font-heading font-extrabold text-[#2563EB] tracking-tight text-xl">
                IQ
              </span>
            </div>
            <span className="bg-[#F43F5E] text-white text-[10px] font-bold px-2 py-1 rounded tracking-wider uppercase">
              ADMIN PANEL
            </span>
          </div>

          {/* Header */}
          <div className="mb-10">
            <div className="hidden md:flex items-center gap-2 mb-6">
              <span className="bg-[#F43F5E] text-white text-[10px] font-bold px-2 py-1 rounded tracking-wider uppercase">
                ADMIN PANEL
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 text-[#0F172A] font-heading">
              Welcome Back
            </h1>
            <p className="text-[#64748B] text-lg">
              Please enter your details to access the control center.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm p-4 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="material-symbols-outlined text-lg">error</span>
                <p className="font-medium">{error}</p>
              </div>
            )}

            {!showMFA ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0F172A]" htmlFor="email">
                    Email address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[20px]">
                      mail
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-3.5 bg-white border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all outline-none text-[#0F172A]"
                      id="email"
                      placeholder="admin@listiq.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-[#0F172A]" htmlFor="password">
                      Password
                    </label>
                    <a className="text-sm text-[#2563EB] hover:underline font-semibold" href="#">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[20px]">
                      lock
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-3.5 bg-white border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all outline-none text-[#0F172A]"
                      id="password"
                      placeholder="••••••••"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    className="h-4 w-4 text-[#2563EB] border-[#E2E8F0] rounded focus:ring-[#2563EB]"
                    id="remember"
                    type="checkbox"
                  />
                  <label className="ml-2 text-sm text-[#64748B]" htmlFor="remember">
                    Remember me for 30 days
                  </label>
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                  <p className="text-xs text-blue-700 font-medium leading-relaxed">
                    <span className="font-bold">Two-Step Verification:</span> We've sent a 6-digit
                    code to your registered device. Enter it below to continue.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0F172A]" htmlFor="mfa">
                    Security Code
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[20px]">
                      verified_user
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-4 bg-white border-2 border-[#2563EB]/20 border-[#E2E8F0] rounded-xl focus:ring-4 focus:ring-[#2563EB]/5 focus:border-[#2563EB] transition-all outline-none text-[#0F172A] text-center text-2xl font-bold tracking-[0.5em] placeholder:tracking-normal placeholder:text-sm"
                      id="mfa"
                      placeholder="000000"
                      type="text"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMFACode(e.target.value.replace(/\D/g, ""))}
                      disabled={isLoading}
                      autoFocus
                      required
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMFA(false)}
                  className="text-xs text-slate-400 hover:text-[#2563EB] font-bold uppercase tracking-widest flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back to password
                </button>
              </div>
            )}

            <button
              className="w-full bg-[#2563EB] text-white font-semibold py-4 px-4 rounded-xl hover:bg-blue-700 transition-all active:scale-[0.99] shadow-lg shadow-[#2563EB]/25 flex items-center justify-center gap-2"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                "Signing In..."
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom Section */}
          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col gap-5">
            <div className="flex items-center gap-3 text-[#64748B]">
              <span
                className="material-symbols-outlined text-[22px] text-green-500"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                shield_with_heart
              </span>
              <p className="text-sm font-medium">Secure, encrypted connection</p>
            </div>
            <p className="text-sm text-[#64748B]">
              Not an administrator?{" "}
              <Link className="text-[#2563EB] font-bold hover:underline" to="/">
                Return to home
              </Link>
            </p>
          </div>
        </div>

        {/* Desktop Footer */}
        <footer className="absolute bottom-8 left-12 right-12 hidden md:flex justify-between items-center text-[11px] font-medium text-slate-400">
          <p>© 2024 ListIQ Enterprise</p>
          <div className="flex gap-4">
            <a className="hover:text-[#2563EB] transition-colors" href="#">
              Privacy
            </a>
            <a className="hover:text-[#2563EB] transition-colors" href="#">
              Terms
            </a>
            <a className="hover:text-[#2563EB] transition-colors" href="#">
              Security
            </a>
          </div>
        </footer>
      </main>

      {/* Right Side: Brand Showcase */}
      <aside className="hidden md:flex md:w-1/2 lg:w-[55%] bg-[#0F172A] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 z-0">
          {/* Background Image with Blending */}
          <img
            src="/images/admin-bg.jpg"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105"
            alt=""
          />
          <div className="absolute inset-0 bg-[#0F172A]/70 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-transparent to-[#0F172A]/90"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent"></div>

          {/* Lock/Circle abstraction */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-blue-500/10 rounded-full animate-pulse"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
          <div className="flex items-center bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-2xl mb-12 shadow-2xl">
            <span className="font-heading font-extrabold text-white tracking-tighter text-5xl">
              List
            </span>
            <span className="font-heading font-extrabold text-[#2563EB] tracking-tighter text-5xl">
              IQ
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-5xl lg:text-6xl font-extrabold text-white mb-2 leading-tight font-heading tracking-tight">
              Find It. List It.
            </h2>
            <h2 className="text-5xl lg:text-6xl font-extrabold text-[#2563EB] leading-tight font-heading tracking-tight">
              Own It.
            </h2>
          </div>

          <p className="text-slate-400 text-xl max-w-md mx-auto leading-relaxed font-medium">
            The most powerful inventory management platform for scaling enterprise operations.
          </p>

          <div className="mt-16 bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[2rem] flex items-center gap-6 shadow-2xl ring-1 ring-white/5">
            <div className="h-14 w-14 rounded-full bg-[#2563EB]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#2563EB] text-[32px]">
                trending_up
              </span>
            </div>
            <div className="text-left">
              <p className="text-white font-heading font-extrabold text-3xl">99.9%</p>
              <p className="text-slate-400 text-sm font-medium">System Uptime Guarantee</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
