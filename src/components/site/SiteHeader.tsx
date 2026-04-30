import { Link } from "@tanstack/react-router";
import { Search, Menu, MapPin, User, LogOut, LayoutDashboard, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const NAV = [
  { to: "/search", label: "Browse" },
  { to: "/categories", label: "Categories" },
  { to: "/articles", label: "Articles" },
  { to: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    // Real-time profile sync
    let profileSub: any;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        profileSub = supabase.channel(`profile-sync-${session.user.id}`)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles',
            filter: `id=eq.${session.user.id}`
          }, (payload) => {
            setProfile(payload.new);
          })
          .subscribe();
      }
    });

    return () => {
      subscription.unsubscribe();
      if (profileSub) supabase.removeChannel(profileSub);
    };
  }, []);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', uid).single();
    if (data) setProfile(data);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowDropdown(false);
  };

  const rawName = profile?.full_name || session?.user?.user_metadata?.full_name || 'User';
  const firstName = rawName.split(' ')[0];
  const initials = rawName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
            <MapPin className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
            ListIQ
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/search"
            className="hidden h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:grid"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Link>

          {session ? (
            <div className="relative flex items-center gap-3" ref={dropdownRef}>
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
              >
                <Sparkles className="h-3 w-3 fill-current" />
                Manage {firstName}
              </Link>
              
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 rounded-full border border-border p-0.5 hover:border-primary transition-all active:scale-95"
              >
                <div className="h-8 w-8 rounded-full bg-primary overflow-hidden flex items-center justify-center border border-white">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-bold">{initials}</span>
                  )}
                </div>
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-border overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 border-b border-border/50 bg-slate-50/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                    <p className="text-[13px] font-bold text-slate-900 truncate">{profile?.full_name || session.user.email}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{session.user.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-foreground rounded-xl transition-all"
                      onClick={() => setShowDropdown(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard Overview
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-foreground rounded-xl transition-all"
                      onClick={() => setShowDropdown(false)}
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                    <div className="h-px bg-border/50 my-1 mx-2" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-all text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/auth"
                search={{ mode: "signin" }}
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent md:inline-flex"
              >
                Sign in
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
              >
                List your business
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg text-foreground hover:bg-accent md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className={cn("md:hidden border-t border-border/60 bg-surface", open ? "block" : "hidden")}>
        <div className="flex flex-col px-4 py-3">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              {n.label}
            </Link>
          ))}
          {!session ? (
            <Link to="/auth" search={{ mode: "signin" }} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
              Sign in
            </Link>
          ) : (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
                Manage Dashboard
              </Link>
              <button onClick={handleSignOut} className="text-left rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50">
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}