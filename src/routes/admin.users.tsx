import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pro: 0,
    suspended: 0,
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    let query = supabase
      .from("profiles")
      .select("*, listings(id)")
      .order("created_at", { ascending: false });

    if (searchQuery) {
      query = query.or(`full_name.ilike.%${searchQuery}%, email.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching users:", error);
    }

    if (data) {
      const usersWithCount = data.map((u) => ({
        ...u,
        listingsCount: u.listings?.length || 0,
      }));
      setUsers(usersWithCount);
    }

    // Fetch stats
    const [{ count: totalCount }, { count: suspendedCount }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_suspended", true),
    ]);

    setStats({
      total: totalCount || 0,
      verified: data?.filter((u) => u.is_verified).length || 0,
      pro: data?.filter((u) => u.subscription_plan === "pro").length || 0,
      suspended: suspendedCount || 0,
    });

    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    const channel = supabase
      .channel("admin-users-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchUsers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchQuery]);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: !currentStatus })
      .eq("id", id);

    if (error) alert(error.message);
    else if (selectedUser?.id === id) {
      setSelectedUser({ ...selectedUser, is_suspended: !currentStatus });
    }
  };

  const handleUpdateRole = async (id: string, role: string) => {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);

    if (error) alert(error.message);
  };

  return (
    <main className="max-w-[1440px] mx-auto px-6 py-8 relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <nav className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Dashboard
            </span>
            <span className="material-symbols-outlined text-xs text-slate-300">chevron_right</span>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">
              User Directory
            </span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900">Platform Participants</h1>
          <p className="text-slate-500 text-sm font-medium">
            Manage accounts, roles, and platform permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <span
              className={`material-symbols-outlined text-lg ${isLoading ? "animate-spin" : ""}`}
            >
              refresh
            </span>
            Sync Data
          </button>
        </div>
      </div>

      {/* Stats Chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: "TOTAL USERS",
            value: stats.total.toLocaleString(),
            icon: "group",
            color: "blue",
          },
          {
            label: "VERIFIED",
            value: stats.verified.toLocaleString(),
            icon: "verified",
            color: "emerald",
          },
          { label: "PRO PLANS", value: stats.pro.toLocaleString(), icon: "star", color: "amber" },
          {
            label: "SUSPENDED",
            value: stats.suspended.toLocaleString(),
            icon: "block",
            color: "rose",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                stat.color === "blue"
                  ? "bg-blue-50 text-blue-600 border-blue-100"
                  : stat.color === "emerald"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : stat.color === "amber"
                      ? "bg-amber-50 text-amber-600 border-amber-100"
                      : "bg-rose-50 text-rose-600 border-rose-100"
              }`}
            >
              <span className="material-symbols-outlined text-2xl font-bold">{stat.icon}</span>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">
                {isLoading ? "..." : stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-grow w-full relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white outline-none transition-all"
              placeholder="Search by name, email or ID..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  Participant
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  Contact
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  Role
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  Plan
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center">
                  Listings
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  Status
                </th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${user.is_suspended ? "bg-rose-50/30" : ""}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          alt={user.full_name}
                          className="w-10 h-10 rounded-full border border-slate-100 shadow-sm"
                          src={user.avatar_url}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200 shadow-sm">
                          {user.full_name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 text-sm leading-none mb-1.5">
                          {user.full_name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          ID: {user.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-700">{user.email}</p>
                    <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider mt-0.5">
                      {user.phone || "NO PHONE"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      value={user.role || "user"}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border outline-none ${
                        user.role === "admin"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : user.role === "editor"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                        user.subscription_plan === "pro"
                          ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                          : user.subscription_plan === "enterprise"
                            ? "bg-slate-900 text-white border-slate-950 shadow-sm"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}
                    >
                      {user.subscription_plan || "FREE"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-center font-bold text-slate-700">
                    {user.listingsCount}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${!user.is_suspended ? "bg-emerald-500" : "bg-rose-500"}`}
                      ></span>
                      <span
                        className={`font-black text-[9px] uppercase tracking-widest ${!user.is_suspended ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {!user.is_suspended ? "Active" : "Suspended"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(user.id, user.is_suspended);
                      }}
                      className={`p-2 rounded-lg transition-all ${user.is_suspended ? "text-emerald-600 hover:bg-emerald-50" : "text-rose-400 hover:bg-rose-50"}`}
                      title={user.is_suspended ? "Unsuspend User" : "Suspend User"}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {user.is_suspended ? "check_circle" : "block"}
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !isLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-20 text-center text-slate-400 italic font-medium"
                  >
                    No participants found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Placeholder */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Showing {users.length} of {stats.total} entries
          </span>
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-600/20">
              1
            </button>
            <button className="w-8 h-8 rounded-lg text-slate-400 hover:bg-white font-bold text-xs transition-colors">
              2
            </button>
            <button className="w-8 h-8 rounded-lg text-slate-400 hover:bg-white font-bold text-xs transition-colors">
              3
            </button>
          </div>
        </div>
      </div>

      {/* Side Over Drawer (User Detail) */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedUser(null)}
          ></div>
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Participant Details</h2>
              <button
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                onClick={() => setSelectedUser(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-grow overflow-y-auto">
              <div className="p-6 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                  {selectedUser.avatar_url ? (
                    <img
                      alt={selectedUser.full_name}
                      className="w-20 h-20 rounded-2xl shadow-md border-4 border-white object-cover"
                      src={selectedUser.avatar_url}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-2xl font-bold text-slate-300 border-4 border-white shadow-md uppercase">
                      {selectedUser.full_name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-xl font-bold text-slate-900 leading-tight">
                      {selectedUser.full_name}
                    </p>
                    <p className="text-slate-500 text-xs font-medium flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      {selectedUser.city || "Location not set"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                          selectedUser.is_suspended
                            ? "bg-rose-50 text-rose-600 border-rose-100"
                            : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        }`}
                      >
                        {selectedUser.is_suspended ? "Suspended" : "Active"}
                      </span>
                      <span className="bg-blue-600 text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-blue-700 shadow-sm">
                        {selectedUser.subscription_plan || "FREE"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => (window.location.href = `mailto:${selectedUser.email}`)}
                    className="bg-blue-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    Message
                  </button>
                  <button
                    onClick={() => handleToggleStatus(selectedUser.id, selectedUser.is_suspended)}
                    className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all active:scale-95 border ${selectedUser.is_suspended ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}
                  >
                    {selectedUser.is_suspended ? "Unsuspend" : "Suspend"}
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-8">
                <section>
                  <p className="text-[9px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">
                    Contact Information
                  </p>
                  <div className="space-y-4">
                    {[
                      { label: "Direct Email", value: selectedUser.email },
                      { label: "Mobile Phone", value: selectedUser.phone || "Not Provided" },
                      {
                        label: "Registration Date",
                        value: new Date(selectedUser.created_at).toLocaleDateString(),
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between border-b border-slate-50 pb-3"
                      >
                        <span className="text-slate-500 text-xs font-medium">{item.label}</span>
                        <span className="font-bold text-slate-900 text-xs">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Platform History
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                          Active Listings
                        </span>
                        <span className="text-xl font-black text-slate-900">
                          {selectedUser.listingsCount}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${Math.min(100, selectedUser.listingsCount * 10)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => {
                  if (
                    window.confirm("Permanently delete this user? This action is irreversible.")
                  ) {
                    supabase
                      .from("profiles")
                      .delete()
                      .eq("id", selectedUser.id)
                      .then(() => setSelectedUser(null));
                  }
                }}
                className="w-full py-4 border border-rose-200 bg-white text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">delete_forever</span>
                Terminate Account
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
