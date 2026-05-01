import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Phone,
  Globe,
  MessageCircle,
  MapPin,
  BadgeCheck,
  Mail,
  Clock,
  Share2,
  Bookmark,
  Flag,
} from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { ListingCard, type ListingCardData } from "@/components/site/ListingCard";
import { StarRating } from "@/components/site/StarRating";
import {
  fetchListingBySlug,
  fetchReviews,
  fetchSimilarListings,
  addReview,
  type ListingRow,
} from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { Star } from "lucide-react";

export const Route = createFileRoute("/listings/$slug")({
  head: () => ({
    meta: [{ title: "Listing — ListIQ" }],
  }),
  component: ListingDetailPage,
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-32 text-center">
        <h1 className="font-display text-4xl font-extrabold">Listing not found</h1>
        <p className="mt-3 text-muted-foreground">
          This listing may have been removed or never existed.
        </p>
        <Link
          to="/search"
          className="mt-6 inline-flex rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
        >
          Browse all listings
        </Link>
      </div>
    </SiteShell>
  ),
});

const TABS = ["Overview", "Reviews", "Similar"] as const;
type Tab = (typeof TABS)[number];

function ListingDetailPage() {
  const { slug } = Route.useParams();
  const [listing, setListing] = useState<ListingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [similar, setSimilar] = useState<ListingCardData[]>([]);
  const [tab, setTab] = useState<Tab>("Overview");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: "", body: "" });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    let channel: any;

    const loadData = async () => {
      setLoading(true);
      try {
        const l = await fetchListingBySlug(slug);
        setListing(l);

        if (l) {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          const [r, s, { data: savedData }] = await Promise.all([
            fetchReviews(l.id),
            fetchSimilarListings(l.category, slug, 6),
            session?.user
              ? supabase
                  .from("saved_listings")
                  .select("*")
                  .eq("user_id", session.user.id)
                  .eq("listing_id", l.id)
                  .maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          setReviews(r);
          setSimilar(s as any);
          setIsSaved(!!savedData);

          // REAL-TIME REVIEWS
          channel = supabase
            .channel(`listing-reviews-${l.id}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "reviews",
                filter: `listing_id=eq.${l.id}`,
              },
              async () => {
                const updatedReviews = await fetchReviews(l.id);
                setReviews(updatedReviews);
                const updatedListing = await fetchListingBySlug(slug);
                if (updatedListing) setListing(updatedListing);
              },
            )
            .subscribe();
        }
      } catch (error) {
        console.error("Error loading listing details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [slug]);

  const handleSave = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      alert("Please log in to save listings.");
      return;
    }
    if (!listing) return;

    if (isSaved) {
      await supabase
        .from("saved_listings")
        .delete()
        .eq("user_id", session.user.id)
        .eq("listing_id", listing.id);
      setIsSaved(false);
    } else {
      await supabase
        .from("saved_listings")
        .insert({ user_id: session.user.id, listing_id: listing.id });
      setIsSaved(true);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: listing?.name,
      text: listing?.short_description || `Check out ${listing?.name} on ListIQ!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      alert("Please log in to leave a review.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addReview(
        listing.id,
        session.user.id,
        newReview.rating,
        newReview.title,
        newReview.body,
      );
      setShowReviewModal(false);
      setNewReview({ rating: 5, title: "", body: "" });
    } catch (error: any) {
      alert(error.message);
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-12">
          <div className="h-72 rounded-3xl bg-muted" />
          <div className="mt-8 h-8 w-1/3 rounded bg-muted" />
          <div className="mt-3 h-4 w-1/2 rounded bg-muted" />
        </div>
      </SiteShell>
    );
  }

  if (!listing) throw notFound();

  return (
    <>
      <SiteShell>
        {/* Cover */}
        <div className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-primary/20 via-accent to-primary/5 md:h-80">
          {listing.cover_image_url || listing.logo_url ? (
            <img
              src={listing.cover_image_url || listing.logo_url || ""}
              alt={listing.name}
              className="h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>

        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="-mt-12 md:-mt-16 grid gap-8 lg:grid-cols-[1fr_340px] relative z-10">
            {/* Main */}
            <div>
              <div
                className="rounded-3xl border border-border bg-card p-6 md:pt-10 md:px-8 md:pb-8"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {listing.category.replace(/-/g, " ")}
                </p>
                <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                  {listing.name}
                  {listing.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  )}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <StarRating value={listing.rating_avg} count={listing.rating_count} size="md" />
                  {listing.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {listing.city}, {listing.region}
                    </span>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {listing.phone && (
                    <ActionButton href={`tel:${listing.phone}`} icon={Phone}>
                      Call
                    </ActionButton>
                  )}
                  {listing.whatsapp && (
                    <ActionButton
                      href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, "")}`}
                      icon={MessageCircle}
                    >
                      WhatsApp
                    </ActionButton>
                  )}
                  {listing.website && (
                    <ActionButton href={listing.website} icon={Globe}>
                      Website
                    </ActionButton>
                  )}
                  <button
                    onClick={handleSave}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all active:scale-95 ${isSaved ? "bg-primary/10 border-primary text-primary" : "border-border bg-background text-foreground hover:bg-accent"}`}
                  >
                    <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />{" "}
                    {isSaved ? "Saved" : "Save"}
                  </button>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-all active:scale-95"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-8 border-b border-border">
                <div className="flex gap-1">
                  {TABS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`rounded-t-lg px-4 py-3 text-sm font-semibold transition-colors ${tab === t ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {t}{" "}
                      {t === "Reviews" && reviews.length > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({reviews.length})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                {tab === "Overview" && (
                  <div className="space-y-8">
                    {listing.description && (
                      <div>
                        <h2 className="font-display text-lg font-semibold text-foreground">
                          About
                        </h2>
                        <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                          {listing.description}
                        </p>
                      </div>
                    )}
                    {listing.keywords && listing.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {listing.keywords.map((k) => (
                          <span
                            key={k}
                            className="rounded-full bg-accent px-3 py-1 text-xs text-foreground"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {listing.address && (
                        <InfoRow
                          icon={MapPin}
                          label="Address"
                          value={`${listing.address}, ${listing.city || ""}`}
                        />
                      )}
                      {listing.phone && (
                        <InfoRow icon={Phone} label="Phone" value={listing.phone} />
                      )}
                      {listing.email && <InfoRow icon={Mail} label="Email" value={listing.email} />}
                      {listing.website && (
                        <InfoRow icon={Globe} label="Website" value={listing.website} />
                      )}
                    </div>
                  </div>
                )}

                {tab === "Reviews" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/30 p-6 rounded-2xl border border-border">
                      <div>
                        <h3 className="text-xl font-bold text-foreground">Customer Reviews</h3>
                        <p className="text-sm text-muted-foreground">
                          See what others are saying about this business.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                      >
                        <Star className="h-4 w-4 fill-current" /> Write a Review
                      </button>
                    </div>

                    {reviews.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
                        <p className="font-display text-lg font-semibold text-foreground">
                          No reviews yet
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Be the first to share your experience.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map((r) => (
                          <div
                            key={r.id}
                            className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/20 transition-all"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <StarRating value={r.rating} showCount={false} size="md" />
                                <span className="text-xs font-bold text-muted-foreground">•</span>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                  {new Date(r.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {r.title && (
                              <h4 className="font-bold text-foreground text-lg mb-1">{r.title}</h4>
                            )}
                            {r.body && (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {r.body}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === "Similar" && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {similar.map((l) => (
                      <ListingCard key={l.slug} l={l} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div
                className="rounded-2xl border border-border bg-card p-6"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <h3 className="font-display text-base font-semibold text-foreground">
                  Quick contact
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  {listing.phone && (
                    <SidebarRow icon={Phone} label={listing.phone} href={`tel:${listing.phone}`} />
                  )}
                  {listing.email && (
                    <SidebarRow
                      icon={Mail}
                      label={listing.email}
                      href={`mailto:${listing.email}`}
                    />
                  )}
                  {listing.website && (
                    <SidebarRow
                      icon={Globe}
                      label={listing.website.replace(/^https?:\/\//, "")}
                      href={listing.website}
                    />
                  )}
                  {listing.address && (
                    <SidebarRow icon={MapPin} label={`${listing.address}, ${listing.city || ""}`} />
                  )}
                </div>
              </div>
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground hover:text-foreground">
                <Flag className="h-4 w-4" /> Report this listing
              </button>
            </aside>
          </div>
        </div>
      </SiteShell>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Write a Review</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Share your experience with {listing?.name}
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-400"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-8 space-y-6">
              <div className="flex flex-col items-center gap-4 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Rate your experience
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: s })}
                      className="transition-all hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`h-8 w-8 ${s <= newReview.rating ? "fill-warning text-warning" : "text-slate-300"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Headline
                </label>
                <input
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm font-medium transition-all"
                  placeholder="e.g. Excellent service, highly recommended!"
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Your Feedback
                </label>
                <textarea
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm font-medium transition-all min-h-[120px] resize-none"
                  placeholder="What did you like or dislike? How was the service?"
                  value={newReview.body}
                  onChange={(e) => setNewReview({ ...newReview, body: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] bg-primary text-primary-foreground font-bold py-4 rounded-2xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      Posting...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">send</span>
                      Post Review
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ActionButton({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground"
      style={{ background: "var(--gradient-primary)" }}
    >
      <Icon className="h-4 w-4" /> {children}
    </a>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

function SidebarRow({ icon: Icon, label, href }: { icon: any; label: string; href?: string }) {
  const inner = (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <span className="break-all text-foreground">{label}</span>
    </div>
  );
  return href ? (
    <a href={href} className="block hover:text-primary">
      {inner}
    </a>
  ) : (
    inner
  );
}
