import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/dashboard/saved")({
  component: SavedListings,
});

function SavedListings() {
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSavedListings = async () => {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase
      .from("saved_listings")
      .select(
        `
        id,
        listing:listings (*)
      `,
      )
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error fetching saved listings:", error);
    } else {
      setSavedItems(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSavedListings();

    // Set up realtime subscription
    const subscription = supabase
      .channel("saved_listings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "saved_listings",
        },
        () => {
          fetchSavedListings();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("saved_listings").delete().eq("id", id);

    if (error) {
      console.error("Error removing saved listing:", error);
    } else {
      setSavedItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto pb-24 overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 mb-1">Saved Listings</h1>
          <p className="text-sm text-slate-500 font-body-base">
            Businesses you've bookmarked for later
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 mr-2">
            <span className="material-symbols-outlined text-lg">sort</span>
            <span className="text-xs font-bold">Sort by:</span>
            <select className="bg-transparent border-none text-xs font-bold text-slate-900 focus:ring-0 cursor-pointer">
              <option>Recently Saved</option>
              <option>A-Z</option>
              <option>Rating</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl h-[400px] animate-pulse border border-slate-100"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {savedItems.map((item) => {
            const l = item.listing;
            if (!l) return null;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Thumbnail Area */}
                <div className="h-44 w-full relative overflow-hidden">
                  <img
                    alt={l.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    src={
                      l.cover_image_url ||
                      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {/* Overlapping Logo */}
                  <div className="absolute bottom-0 left-6 translate-y-1/2">
                    <div className="w-12 h-12 rounded-full border-4 border-white shadow-md bg-white overflow-hidden">
                      <img
                        alt={`${l.name} logo`}
                        className="w-full h-full object-cover"
                        src={
                          l.logo_url ||
                          "https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=2073&auto=format&fit=crop"
                        }
                      />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
                    <span
                      className="material-symbols-outlined text-blue-600 text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      bookmark
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="pt-10 px-6 pb-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {l.name}
                    </h3>
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 border border-blue-100">
                      {l.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span
                        className="material-symbols-outlined text-amber-400 text-[16px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="font-bold text-sm text-slate-900">{l.rating_avg}</span>
                    </div>
                    <span className="text-slate-400 text-xs">({l.rating_count} reviews)</span>
                    <span className="mx-1 w-1 h-1 bg-slate-200 rounded-full"></span>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-slate-400 text-[16px]">
                        location_on
                      </span>
                      <span className="text-slate-500 text-xs font-medium">{l.city}</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-6">
                    {l.short_description || l.description}
                  </p>

                  {/* Actions Footer */}
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 gap-2">
                    <Link
                      to={`/listings/${l.slug}`}
                      className="text-blue-600 font-bold text-xs flex items-center gap-1.5 hover:translate-x-1 transition-transform py-2"
                    >
                      View Listing
                      <span className="material-symbols-outlined text-[14px]">north_east</span>
                    </Link>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-slate-400 hover:text-red-500 transition-all flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-50 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">bookmark_remove</span>
                      <span className="hidden xs:inline">Remove</span>
                      <span className="xs:hidden">Del</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && savedItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <span className="material-symbols-outlined text-slate-300 text-[48px]">
              bookmark_border
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Your bookmarks are empty</h2>
          <p className="text-slate-500 max-w-sm mb-8 font-medium">
            Explore our directory and save your favorite businesses to find them quickly later.
          </p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            Discover Businesses
          </Link>
        </div>
      )}
    </div>
  );
}
