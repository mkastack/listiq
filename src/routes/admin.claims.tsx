import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/admin/claims")({
  component: AdminClaims,
});

function AdminClaims() {
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const fetchClaims = async () => {
    setIsLoading(true);
    const { data: claimsData, error } = await supabase
      .from('claim_requests')
      .select('*, listings(name, city, logo_url), profiles:claimant_id(full_name, email, avatar_url), reviewer:reviewed_by(full_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching claims:", error);
    }

    if (claimsData) setClaims(claimsData);

    // Fetch stats for the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      { count: pendingCount },
      { count: approvedCount },
      { count: rejectedCount }
    ] = await Promise.all([
      supabase.from('claim_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('claim_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved').gte('created_at', startOfMonth.toISOString()),
      supabase.from('claim_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected').gte('created_at', startOfMonth.toISOString()),
    ]);

    setStats({
      pending: pendingCount || 0,
      approved: approvedCount || 0,
      rejected: rejectedCount || 0
    });
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClaims();

    const channel = supabase
      .channel('admin-claims-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claim_requests' }, fetchClaims)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (claimId: string, listingId: string, claimantId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error: claimError } = await supabase
      .from('claim_requests')
      .update({
        status: 'approved',
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', claimId);

    if (claimError) {
      alert(claimError.message);
      return;
    }

    const { error: listingError } = await supabase
      .from('listings')
      .update({
        is_claimed: true,
        owner_id: claimantId,
        status: 'active'
      })
      .eq('id', listingId);

    if (listingError) alert(listingError.message);
  };

  const handleReject = async (claimId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const notes = window.prompt("Reason for rejection:");
    if (notes === null) return;

    const { error } = await supabase
      .from('claim_requests')
      .update({
        status: 'rejected',
        admin_notes: notes,
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', claimId);

    if (error) alert(error.message);
  };

  return (
    <main className="max-w-[1440px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <nav className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dashboard</span>
            <span className="material-symbols-outlined text-xs text-slate-300">chevron_right</span>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Listing Claims</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900">Verification Center</h1>
          <p className="text-sm text-slate-500 font-medium">Review and process business ownership claim requests</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchClaims} className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm uppercase tracking-widest">
            <span className={`material-symbols-outlined text-lg ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Pending Claims", value: stats.pending.toString(), trend: "Active Queue", color: "amber", icon: "pending_actions" },
          { label: "Approved (Month)", value: stats.approved.toString(), trend: "Verified Businesses", color: "emerald", icon: "check_circle" },
          { label: "Rejected (Month)", value: stats.rejected.toString(), trend: "Fraud Prevention", color: "rose", icon: "cancel" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
              <div className={`p-2 bg-${stat.color}-50 text-${stat.color}-600 rounded-lg border border-${stat.color}-100`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <span className={`text-[9px] font-black text-${stat.color}-600 bg-${stat.color}-50 px-2.5 py-1 rounded-full uppercase tracking-[0.1em] border border-${stat.color}-100`}>
                {stat.trend}
              </span>
            </div>
            <div className="mt-6">
              <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{isLoading ? '...' : stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Listing</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Claimant</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Submitted</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Proof</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Moderator</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 overflow-hidden flex-shrink-0 border border-blue-100 shadow-sm">
                        {claim.listings?.logo_url ? (
                          <img className="w-full h-full object-cover" src={claim.listings.logo_url} alt="Listing" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                            {claim.listings?.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="block font-bold text-slate-900 text-sm">{claim.listings?.name}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{claim.listings?.city || 'GLOBAL'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <span className="block font-bold text-slate-900 text-sm">{claim.profiles?.full_name}</span>
                      <span className="text-[11px] text-slate-500 font-medium">{claim.profiles?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs font-bold">{new Date(claim.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {claim.verification_document_url ? (
                      <a href={claim.verification_document_url} target="_blank" rel="noreferrer" className="text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:underline">
                        <span className="material-symbols-outlined text-lg">description</span>
                        Document
                      </a>
                    ) : (
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">No File</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                      claim.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      claim.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        claim.status === 'approved' ? 'bg-emerald-500' :
                        claim.status === 'pending' ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`}></span>
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {claim.reviewer ? (
                      <div className="flex items-center gap-2">
                        <img className="h-5 w-5 rounded-full border border-slate-200 shadow-sm" src={claim.reviewer.avatar_url} alt="Reviewer" />
                        <span className="text-[11px] text-slate-700 font-bold">{claim.reviewer.full_name.split(' ')[0]}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[10px] font-bold uppercase tracking-widest">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {claim.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApprove(claim.id, claim.listing_id, claim.claimant_id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Approve Ownership"
                          >
                            <span className="material-symbols-outlined text-xl">check_circle</span>
                          </button>
                          <button 
                            onClick={() => handleReject(claim.id)}
                            className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"
                            title="Reject Claim"
                          >
                            <span className="material-symbols-outlined text-xl">cancel</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {claims.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-400 italic font-medium">No claim requests found in the database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
