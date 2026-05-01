import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { AdminAddListingModal } from "../components/admin/AdminAddListingModal";

export const Route = createFileRoute("/admin/listings")({
  component: AdminListings,
});

function AdminListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    rejected: 0,
    premium: 0,
  });

  const fetchListings = async () => {
    setIsLoading(true);
    let query = supabase
      .from("listings")
      .select("*, profiles(full_name, email, avatar_url)")
      .order("created_at", { ascending: false });

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%, address.ilike.%${searchQuery}%`);
    }

    if (statusFilter !== "All Status") {
      query = query.eq("status", statusFilter.toLowerCase());
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching listings:", error);
    }
    if (data) setListings(data);

    // Fetch stats
    const [
      { count: totalCount },
      { count: activeCount },
      { count: pendingCount },
      { count: rejectedCount },
    ] = await Promise.all([
      supabase.from("listings").select("*", { count: "exact", head: true }),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected"),
    ]);

    setStats({
      total: totalCount || 0,
      active: activeCount || 0,
      pending: pendingCount || 0,
      rejected: rejectedCount || 0,
      premium: data?.filter((l) => l.is_featured).length || 0,
    });

    setIsLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-listings-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => {
        fetchListings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("listings").update({ status }).eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchListings();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;

    const { error } = await supabase.from("listings").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchListings();
  };

  return (
    <main className="max-w-[1440px] mx-auto px-6 py-8">
      {/* Header & Breadcrumbs */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Dashboard
          </span>
          <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">
            Listings Management
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Directory Inventory</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Review, verify, and moderate business submissions
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
          >
            <span className="material-symbols-outlined">add</span>
            Add Listing
          </button>
        </div>
      </div>

      {/* Stats Chips Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
        {[
          { label: "TOTAL", value: stats.total.toLocaleString(), trend: "+12%", color: "emerald" },
          {
            label: "ACTIVE",
            value: stats.active.toLocaleString(),
            icon: "check_circle",
            color: "emerald",
          },
          {
            label: "PENDING",
            value: stats.pending.toLocaleString(),
            icon: "pending",
            color: "amber",
          },
          {
            label: "REJECTED",
            value: stats.rejected.toLocaleString(),
            icon: "cancel",
            color: "rose",
          },
          {
            label: "FEATURED",
            value: stats.premium.toLocaleString(),
            icon: "diamond",
            color: "blue",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`bg-white border border-slate-200 p-5 rounded-xl shadow-sm ${stat.label === "PENDING" && stats.pending > 0 ? "border-l-4 border-l-amber-500" : ""}`}
          >
            <p className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-[0.15em]">
              {stat.label}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-slate-900">
                {isLoading ? "..." : stat.value}
              </span>
              {stat.trend && !isLoading ? (
                <span className="text-emerald-600 bg-emerald-50 text-[11px] font-bold px-2 py-1 rounded-lg border border-emerald-100">
                  {stat.trend}
                </span>
              ) : (
                <span className={`material-symbols-outlined text-${stat.color}-500 font-bold`}>
                  {stat.icon}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl mb-6 overflow-hidden shadow-sm">
        <div className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white outline-none text-sm transition-all"
              placeholder="Search by name, address, or owner..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold bg-slate-50 outline-none focus:border-blue-600 focus:bg-white cursor-pointer transition-all uppercase tracking-wider"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Pending</option>
              <option>Suspended</option>
              <option>Rejected</option>
            </select>
          </div>
          <button
            onClick={fetchListings}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-600 font-bold text-xs hover:bg-slate-50 rounded-xl transition-colors border border-slate-200 uppercase tracking-widest"
          >
            <span
              className={`material-symbols-outlined text-lg ${isLoading ? "animate-spin" : ""}`}
            >
              refresh
            </span>
            Sync
          </button>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-y border-slate-200">
              <tr>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-8">
                  BUSINESS
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  CATEGORY
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  CITY
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  STATUS
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  METRICS
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  BADGES
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  OWNER
                </th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listings.map((listing) => (
                <tr
                  key={listing.id}
                  className={`hover:bg-slate-50/50 transition-colors ${listing.status === "pending" ? "border-l-4 border-l-amber-500" : listing.status === "rejected" ? "border-l-4 border-l-rose-500" : ""}`}
                >
                  <td className="p-4 px-8">
                    <div className="flex items-center gap-3">
                      {listing.logo_url ? (
                        <img
                          src={listing.logo_url}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase shadow-sm">
                          {listing.name.substring(0, 2)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 leading-none mb-1.5">
                          {listing.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">
                          ID: #{listing.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest">
                      {listing.category || "N/A"}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-600 font-bold uppercase tracking-wider">
                    {listing.city || "GLOBAL"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-[0.1em] border ${
                        listing.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : listing.status === "pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          listing.status === "active"
                            ? "bg-emerald-500"
                            : listing.status === "pending"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }`}
                      ></span>
                      {listing.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-[9px] font-bold text-slate-400 leading-none uppercase tracking-tighter">
                          VIEWS
                        </p>
                        <p className="font-bold text-xs mt-1">
                          {listing.views_count?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-bold text-slate-400 leading-none uppercase tracking-tighter">
                          REVS
                        </p>
                        <p className="font-bold text-xs mt-1">{listing.review_count || 0}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`material-symbols-outlined text-xl ${listing.is_verified ? "text-blue-500 fill-1" : "text-slate-200"}`}
                        style={{ fontVariationSettings: listing.is_verified ? "'FILL' 1" : "" }}
                      >
                        verified
                      </span>
                      <span
                        className={`material-symbols-outlined text-xl ${listing.is_featured ? "text-amber-400 fill-1" : "text-slate-200"}`}
                        style={{ fontVariationSettings: listing.is_featured ? "'FILL' 1" : "" }}
                      >
                        star
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {listing.profiles?.avatar_url ? (
                        <img
                          alt="User"
                          className="w-7 h-7 rounded-full border border-slate-200 shadow-sm"
                          src={listing.profiles.avatar_url}
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                          {listing.profiles?.full_name?.charAt(0) || "U"}
                        </div>
                      )}
                      <span className="text-[11px] font-bold text-slate-700 truncate max-w-[100px]">
                        {listing.profiles?.full_name || "System"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {listing.status === "pending" && (
                        <button
                          onClick={() => handleUpdateStatus(listing.id, "active")}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <span className="material-symbols-outlined text-xl">check_circle</span>
                        </button>
                      )}
                      {listing.status === "active" && (
                        <button
                          onClick={() => handleUpdateStatus(listing.id, "suspended")}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Suspend"
                        >
                          <span className="material-symbols-outlined text-xl">block</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {listings.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                    No listings found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Placeholder */}
        <div className="p-4 px-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Showing <span className="text-slate-900">{listings.length}</span> of{" "}
            <span className="text-slate-900">{stats.total}</span> entries
          </p>
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 rounded-lg bg-blue-600 text-white text-xs font-black shadow-md shadow-blue-600/20">
              1
            </button>
            <button className="w-8 h-8 rounded-lg text-slate-400 hover:bg-white text-xs font-bold transition-colors">
              2
            </button>
            <button className="w-8 h-8 rounded-lg text-slate-400 hover:bg-white text-xs font-bold transition-colors">
              3
            </button>
          </div>
        </div>
      </div>

      {/* Admin Add Listing Modal */}
      <AdminAddListingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchListings}
      />
    </main>
  );
}
