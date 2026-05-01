import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/dashboard/reviews")({
  component: MyReviews,
});

function MyReviews() {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    avgRating: 0,
    total: 0,
    responseRate: 0,
  });

  const fetchReviews = async () => {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Fetch user's listings first to get their IDs
    const { data: userListings } = await supabase
      .from("listings")
      .select("id")
      .eq("owner_id", session.user.id);

    if (!userListings || userListings.length === 0) {
      setIsLoading(false);
      return;
    }

    const listingIds = userListings.map((l) => l.id);

    // Fetch reviews for those listings
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("*, listings(title), profiles(full_name, avatar_url)")
      .in("listing_id", listingIds)
      .order("created_at", { ascending: false });

    if (reviewsData) {
      setReviews(reviewsData);

      // Calculate stats
      const total = reviewsData.length;
      const avg = reviewsData.reduce((acc, r) => acc + r.rating, 0) / total || 0;
      const replied = reviewsData.filter((r) => r.owner_response).length;
      const rate = (replied / total) * 100 || 0;

      setStats({
        avgRating: Number(avg.toFixed(1)),
        total,
        responseRate: Math.round(rate),
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSendReply = async (id: string) => {
    if (!replyText.trim()) return;

    const { error } = await supabase
      .from("reviews")
      .update({
        owner_response: replyText,
        responded_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (!error) {
      setReviews(
        reviews.map((r) =>
          r.id === id
            ? {
                ...r,
                owner_response: replyText,
                responded_at: new Date().toISOString(),
              }
            : r,
        ),
      );
      setReplyingTo(null);
      setReplyText("");
    }
  };

  const statCards = [
    {
      label: "Average Rating",
      value: stats.avgRating.toString(),
      icon: "star",
      color: "text-amber-400",
      bg: "bg-blue-50",
    },
    {
      label: "Total Reviews",
      value: stats.total.toString(),
      trend: "+0 this week",
      icon: "reviews",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Response Rate",
      value: `${stats.responseRate}%`,
      icon: "bolt",
      color: "text-purple-600",
      bg: "bg-purple-50",
      progress: stats.responseRate,
    },
  ];

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto pb-24 space-y-8 overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 mb-1">My Reviews</h1>
          <p className="text-sm text-slate-500 font-body-base">
            Manage and respond to feedback across all your listings
          </p>
        </div>
        <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 w-fit">
          <span className="material-symbols-outlined text-[20px]">file_download</span>
          Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((s, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[170px] group cursor-pointer hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {s.label}
              </p>
              <div
                className={`w-12 h-12 rounded-full ${s.bg} flex items-center justify-center ${s.color} shrink-0 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm`}
              >
                <span
                  className="material-symbols-outlined text-[28px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {s.icon}
                </span>
              </div>
            </div>
            <div className="flex items-baseline gap-3 mt-auto mb-4">
              <span className="text-3xl font-bold text-slate-900">
                {isLoading ? "..." : s.value}
              </span>
              {s.trend && (
                <span className="text-emerald-600 text-xs font-bold shrink-0">{s.trend}</span>
              )}
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`${s.color.replace("text", "bg")} h-full rounded-full transition-all duration-1000`}
                style={{ width: s.progress ? `${s.progress}%` : "0%" }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all"
            >
              <div className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg border-2 border-slate-50 overflow-hidden">
                      {review.profiles?.avatar_url ? (
                        <img
                          src={review.profiles.avatar_url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        review.profiles?.full_name?.charAt(0) || "U"
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {review.profiles?.full_name || "Anonymous"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className="material-symbols-outlined text-[16px]"
                              style={{
                                fontVariationSettings: `'FILL' ${i < review.rating ? 1 : 0}`,
                              }}
                            >
                              star
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          • {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      On:
                    </span>
                    <span className="px-3 py-1 bg-slate-50 rounded-lg text-xs font-bold text-slate-700 border border-slate-100">
                      {review.listings?.title}
                    </span>
                  </div>
                </div>

                <p className="text-slate-600 leading-relaxed font-body-base mb-6 italic">
                  "{review.comment}"
                </p>

                {review.owner_response ? (
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative mt-4">
                    <div className="absolute -top-3 left-8 px-2 bg-slate-50 text-[10px] font-bold text-blue-600 uppercase tracking-widest border-x border-slate-100">
                      Your Response
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed mb-2 font-medium">
                      {review.owner_response}
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      Replied on{" "}
                      {new Date(review.responded_at || review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 mt-6">
                    {replyingTo === review.id ? (
                      <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <textarea
                          autoFocus
                          className="w-full bg-slate-50 border border-blue-100 rounded-2xl p-4 text-sm text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none resize-none h-32"
                          placeholder="Write your professional response here..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText("");
                            }}
                            className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSendReply(review.id)}
                            className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">send</span>
                            Post Response
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(review.id)}
                        className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:gap-3 transition-all group w-fit"
                      >
                        <span className="material-symbols-outlined text-[20px]">reply</span>
                        Reply to this review
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <span className="material-symbols-outlined text-[40px]">rate_review</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No reviews found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              {isLoading
                ? "Fetching your latest reviews..."
                : "You haven't received any reviews yet. Share your listings to start gathering feedback!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
