import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { generateListingInsights } from "../lib/openai";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    setSession(currentSession);
    if (!currentSession?.user) return;

    const [profileRes, listingsRes, activityRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", currentSession.user.id).single(),
      supabase.from("listings").select("*").eq("owner_id", currentSession.user.id),
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", currentSession.user.id)
        .order("created_at", { ascending: false })
        .limit(4),
    ]);

    setProfile(profileRes.data);
    setListings(listingsRes.data || []);
    setActivity(activityRes.data || []);
    setIsLoading(false);
  };

  const handleGetAiInsights = async () => {
    if (listings.length === 0) {
      alert("Please add at least one listing to generate insights.");
      return;
    }

    setIsAiLoading(true);
    setShowAiModal(true);
    try {
      const insights = await generateListingInsights(listings);
      setAiInsights(insights);
    } catch (error: any) {
      alert("AI Error: " + error.message);
      setShowAiModal(false);
    }
    setIsAiLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();

    // REAL-TIME SUBSCRIPTIONS
    let listingsSub: any;
    let profileSub: any;
    let notificationsSub: any;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!currentSession?.user) return;

      listingsSub = supabase
        .channel(`dashboard-listings-${currentSession.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "listings",
            filter: `owner_id=eq.${currentSession.user.id}`,
          },
          () => {
            fetchDashboardData();
          },
        )
        .subscribe();

      profileSub = supabase
        .channel(`dashboard-profile-${currentSession.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${currentSession.user.id}`,
          },
          () => {
            fetchDashboardData();
          },
        )
        .subscribe();

      notificationsSub = supabase
        .channel(`dashboard-notifications-${currentSession.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${currentSession.user.id}`,
          },
          () => {
            fetchDashboardData();
          },
        )
        .subscribe();
    });

    return () => {
      if (listingsSub) supabase.removeChannel(listingsSub);
      if (profileSub) supabase.removeChannel(profileSub);
      if (notificationsSub) supabase.removeChannel(notificationsSub);
    };
  }, []);

  const activeListings = listings.filter((l) => l.status === "active").length;
  const totalViews = listings.reduce((acc, curr) => acc + (curr.views || 0), 0);

  const rawName = profile?.full_name || session?.user?.user_metadata?.full_name || "User";
  const firstName = rawName.split(" ")[0];

  const planName = profile?.subscription_plan || "Free";
  const normalizedPlan = planName.charAt(0).toUpperCase() + planName.slice(1).toLowerCase();
  const limits: any = { Free: 3, Starter: 100, Pro: 1000, Ultra: 10000, Enterprise: 10000 };
  const maxListings = limits[normalizedPlan] || 3;
  const usagePercent = Math.min(Math.round((listings.length / maxListings) * 100), 100);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-24">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {firstName} 👋</h1>
        <p className="text-sm text-muted-foreground">
          Here's what's happening with your listings today.
        </p>
      </div>

      {/* Row 1: Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Active Listings */}
        <div className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col min-h-[170px] group cursor-pointer hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-[0.05em]">
              Active Listings
            </span>
            <div className="p-2 bg-[#eef2ff] rounded-lg group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-blue-200 shrink-0">
              <span
                className="material-symbols-outlined text-blue-600 group-hover:text-white text-[20px] transition-colors"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                inventory_2
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-auto mb-4">
            <span className="text-[30px] leading-none font-semibold font-display text-slate-900 group-hover:text-blue-600 transition-colors">
              {isLoading ? "..." : activeListings}
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-[11px] font-bold rounded-full flex items-center gap-1 shrink-0">
              <span className="material-symbols-outlined text-[12px]">trending_up</span> +0%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-1000"
              style={{ width: `${(activeListings / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Profile Views */}
        <div className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col min-h-[170px] group cursor-pointer hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-[0.05em]">
              Total Views
            </span>
            <div className="p-2 bg-[#eef2ff] rounded-lg group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-blue-200 shrink-0">
              <span
                className="material-symbols-outlined text-blue-600 group-hover:text-white text-[20px] transition-colors"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                visibility
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-auto mb-4">
            <span className="text-[30px] leading-none font-semibold font-display text-slate-900 group-hover:text-blue-600 transition-colors">
              {isLoading ? "..." : totalViews.toLocaleString()}
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-[11px] font-bold rounded-full flex items-center gap-1 shrink-0">
              <span className="material-symbols-outlined text-[12px]">trending_up</span> 12.5%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
              style={{ width: "75%" }}
            ></div>
          </div>
        </div>

        {/* Card 3: Saved Businesses */}
        <div className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col min-h-[170px] group cursor-pointer hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-[0.05em]">
              Reviews Recieved
            </span>
            <div className="p-2 bg-[#eef2ff] rounded-lg group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-blue-200 shrink-0">
              <span
                className="material-symbols-outlined text-blue-600 group-hover:text-white text-[20px] transition-colors"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-auto mb-4">
            <span className="text-[30px] leading-none font-semibold font-display text-slate-900 group-hover:text-blue-600 transition-colors">
              0
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[11px] font-bold rounded-full flex items-center gap-1 shrink-0">
              <span className="material-symbols-outlined text-[12px]">sync</span> Steady
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
              style={{ width: "45%" }}
            ></div>
          </div>
        </div>

        {/* Card 4: Plan Status */}
        <div className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col min-h-[170px] group cursor-pointer hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-[0.05em]">
              Plan Status
            </span>
            <div className="p-2 bg-[#eef2ff] rounded-lg group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-blue-200 shrink-0">
              <span
                className="material-symbols-outlined text-blue-600 group-hover:text-white text-[20px] transition-colors"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                workspace_premium
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-auto mb-4">
            <div className="flex flex-col">
              <span className="text-[24px] leading-none font-semibold font-display text-slate-900 group-hover:text-blue-600 transition-colors">
                {normalizedPlan}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 font-medium italic">
                Active Subscriber
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-1000"
              style={{ width: "90%" }}
            ></div>
          </div>
        </div>
      </div>

      {/* Row 2: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left (60%): Listings Table */}
        <div className="lg:col-span-6 bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Your Listings</h2>
            <button className="text-primary text-sm font-semibold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Listing Name
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Views
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {listings.length > 0 ? (
                  listings.slice(0, 5).map((l, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                            {l.logo_url ? (
                              <img src={l.logo_url} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-muted-foreground">
                                store
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-sm text-foreground">{l.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                            l.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {l.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{l.views || 0}</td>
                      <td className="px-6 py-4">
                        <button className="text-muted-foreground hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-sm text-muted-foreground italic"
                    >
                      You haven't added any listings yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right (40%): Recent Activity */}
        <div className="lg:col-span-4 bg-card rounded-2xl shadow-sm border border-border p-6 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
          <div className="relative space-y-8">
            <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-border"></div>

            {activity.length > 0 ? (
              activity.map((act, i) => (
                <div key={i} className="relative flex gap-4">
                  <div className="w-4 h-4 rounded-full bg-primary border-4 border-card shadow-sm z-10 shrink-0"></div>
                  <div className="flex flex-col gap-1 -mt-1">
                    <p className="text-sm font-semibold text-foreground">{act.title}</p>
                    <p className="text-[12px] text-muted-foreground line-clamp-1">{act.message}</p>
                    <span className="text-[11px] text-muted-foreground/70 mt-1">
                      {new Date(act.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic py-4">
                No recent activity detected.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Plan Usage Banner */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-6 z-10 w-full md:w-auto">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-3xl">rocket_launch</span>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-foreground">
              Plan Usage: <span className="text-primary">{normalizedPlan}</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              You are using {listings.length} of your {maxListings} available listing slots.
            </p>
          </div>
        </div>
        <div className="flex-1 w-full max-w-md z-10">
          <div className="flex justify-between text-[12px] font-bold text-secondary-foreground mb-2">
            <span>Usage: {usagePercent}%</span>
            <span>{maxListings} Listings Max</span>
          </div>
          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${usagePercent}%` }}
            ></div>
          </div>
        </div>
        <div className="z-10 w-full md:w-auto mt-4 md:mt-0">
          <Link
            to="/dashboard/billing"
            className="w-full md:w-auto px-6 py-2.5 bg-background border border-border text-foreground font-semibold rounded-lg hover:bg-muted/50 transition-colors shadow-sm inline-flex items-center justify-center"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>

      {/* Contextual Dashboard Grid Section (Bento Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-[20px] p-6 md:p-8 text-white relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none">
            <span
              className="material-symbols-outlined text-[200px] md:text-[250px]"
              style={{ fontVariationSettings: "'wght' 200" }}
            >
              insights
            </span>
          </div>
          <div className="relative z-10 max-w-md">
            <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
              Intelligence
            </span>
            <h2 className="text-2xl font-bold mb-4">Discover Listing Insights</h2>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Our new AI-powered analytics engine can now predict your listing's performance based
              on local market trends and search frequency.
            </p>
            <button
              onClick={handleGetAiInsights}
              className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center md:justify-start gap-2 hover:scale-105 transition-transform w-full md:w-auto"
            >
              Try AI Insights{" "}
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
            </button>
          </div>
        </div>

        {/* AI Insights Modal */}
        {showAiModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95 duration-300">
              <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-blue-600/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                    <span className="material-symbols-outlined text-xl">auto_awesome</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">AI Listing Insights</h2>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em] mt-0.5">
                      Powered by GPT-4o
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-400"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8">
                {isAiLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      Analyzing Your Business...
                    </h3>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                      Our AI engine is processing your listing data against local market trends in
                      Ghana.
                    </p>
                  </div>
                ) : aiInsights ? (
                  <>
                    {/* Market Score */}
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Overall Market Potential
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900">High Growth Potential</h3>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-4xl font-black text-blue-600">{aiInsights.score}%</div>
                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">
                          Confidence Index
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div>
                      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span> Executive
                        Summary
                      </h4>
                      <p className="text-slate-600 leading-relaxed text-sm font-medium italic">
                        "{aiInsights.summary}"
                      </p>
                    </div>

                    {/* Grid Predictions & Recommendations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-500 text-lg">
                            trending_up
                          </span>{" "}
                          Predictions
                        </h4>
                        <div className="space-y-2">
                          {aiInsights.predictions.map((p: string, i: number) => (
                            <div
                              key={i}
                              className="p-3 bg-amber-50 rounded-xl text-xs font-bold text-amber-800 border border-amber-100"
                            >
                              {p}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <span className="material-symbols-outlined text-emerald-500 text-lg">
                            lightbulb
                          </span>{" "}
                          Recommendations
                        </h4>
                        <div className="space-y-2">
                          {aiInsights.recommendations.map((r: string, i: number) => (
                            <div
                              key={i}
                              className="p-3 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-800 border border-emerald-100"
                            >
                              {r}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 text-sm"
                >
                  Close Insights
                </button>
                <button
                  onClick={handleGetAiInsights}
                  className="flex-[2] bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20 text-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">refresh</span>
                  Re-Analyze
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card rounded-[20px] border border-border p-6 md:p-8 flex flex-col justify-between group cursor-pointer hover:border-primary/30 transition-colors">
          <div>
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-orange-600 text-2xl">
                support_agent
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Priority Support</h3>
            <p className="text-muted-foreground text-sm">
              As a Pro user, you have access to 24/7 dedicated account management.
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm mt-8">
            Connect with an agent{" "}
            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </div>
      </div>

      {/* Contextual FAB (Only for Home/Overview) */}
      <button className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-2xl" data-weight="fill">
          add
        </span>
      </button>
    </div>
  );
}
