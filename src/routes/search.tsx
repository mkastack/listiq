import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, MapPin, SlidersHorizontal, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { ListingCard, type ListingCardData } from "@/components/site/ListingCard";
import { fetchCategories, searchListings, type SearchFilters } from "@/lib/queries";

type SearchParams = {
  q?: string;
  city?: string;
  category?: string;
  verified?: boolean;
  sort?: SearchFilters["sort"];
};

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s.q === "string" ? s.q : undefined,
    city: typeof s.city === "string" ? s.city : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    verified: s.verified === true || s.verified === "true",
    sort: (s.sort as SearchFilters["sort"]) || "relevance",
  }),
  head: () => ({
    meta: [
      { title: "Search businesses — ListIQ" },
      {
        name: "description",
        content:
          "Find verified businesses across Ghana. Filter by category, city, rating, and more.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const params = Route.useSearch();
  const navigate = useNavigate();
  const [results, setResults] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [q, setQ] = useState(params.q ?? "");
  const [city, setCity] = useState(params.city ?? "");

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    searchListings({
      q: params.q,
      city: params.city,
      category: params.category,
      verifiedOnly: params.verified,
      sort: params.sort,
    })
      .then((d) => setResults(d as any))
      .finally(() => setLoading(false));
  }, [params.q, params.city, params.category, params.verified, params.sort]);

  const updateParam = (patch: Partial<SearchParams>) => {
    navigate({ to: "/search", search: { ...params, ...patch } });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam({ q: q || undefined, city: city || undefined });
  };

  return (
    <SiteShell>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <form
            onSubmit={submit}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-2 md:flex-row md:items-center"
          >
            <div className="flex flex-1 items-center gap-2 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full bg-transparent text-sm focus:outline-none"
              />
            </div>
            <div className="hidden h-8 w-px bg-border md:block" />
            <div className="flex flex-1 items-center gap-2 px-3 py-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City or region"
                className="w-full bg-transparent text-sm focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          <aside className="space-y-6">
            <FilterPanel title="Category" icon={<SlidersHorizontal className="h-3.5 w-3.5" />}>
              <button
                onClick={() => updateParam({ category: undefined })}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${!params.category ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-accent"}`}
              >
                All categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateParam({ category: c.slug })}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${params.category === c.slug ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-accent"}`}
                >
                  {c.name}{" "}
                  <span className="text-xs text-muted-foreground/70">({c.listing_count})</span>
                </button>
              ))}
            </FilterPanel>

            <FilterPanel title="Sort" icon={<SlidersHorizontal className="h-3.5 w-3.5" />}>
              {[
                { v: "relevance", l: "Relevance" },
                { v: "rating", l: "Top rated" },
                { v: "reviews", l: "Most reviewed" },
                { v: "newest", l: "Newest" },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => updateParam({ sort: o.v as any })}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${params.sort === o.v ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-accent"}`}
                >
                  {o.l}
                </button>
              ))}
            </FilterPanel>

            <FilterPanel title="Trust" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
              <label className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent">
                <span className="text-foreground">Verified only</span>
                <input
                  type="checkbox"
                  checked={!!params.verified}
                  onChange={(e) => updateParam({ verified: e.target.checked })}
                  className="h-4 w-4 rounded border-border accent-[oklch(0.55_0.22_263)]"
                />
              </label>
            </FilterPanel>
          </aside>

          <div>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Searching…"
                  : `${results.length} result${results.length === 1 ? "" : "s"}`}
                {params.q && (
                  <>
                    {" "}
                    for <span className="font-semibold text-foreground">"{params.q}"</span>
                  </>
                )}
              </p>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[5/4] animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-surface p-16 text-center">
                <p className="font-display text-xl font-semibold text-foreground">No matches yet</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Try a broader keyword, remove a filter, or browse all categories.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((l) => (
                  <ListingCard key={l.slug} l={l} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function FilterPanel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-2 px-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
