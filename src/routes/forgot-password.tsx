import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: "Check your email for the password reset link." });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-20 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[32px] p-8 md:p-10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/20">
            <span className="material-symbols-outlined text-3xl">lock_open</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Forgot password?</h1>
          <p className="text-slate-500 font-medium">No worries, we'll send you reset instructions.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl mb-8 animate-in slide-in-from-top-2 duration-300 flex items-center gap-3 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}>
            <span className="material-symbols-outlined text-xl">
              {message.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <p className="text-sm font-bold">{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1">Email address</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">mail</span>
              <input 
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                Send reset link
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <Link 
            to="/auth" 
            search={{ mode: 'signin' }}
            className="inline-flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors group"
          >
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
