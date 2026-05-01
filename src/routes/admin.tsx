import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminSignIn } from "../components/admin/AdminSignIn";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [notificationCount, setNotificationCount] = useState(0);

  const location = useLocation();

  useEffect(() => {
    const verifyAdminSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user || session.user.email !== "admin@listiq.com") {
        if (session) {
          await supabase.auth.signOut();
        }
        setIsAuthenticated(false);
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .limit(1);

      const hasAdminRole = Array.isArray(roles) && roles.length > 0;

      if (!hasAdminRole) {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
      fetchProfile(session.user.id);
    };

    verifyAdminSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user || session.user.email !== "admin@listiq.com") {
        setIsAuthenticated(false);
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .limit(1);

      const hasAdminRole = Array.isArray(roles) && roles.length > 0;
      setIsAuthenticated(hasAdminRole);
      if (hasAdminRole) {
        fetchProfile(session.user.id);
      }
    });

    // Real-time notifications for Admin
    const notificationsSub = supabase
      .channel("admin-global-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "listings" }, () => {
        setNotificationCount((prev) => prev + 1);
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "claim_requests" },
        () => {
          setNotificationCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(notificationsSub);
    };
  }, []);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (data) setUserProfile(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setShowProfileDropdown(false);
    setUserProfile(null);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin"></div>
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest font-['Manrope']">
            Authenticating
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminSignIn onSignIn={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-['DM_Sans'] text-[#0F172A]">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono&display=swap');
        .font-h1 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; line-height: 32px; font-weight: 700; }
        .font-body-md { font-family: 'Manrope', sans-serif; font-size: 14px; line-height: 20px; }
        .font-label-caps { font-family: 'Manrope', sans-serif; font-size: 11px; line-height: 12px; letter-spacing: 0.05em; font-weight: 600; }
        .admin-badge { background-color: #F43F5E; color: #ffffff; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 11px; text-transform: uppercase; padding: 2px 6px; border-radius: 2px; }
      `,
        }}
      />

      {/* TopNavBar */}
      <nav className="bg-[#0F172A] border-b border-slate-800 flex flex-col w-full px-6 sticky top-0 z-50 h-24 justify-center">
        <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/admin" className="text-xl font-black text-white tracking-tighter">
              ListIQ
            </Link>
            <div className="hidden md:flex gap-6 items-center pt-2">
              {[
                { to: "/admin", label: "Overview", exact: true },
                { to: "/admin/listings", label: "Listings" },
                { to: "/admin/users", label: "Users" },
                { to: "/admin/claims", label: "Claims" },
                { to: "/admin/articles", label: "Articles" },
                { to: "/admin/settings", label: "Settings" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  activeOptions={{ exact: link.exact }}
                  className="font-['Plus_Jakarta_Sans'] text-sm tracking-tight transition-colors duration-200 pb-2"
                  activeProps={{
                    className: "text-[#2563EB] border-b-2 border-[#2563EB] font-bold",
                  }}
                  inactiveProps={{ className: "text-slate-400 font-medium hover:text-white" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden lg:flex items-center bg-[#1E293B] rounded-lg px-3 py-1.5">
              <span className="material-symbols-outlined text-slate-400 text-lg mr-2">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:ring-0 w-48 outline-none"
                placeholder="Search data..."
                type="text"
              />
            </div>
            <button
              onClick={() => setNotificationCount(0)}
              className="text-slate-400 hover:text-white transition-colors relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#0F172A] animate-bounce">
                  {notificationCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="relative group">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-3 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-[#2563EB]/20 flex items-center justify-center border border-[#2563EB]/30 overflow-hidden">
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        className="w-full h-full object-cover"
                        alt="Profile"
                      />
                    ) : (
                      <span className="text-[#2563EB] text-xs font-bold">
                        {userProfile?.full_name?.charAt(0) || "A"}
                      </span>
                    )}
                  </div>
                  <span className="admin-badge">Admin</span>
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-1 z-50">
                    <div className="px-4 py-2 border-b border-slate-50">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {userProfile?.full_name || "Administrator"}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{userProfile?.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto px-8 py-8">
        <Outlet />
      </main>

      <footer className="max-w-[1440px] mx-auto px-8 py-12 border-t border-slate-200 mt-12 flex justify-between items-center">
        <p className="text-sm text-[#64748B]">
          © 2024 ListIQ Enterprise Solutions. All rights reserved.
        </p>
        <div className="flex gap-6">
          <a className="text-sm text-[#64748B] hover:text-[#2563EB] transition-colors" href="#">
            Docs
          </a>
          <a className="text-sm text-[#64748B] hover:text-[#2563EB] transition-colors" href="#">
            Support
          </a>
          <a className="text-sm text-[#64748B] hover:text-[#2563EB] transition-colors" href="#">
            Status
          </a>
        </div>
      </footer>
    </div>
  );
}
