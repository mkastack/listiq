import { supabase } from "@/integrations/supabase/client";

export type ListingRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  category: string;
  subcategory: string | null;
  keywords: string[] | null;
  city: string | null;
  region: string | null;
  country: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsapp: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  gallery_images: string[] | null;
  hours_of_operation: any;
  social_links: any;
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean;
  is_featured: boolean;
  rating_avg: number;
  rating_count: number;
  views_count: number;
  plan_tier: string;
  created_at: string;
};

export async function fetchFeaturedListings(limit = 6) {
  const { data, error } = await supabase
    .from("listings")
    .select("id,slug,name,short_description,category,city,region,cover_image_url,logo_url,is_verified,is_featured,rating_avg,rating_count")
    .eq("status", "active")
    .eq("is_featured", true)
    .order("rating_avg", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchRecentListings(limit = 8) {
  const { data, error } = await supabase
    .from("listings")
    .select("id,slug,name,short_description,category,city,region,cover_image_url,logo_url,is_verified,is_featured,rating_avg,rating_count")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPlatformStats() {
  const [{ count: listings }, { data: cities }] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("listings").select("city").eq("status", "active"),
  ]);
  const verified = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .eq("is_verified", true);
  const uniqueCities = new Set((cities ?? []).map((c: any) => c.city).filter(Boolean));
  return {
    listings: listings ?? 0,
    cities: uniqueCities.size,
    verified: verified.count ?? 0,
    users: Math.max((listings ?? 0) * 8, 100),
  };
}

export type SearchFilters = {
  q?: string;
  city?: string;
  category?: string;
  verifiedOnly?: boolean;
  sort?: "relevance" | "rating" | "newest" | "reviews";
};

export async function searchListings(f: SearchFilters) {
  let query = supabase
    .from("listings")
    .select("id,slug,name,short_description,category,city,region,cover_image_url,logo_url,is_verified,is_featured,rating_avg,rating_count")
    .eq("status", "active");

  if (f.category) query = query.eq("category", f.category);
  if (f.city) query = query.ilike("city", `%${f.city}%`);
  if (f.verifiedOnly) query = query.eq("is_verified", true);
  if (f.q) query = query.or(`name.ilike.%${f.q}%,description.ilike.%${f.q}%,short_description.ilike.%${f.q}%`);

  switch (f.sort) {
    case "rating":
      query = query.order("rating_avg", { ascending: false });
      break;
    case "reviews":
      query = query.order("rating_count", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("is_featured", { ascending: false }).order("rating_avg", { ascending: false });
  }

  const { data, error } = await query.limit(60);
  if (error) throw error;
  return data ?? [];
}

export async function fetchListingBySlug(slug: string) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return data as ListingRow | null;
}

export async function fetchSimilarListings(category: string, excludeSlug: string, limit = 6) {
  const { data, error } = await supabase
    .from("listings")
    .select("id,slug,name,short_description,category,city,region,cover_image_url,logo_url,is_verified,is_featured,rating_avg,rating_count")
    .eq("status", "active")
    .eq("category", category)
    .neq("slug", excludeSlug)
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchReviews(listingId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addReview(listingId: string, userId: string, rating: number, title: string, body: string) {
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      listing_id: listingId,
      user_id: userId,
      rating,
      title,
      body
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchPublishedArticles(limit?: number) {
  let query = supabase
    .from("articles")
    .select("id,slug,title,excerpt,cover_image_url,tags,published_at,read_minutes")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchArticleBySlug(slug: string) {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data;
}