import { Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export function TopNav({ onMenuClick }: { onMenuClick?: () => void }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", session.user.id)
        .single();

      if (data) setProfile(data);
    }
    fetchProfile();
  }, []);

  const performSearch = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data } = await supabase
      .from("listings")
      .select("id, title")
      .eq("owner_id", session.user.id)
      .ilike("title", `%${query}%`)
      .limit(5);

    if (data) setSearchResults(data);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:px-8 py-3 h-16 gap-4">
      {/* Mobile Hamburger (visible only on small screens) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Search Bar */}
      <div className="flex items-center flex-1 relative">
        <div className="relative w-full max-w-md group hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
            search
          </span>
          <input
            className="w-full bg-muted border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
            placeholder="Search your listings..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Search Results Dropdown */}
        {searchQuery && (
          <div className="absolute top-12 left-0 w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <Link
                  key={result.id}
                  to={`/dashboard/listings`}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
                  onClick={() => setSearchQuery("")}
                >
                  <span className="material-symbols-outlined text-slate-400 text-lg">store</span>
                  {result.title}
                </Link>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-slate-400 italic">
                No listings found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}

        {/* Mobile Search Icon */}
        <button className="sm:hidden p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors ml-auto">
          <span className="material-symbols-outlined">search</span>
        </button>
      </div>

      {/* Actions / Profile */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <Link
          to="/dashboard/notifications"
          className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors relative"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
        </Link>
        <button className="hidden sm:block p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors">
          <span className="material-symbols-outlined">help</span>
        </button>
        <div className="hidden sm:block h-8 w-px bg-border mx-1 md:mx-2"></div>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded-lg transition-all active:scale-95"
          >
            <div className="w-8 h-8 rounded-full border border-slate-200 shadow-sm bg-slate-100 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  className="w-full h-full object-cover"
                  alt="Profile"
                />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                  {initials}
                </div>
              )}
            </div>
            <span
              className={`material-symbols-outlined text-muted-foreground hidden md:block transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
            >
              expand_more
            </span>
          </div>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-50 mb-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Account
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                  {profile?.full_name || "Loading..."}
                </p>
              </div>
              <Link
                to="/"
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                onClick={() => setIsProfileOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Leave to Main Site
              </Link>
              <Link
                to="/dashboard/settings"
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
                onClick={() => setIsProfileOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                Settings
              </Link>
              <div className="h-[1px] bg-slate-50 my-1 mx-2"></div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-all text-left"
              >
                <span className="material-symbols-outlined text-[20px]">power_settings_new</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
