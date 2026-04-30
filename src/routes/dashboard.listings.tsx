import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/dashboard/listings")({
  component: MyListings,
});

function MyListings() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchListings = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) setListings(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (!error) {
      setListings(listings.filter(l => l.id !== id));
      setActiveDropdown(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    pending: listings.filter(l => l.status === 'pending').length
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full pb-24 overflow-hidden">
      {/* Page Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">My Listings</h1>
          <p className="text-slate-500 text-sm mt-1 font-body-base">Manage and monitor all your business listings</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            <button className="px-4 py-1.5 text-xs font-bold rounded-md bg-slate-100 text-slate-900">All</button>
            <button className="px-4 py-1.5 text-xs font-bold rounded-md text-slate-500 hover:text-slate-900 transition-colors">Active</button>
            <button className="px-4 py-1.5 text-xs font-bold rounded-md text-slate-500 hover:text-slate-900 transition-colors">Pending</button>
          </div>
          <Link
            to="/dashboard/add-listing"
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Add New Listing</span>
          </Link>
        </div>
      </div>

      {/* Stats Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col group hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total Listings</p>
              <h3 className="text-2xl font-bold font-display text-slate-900 mt-1">{isLoading ? '...' : stats.total}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-auto">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: "100%" }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col group hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Active Listings</p>
              <h3 className="text-2xl font-bold font-display text-slate-900 mt-1">{isLoading ? '...' : stats.active}</h3>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 shrink-0 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-auto">
            <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: stats.total > 0 ? `${(stats.active / stats.total) * 100}%` : '0%' }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col group hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Pending Approval</p>
              <h3 className="text-2xl font-bold font-display text-slate-900 mt-1">{isLoading ? '...' : stats.pending}</h3>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 shrink-0 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>pending</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-auto">
            <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: stats.total > 0 ? `${(stats.pending / stats.total) * 100}%` : '0%' }}></div>
          </div>
        </div>
      </div>

      {/* Listings Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden max-w-full">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold font-display text-slate-900">Recent Listings</h3>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="material-symbols-outlined">download</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto w-full scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-3 md:px-6 py-4 w-10 text-center">
                  <input className="rounded border-slate-300 text-blue-600 focus:ring-blue-600/20" type="checkbox" />
                </th>
                <th className="px-4 py-4 text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest">Business</th>
                <th className="hidden md:table-cell px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
                <th className="px-4 py-4 text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="hidden lg:table-cell px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Plan</th>
                <th className="hidden sm:table-cell px-4 py-4 text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Views</th>
                <th className="hidden md:table-cell px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Created</th>
                <th className="px-4 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {listings.length > 0 ? listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-slate-50/50 transition-colors group relative">
                  <td className="px-3 md:px-6 py-4 text-center">
                    <input className="rounded border-slate-300 text-blue-600 focus:ring-blue-600/20" type="checkbox" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                        {listing.logo_url ? <img src={listing.logo_url} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-400">store</span>}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate max-w-[120px] md:max-w-[200px]">{listing.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{listing.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-4">
                    <span className="text-sm text-slate-600">{listing.category}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div
                      className={`inline-flex items-center gap-1.5 py-1 px-2 md:px-2.5 rounded-full text-[9px] md:text-[10px] font-bold ${
                        listing.status === "active"
                          ? "bg-green-100 text-green-700"
                          : listing.status === "pending"
                           ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      <span
                        className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${
                          listing.status === "active" ? "bg-green-500" : listing.status === "pending" ? "bg-orange-500" : "bg-red-500"
                        }`}
                      ></span>
                      <span className="hidden sm:inline uppercase">{listing.status}</span>
                      <span className="sm:hidden uppercase">{listing.status?.charAt(0)}</span>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-4 py-4 text-center">
                    <span
                      className={`inline-block py-1 px-3 rounded-md text-[10px] font-bold ${
                        listing.is_premium ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {listing.is_premium ? 'PREMIUM' : 'BASIC'}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-4 text-center">
                    <span className="text-sm font-bold text-slate-700">{listing.views || 0}</span>
                  </td>
                  <td className="hidden md:table-cell px-4 py-4">
                    <span className="text-sm text-slate-600">{new Date(listing.created_at).toLocaleDateString()}</span>
                  </td>
                  <td className="px-4 py-4 text-right relative" ref={activeDropdown === listing.id ? dropdownRef : null}>
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === listing.id ? null : listing.id)}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {activeDropdown === listing.id && (
                      <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                          View Listing
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                          Edit Listing
                        </button>
                        <div className="my-1 border-t border-slate-50"></div>
                        <button
                          onClick={() => handleDelete(listing.id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          Delete Listing
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500 italic">
                    {isLoading ? 'Loading listings...' : 'No listings found. Start by adding your first business!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
