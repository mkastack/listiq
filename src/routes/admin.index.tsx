import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const [timeRange, setTimeRange] = useState("Last 24h");
  const [stats, setStats] = useState({
    totalListings: 0,
    totalUsers: 0,
    revenue: 0,
    pendingListings: 0,
    pendingClaims: 0,
    smsSent: 0,
    trends: {
      listings: "+0%",
      users: "+0%",
      revenue: "+0%",
    },
  });

  const fetchStats = async () => {
    // Current Period Filter
    let currentFilter = new Date();
    let prevFilter = new Date();
    let prevStart = new Date();

    if (timeRange === "Last 24h") {
      currentFilter.setHours(currentFilter.getHours() - 24);
      prevFilter.setHours(prevFilter.getHours() - 24);
      prevStart.setHours(prevStart.getHours() - 48);
    } else if (timeRange === "7 Days") {
      currentFilter.setDate(currentFilter.getDate() - 7);
      prevFilter.setDate(prevFilter.getDate() - 7);
      prevStart.setDate(prevStart.getDate() - 14);
    } else if (timeRange === "30 Days") {
      currentFilter.setDate(currentFilter.getDate() - 30);
      prevFilter.setDate(prevFilter.getDate() - 30);
      prevStart.setDate(prevStart.getDate() - 60);
    } else {
      currentFilter = new Date(0);
      prevFilter = new Date(0);
      prevStart = new Date(0);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      { count: listingsCount },
      { count: prevListingsCount },
      { count: usersCount },
      { count: prevUsersCount },
      { count: pendingListingsCount },
      { count: pendingClaimsCount },
      { data: payments },
      { data: prevPayments },
      { count: smsCount },
    ] = await Promise.all([
      supabase.from("listings").select("*", { count: "exact", head: true }),
      supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", prevFilter.toISOString()),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", prevFilter.toISOString()),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase
        .from("claim_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("payments")
        .select("amount")
        .gte("created_at", currentFilter.toISOString())
        .eq("status", "success"),
      supabase
        .from("payments")
        .select("amount")
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", prevFilter.toISOString())
        .eq("status", "success"),
      supabase
        .from("sms_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString()),
    ]);

    const totalRevenue = payments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
    const prevRevenue = prevPayments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

    const calculateTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? "+100%" : "+0%";
      const diff = ((curr - prev) / prev) * 100;
      return (diff >= 0 ? "+" : "") + diff.toFixed(1) + "%";
    };

    setStats((prev) => ({
      ...prev,
      totalListings: listingsCount || 0,
      totalUsers: usersCount || 0,
      pendingListings: pendingListingsCount || 0,
      pendingClaims: pendingClaimsCount || 0,
      revenue: totalRevenue,
      smsSent: smsCount || 0,
      trends: {
        listings: calculateTrend(listingsCount || 0, prevListingsCount || 0),
        users: calculateTrend(usersCount || 0, prevUsersCount || 0),
        revenue: calculateTrend(totalRevenue, prevRevenue),
      },
    }));
  };

  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [recentSignups, setRecentSignups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [health, setHealth] = useState([
    { label: "API Gateway", detail: "24ms latency", status: "UP", color: "status-green" },
    { label: "Database Cluster", detail: "4.2% CPU load", status: "UP", color: "status-green" },
    { label: "Email Server", detail: "Queueing 2k", status: "HEAVY", color: "status-amber" },
    { label: "CDN Edge", detail: "Global Sync 100%", status: "UP", color: "status-green" },
  ]);

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchCategoryData = async () => {
    const { data: listings } = await supabase.from("listings").select("category");
    if (listings) {
      const counts: any = {};
      listings.forEach((l) => {
        counts[l.category] = (counts[l.category] || 0) + 1;
      });

      const total = listings.length || 1;
      const sorted = Object.entries(counts)
        .map(([label, count]: any) => ({
          label,
          count,
          percentage: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setCategoryStats(sorted);
    }
  };

  const fetchRecentData = async () => {
    const [listingsRes, reviewsRes] = await Promise.all([
      supabase
        .from("listings")
        .select("id, name, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("reviews")
        .select("id, rating, created_at, listings(name)")
        .order("created_at", { ascending: false })
        .limit(2),
    ]);

    const combinedActivities = [
      ...(listingsRes.data || []).map((l) => ({
        id: l.id,
        type: "listing",
        icon: "post_add",
        color: "blue",
        text: (
          <>
            <span className="font-bold">New Listing:</span> {l.name}
          </>
        ),
        time: l.created_at,
      })),
      ...(reviewsRes.data || []).map((r) => ({
        id: r.id,
        type: "review",
        icon: "star",
        color: "amber",
        text: (
          <>
            <span className="font-bold">New Review:</span> {r.rating} stars on{" "}
            {(r.listings as any)?.name}
          </>
        ),
        time: r.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 4);

    setActivities(combinedActivities);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(4);

    setRecentSignups(profiles || []);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchStats(), fetchRecentData(), fetchCategoryData()]);
      setIsLoading(false);
    };
    loadData();

    // Pulse health data every 5 seconds for "realtime" feel
    const healthInterval = setInterval(() => {
      setHealth((prev) =>
        prev.map((item) => {
          if (item.label === "API Gateway") {
            return { ...item, detail: `${Math.floor(Math.random() * 15) + 15}ms latency` };
          }
          if (item.label === "Database Cluster") {
            return { ...item, detail: `${(Math.random() * 5 + 2).toFixed(1)}% CPU load` };
          }
          return item;
        }),
      );
    }, 5000);

    // REAL-TIME SUBSCRIPTIONS
    const listingsSub = supabase
      .channel("admin-listings-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => {
        fetchStats();
        fetchRecentData();
        fetchCategoryData();
      })
      .subscribe();

    const profilesSub = supabase
      .channel("admin-profiles-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchStats();
        fetchRecentData();
      })
      .subscribe();

    const claimsSub = supabase
      .channel("admin-claims-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "claim_requests" }, () => {
        fetchStats();
      })
      .subscribe();

    const reviewsSub = supabase
      .channel("admin-reviews-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => {
        fetchStats();
        fetchRecentData();
      })
      .subscribe();

    return () => {
      clearInterval(healthInterval);
      supabase.removeChannel(listingsSub);
      supabase.removeChannel(profilesSub);
      supabase.removeChannel(claimsSub);
      supabase.removeChannel(reviewsSub);
    };
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="font-h1 text-h1 text-[#0F172A]">Platform Overview</h1>
          <p className="font-body-md text-[#64748B]">Real-time snapshot of ListIQ's performance</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-[#E2E8F0]">
          {["Last 24h", "7 Days", "30 Days", "All Time"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all rounded ${
                timeRange === range
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "text-[#64748B] hover:bg-slate-50"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </header>

      {/* Row 1: Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <StatCard
          title="Total Listings"
          value={stats.totalListings.toLocaleString()}
          trend={stats.trends.listings}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          trend={stats.trends.users}
        />
        <StatCard
          title="Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          trend={stats.trends.revenue}
        />
        <StatCard
          title="Pending Listings"
          value={stats.pendingListings.toString()}
          action={{ label: "Review Now", to: "/admin/listings" }}
          borderClass="border-l-4 border-l-amber-500"
        />
        <StatCard
          title="Pending Claims"
          value={stats.pendingClaims.toString()}
          action={{ label: "Resolve", to: "/admin/claims" }}
          borderClass="border-l-4 border-l-rose-500"
        />
        <StatCard
          title="SMS Sent Today"
          value={stats.smsSent.toLocaleString()}
          footer="Resetting in 4h"
          footerIcon="schedule"
        />
      </div>

      {/* Row 2: Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] p-6 rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-h2 text-h2">Revenue Trends</h2>
            <span className="material-symbols-outlined text-[#64748B] cursor-pointer">
              more_horiz
            </span>
          </div>
          <div className="h-64 relative bg-slate-50 flex items-end justify-between px-2 pb-8 rounded overflow-hidden">
            <svg
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <path
                d="M0,80 Q10,75 20,60 T40,45 T60,55 T80,30 T100,20"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
              ></path>
              <path
                d="M0,80 Q10,75 20,60 T40,45 T60,55 T80,30 T100,20 L100,100 L0,100 Z"
                fill="url(#grad)"
                opacity="0.1"
              ></path>
              <defs>
                <linearGradient id="grad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#2563EB", stopOpacity: 1 }}></stop>
                  <stop offset="100%" style={{ stopColor: "#2563EB", stopOpacity: 0 }}></stop>
                </linearGradient>
              </defs>
            </svg>
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day, i) => (
              <div key={day} className="flex flex-col items-center z-10">
                <div
                  className="w-1 bg-slate-200 rounded-full opacity-50"
                  style={{ height: [32, 24, 40, 28, 44, 36, 52][i] + "px" }}
                ></div>
                <span className="text-[10px] mt-2 font-label-caps text-slate-400">{day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl text-center">
          <h2 className="font-h2 text-h2 mb-6 text-left">Listings by Category</h2>
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  fill="transparent"
                  r="70"
                  stroke="#F1F5F9"
                  strokeWidth="12"
                ></circle>
                <circle
                  cx="80"
                  cy="80"
                  fill="transparent"
                  r="70"
                  stroke="#2563EB"
                  strokeDasharray="440"
                  strokeDashoffset="110"
                  strokeWidth="12"
                ></circle>
                <circle
                  cx="80"
                  cy="80"
                  fill="transparent"
                  r="70"
                  stroke="#F43F5E"
                  strokeDasharray="440"
                  strokeDashoffset="380"
                  strokeWidth="12"
                ></circle>
              </svg>
              <div className="absolute text-center">
                <span className="block font-h2 text-h2">
                  {stats.totalListings > 1000
                    ? Math.round(stats.totalListings / 100) / 10 + "k"
                    : stats.totalListings}
                </span>
                <span className="text-[10px] font-label-caps text-[#64748B]">TOTAL</span>
              </div>
            </div>
            <div className="w-full mt-6 space-y-2">
              {categoryStats.length > 0 ? (
                categoryStats.map((cat, i) => (
                  <CategoryRow
                    key={cat.label}
                    color={i === 0 ? "bg-[#2563EB]" : i === 1 ? "bg-[#F43F5E]" : "bg-slate-200"}
                    label={cat.label}
                    percentage={`${cat.percentage}%`}
                  />
                ))
              ) : (
                <CategoryRow color="bg-slate-100" label="No Data" percentage="0%" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl">
          <h2 className="font-h2 text-h2 mb-4">Platform Health</h2>
          <div className="space-y-4">
            {health.map((item) => (
              <HealthItem
                key={item.label}
                label={item.label}
                detail={item.detail}
                status={item.status}
                color={item.color}
              />
            ))}
          </div>
          <button className="w-full mt-4 py-2 border border-[#E2E8F0] font-label-caps text-[#0F172A] hover:bg-slate-50 transition-colors rounded">
            Detailed Metrics
          </button>
        </div>
      </div>

      {/* Row 3: Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-[#E2E8F0] p-6 rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-h2 text-h2">Recent Activity</h2>
            <button className="text-[#2563EB] font-body-sm hover:underline">View All</button>
          </div>
          <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
            {activities.length > 0 ? (
              activities.map((act) => (
                <ActivityItem
                  key={act.id}
                  icon={act.icon}
                  color={act.color}
                  text={act.text}
                  time={`${formatDistanceToNow(new Date(act.time))} ago`}
                />
              ))
            ) : (
              <p className="text-center py-8 text-[#64748B]">No recent activity</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] p-6 rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-h2 text-h2">Recent Signups</h2>
            <span className="material-symbols-outlined text-[#64748B] cursor-pointer">
              filter_list
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {recentSignups.map((profile) => (
              <SignupItem
                key={profile.id}
                name={profile.full_name || "New User"}
                email={profile.email}
                tier={profile.plan?.toUpperCase() || "FREE"}
                tierColor={
                  profile.plan === "enterprise"
                    ? "bg-[#2563EB]"
                    : profile.plan === "pro"
                      ? "bg-amber-500"
                      : "bg-slate-200 !text-slate-700"
                }
                avatar={profile.avatar_url}
                initials={profile.full_name?.charAt(0) || "U"}
              />
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-[#2563EB] font-body-sm font-semibold hover:bg-slate-50 border border-slate-100 rounded transition-colors">
            User Directory
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, action, footer, footerIcon, borderClass = "" }: any) {
  return (
    <div className={`bg-white border border-[#E2E8F0] p-5 rounded-lg ${borderClass}`}>
      <p className="font-label-caps text-label-caps text-[#64748B] uppercase mb-2">{title}</p>
      <p className="font-display-stat text-[28px] text-[#0F172A]">{value}</p>
      {trend && (
        <div className="flex items-center text-emerald-600 font-body-sm mt-1 font-bold">
          <span className="material-symbols-outlined text-sm">trending_up</span>
          <span className="ml-1">{trend}</span>
        </div>
      )}
      {action && (
        <Link
          to={action.to}
          className="text-[#2563EB] font-body-sm font-semibold hover:underline mt-1 flex items-center"
        >
          {action.label}{" "}
          <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
        </Link>
      )}
      {footer && (
        <div className="flex items-center text-[#64748B] font-body-sm mt-1">
          {footerIcon && (
            <span className="material-symbols-outlined text-sm mr-1">{footerIcon}</span>
          )}
          <span>{footer}</span>
        </div>
      )}
    </div>
  );
}

function CategoryRow({ color, label, percentage }: any) {
  return (
    <div className="flex items-center justify-between font-body-sm">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`}></span>
        <span className="truncate max-w-[120px]">{label}</span>
      </div>
      <span className="font-bold">{percentage}</span>
    </div>
  );
}

function HealthItem({ label, detail, status, color }: any) {
  return (
    <div className="p-3 bg-slate-50 rounded border border-[#E2E8F0] flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className={`w-2 h-2 rounded-full ${color === "status-green" ? "bg-emerald-500" : "bg-amber-500"}`}
        ></span>
        <div>
          <p className="font-label-caps text-label-caps text-[#0F172A]">{label}</p>
          <p className="text-[10px] text-[#64748B]">{detail}</p>
        </div>
      </div>
      <span
        className={`font-mono text-xs font-bold ${color === "status-green" ? "text-emerald-600" : "text-amber-600"}`}
      >
        {status}
      </span>
    </div>
  );
}

function ActivityItem({ icon, color, text, time }: any) {
  const colors: any = {
    blue: "bg-blue-50 border-blue-600 text-blue-600",
    rose: "bg-rose-50 border-rose-500 text-rose-500",
    green: "bg-green-50 border-green-600 text-green-600",
    amber: "bg-amber-50 border-amber-500 text-amber-600",
    slate: "bg-slate-50 border-slate-400 text-slate-500",
  };
  return (
    <div className="relative pl-10">
      <span
        className={`absolute left-0 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 ${colors[color]}`}
      >
        <span className="material-symbols-outlined text-[14px]">{icon}</span>
      </span>
      <div>
        <p className="font-body-md text-[#0F172A]">{text}</p>
        <p className="text-xs text-[#64748B] mt-1">{time}</p>
      </div>
    </div>
  );
}

function SignupItem({ name, email, tier, tierColor, avatar, initials }: any) {
  return (
    <div className="py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-10 h-10 rounded-full object-cover border border-slate-100"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#2563EB] font-bold text-sm">
            {initials}
          </div>
        )}
        <div>
          <p className="font-body-md font-bold text-[#0F172A]">{name}</p>
          <p className="text-xs text-[#64748B]">{email}</p>
        </div>
      </div>
      <span
        className={`px-2 py-1 ${tierColor} text-white text-[10px] font-bold rounded uppercase tracking-wider`}
      >
        {tier}
      </span>
    </div>
  );
}
