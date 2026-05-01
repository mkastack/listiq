import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export function Sidebar({ isOpen = false, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const [profile, setProfile] = useState<{
    full_name: string;
    avatar_url: string;
    subscription_plan: string;
  } | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
      if (!currentSession?.user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, subscription_plan")
        .eq("id", currentSession.user.id)
        .single();

      if (data) setProfile(data);
    }
    fetchProfile();
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const rawName = profile?.full_name || session?.user?.user_metadata?.full_name || "User Name";
  const initials = rawName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-[260px] bg-[#0F172A] border-r border-slate-800 shadow-2xl flex flex-col gap-y-1 py-6 px-4 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">layers</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">ListIQ</span>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white transition-colors p-1"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-4 mb-6 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center overflow-hidden bg-slate-800">
              {profile?.avatar_url ? (
                <img
                  alt="User profile avatar"
                  className="w-full h-full object-cover"
                  src={profile.avatar_url}
                />
              ) : (
                <span className="text-white font-bold text-lg">{initials}</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary text-[10px] text-white flex items-center justify-center rounded-full font-bold">
              {profile?.subscription_plan?.charAt(0).toUpperCase() || "F"}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white truncate max-w-[140px]">
              {rawName}
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              {profile?.subscription_plan || "Free Plan"}
            </span>
          </div>
        </div>

        <nav
          className="flex-1 space-y-1 overflow-y-auto no-scrollbar"
          style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `.no-scrollbar::-webkit-scrollbar { display: none; }`,
            }}
          />
          <Link
            to="/dashboard"
            activeOptions={{ exact: true }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200"
            activeProps={{
              className: "text-white bg-blue-600/10 border-l-2 border-blue-600 font-semibold",
            }}
            inactiveProps={{
              className:
                "text-slate-400 font-medium hover:bg-slate-800/50 hover:text-white border-l-2 border-transparent",
            }}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span className="font-['Plus_Jakarta_Sans'] text-sm antialiased">Overview</span>
          </Link>
          <Link
            to="/dashboard/listings"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200"
            activeProps={{
              className: "text-white bg-blue-600/10 border-l-2 border-blue-600 font-semibold",
            }}
            inactiveProps={{
              className:
                "text-slate-400 font-medium hover:bg-slate-800/50 hover:text-white border-l-2 border-transparent",
            }}
          >
            <span className="material-symbols-outlined text-[20px]">list_alt</span>
            <span className="font-['Plus_Jakarta_Sans'] text-sm antialiased">My Listings</span>
          </Link>
          <Link
            to="/dashboard/add-listing"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200"
            activeProps={{
              className: "text-white bg-blue-600/10 border-l-2 border-blue-600 font-semibold",
            }}
            inactiveProps={{
              className:
                "text-slate-400 font-medium hover:bg-slate-800/50 hover:text-white border-l-2 border-transparent",
            }}
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span className="font-['Plus_Jakarta_Sans'] text-sm antialiased">Add New Listing</span>
          </Link>
          <Link
            to="/dashboard/saved"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200"
            activeProps={{
              className: "text-white bg-blue-600/10 border-l-2 border-blue-600 font-semibold",
            }}
            inactiveProps={{
              className:
                "text-slate-400 font-medium hover:bg-slate-800/50 hover:text-white border-l-2 border-transparent",
            }}
          >
            <span className="material-symbols-outlined text-[20px]">bookmark</span>
            <span className="font-['Plus_Jakarta_Sans'] text-sm antialiased">Saved Listings</span>
          </Link>
          <Link
            to="/dashboard/reviews"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200"
            activeProps={{
              className: "text-white bg-blue-600/10 border-l-2 border-blue-600 font-semibold",
            }}
            inactiveProps={{
              className:
                "text-slate-400 font-medium hover:bg-slate-800/50 hover:text-white border-l-2 border-transparent",
            }}
          >
            <span className="material-symbols-outlined text-[20px]">rate_review</span>
            <span className="font-['Plus_Jakarta_Sans'] text-sm antialiased">Reviews</span>
          </Link>
          <Link
            to="/dashboard/billing"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200"
            activeProps={{
              className: "text-white bg-blue-600/10 border-l-2 border-blue-600 font-semibold",
            }}
            inactiveProps={{
              className:
                "text-slate-400 font-medium hover:bg-slate-800/50 hover:text-white border-l-2 border-transparent",
            }}
          >
            <span className="material-symbols-outlined text-[20px]">payments</span>
            <span className="font-['Plus_Jakarta_Sans'] text-sm antialiased">Billing & Plan</span>
          </Link>
          <Link
            to="/dashboard/articles"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200"
            activeProps={{
              className: "text-white bg-blue-600/10 border-l-2 border-blue-600 font-semibold",
            }}
            inactiveProps={{
              className:
                "text-slate-400 font-medium hover:bg-slate-800/50 hover:text-white border-l-2 border-transparent",
            }}
          >
            <span className="material-symbols-outlined text-[20px]">description</span>
            <span className="font-['Plus_Jakarta_Sans'] text-sm antialiased">My Articles</span>
          </Link>
          <Link
            to="/dashboard/settings"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200"
            activeProps={{
              className: "text-white bg-blue-600/10 border-l-2 border-blue-600 font-semibold",
            }}
            inactiveProps={{
              className:
                "text-slate-400 font-medium hover:bg-slate-800/50 hover:text-white border-l-2 border-transparent",
            }}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="font-['Plus_Jakarta_Sans'] text-sm antialiased">Settings</span>
          </Link>
          <Link
            to="/dashboard/notifications"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200"
            activeProps={{
              className: "text-white bg-blue-600/10 border-l-2 border-blue-600 font-semibold",
            }}
            inactiveProps={{
              className:
                "text-slate-400 font-medium hover:bg-slate-800/50 hover:text-white border-l-2 border-transparent",
            }}
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="font-['Plus_Jakarta_Sans'] text-sm antialiased">Notifications</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}
