import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Search, MapPin, Star, ShieldCheck, Users, Sparkles } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { SearchHero } from "@/components/site/SearchHero";
import { ListingCard, type ListingCardData } from "@/components/site/ListingCard";
import { CategoryCard } from "@/components/site/CategoryCard";
import { supabase } from "@/lib/supabase";
import {
  fetchCategories,
  fetchFeaturedListings,
  fetchPlatformStats,
  fetchPublishedArticles,
  fetchRecentListings,
} from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ListIQ — Find It. List It. Own It." },
      {
        name: "description",
        content:
          "Discover trusted businesses across Ghana and West Africa. Restaurants, hotels, lawyers, tech, and more — all on ListIQ.",
      },
      { property: "og:title", content: "ListIQ — Find It. List It. Own It." },
      {
        property: "og:description",
        content: "Discover trusted businesses across Ghana and West Africa.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [featured, setFeatured] = useState<ListingCardData[]>([]);
  const [recent, setRecent] = useState<ListingCardData[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [stats, setStats] = useState({ listings: 0, cities: 0, verified: 0, users: 0 });
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    Promise.all([
      fetchFeaturedListings(6),
      fetchRecentListings(8),
      fetchCategories(),
      fetchPublishedArticles(3),
      fetchPlatformStats(),
    ])
      .then(([f, r, c, a, s]) => {
        setFeatured(f as any);
        setRecent(r as any);
        setCategories(c);
        setArticles(a);
        setStats(s);
      })
      .catch(console.error);
  }, []);

  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative overflow-hidden bg-brand text-brand-foreground">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--gradient-radial-glow)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 md:px-6 md:pb-32 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-brand-foreground/80 backdrop-blur">
              <Sparkles className="h-3 w-3" /> Built for Ghana & West Africa
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Find every business that
              <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-primary-glow to-primary bg-clip-text text-transparent">
                {" "}
                matters near you.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-brand-foreground/70 md:text-lg">
              ListIQ is the modern directory for restaurants, hotels, lawyers, tech, beauty and more
              — verified, reviewed and ready to connect.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl">
            <SearchHero />
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Listings" value={stats.listings} icon={MapPin} />
            <Stat label="Cities covered" value={stats.cities} icon={MapPin} />
            <Stat label="Verified" value={stats.verified} icon={ShieldCheck} />
            <Stat label="Happy users" value={stats.users} icon={Users} />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <SectionHead
          eyebrow="Categories"
          title="Browse by what you need"
          subtitle="From food and lodging to legal counsel and tech — everything is one tap away."
          link={{ to: "/categories", label: "All categories" }}
        />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {categories.slice(0, 14).map((c) => (
            <CategoryCard
              key={c.id}
              slug={c.slug}
              name={c.name}
              icon={c.icon}
              count={c.listing_count}
            />
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <SectionHead
            eyebrow="Featured"
            title="Handpicked businesses worth knowing"
            subtitle="Verified favourites trusted by thousands across Ghana."
            link={{ to: "/search", label: "Explore all" }}
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((l) => (
              <ListingCard key={l.slug} l={l} />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <SectionHead eyebrow="How it works" title="Three steps. Zero friction." />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              n: "01",
              icon: Search,
              title: "Search",
              body: "Type a keyword or category. Filter by city, rating, or what's open.",
            },
            {
              n: "02",
              icon: Star,
              title: "Find",
              body: "Compare verified businesses with real reviews and photos.",
            },
            {
              n: "03",
              icon: ArrowRight,
              title: "Connect",
              body: "Call, message on WhatsApp, or visit the website in one tap.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="relative overflow-hidden rounded-3xl border border-border bg-card p-8"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <span className="font-display text-5xl font-extrabold text-muted-foreground/20">
                {s.n}
              </span>
              <s.icon className="mt-4 h-6 w-6 text-primary" />
              <h3 className="mt-3 font-display text-xl font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <SectionHead
            eyebrow="Just listed"
            title="Fresh on ListIQ"
            link={{ to: "/search", label: "See all" }}
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((l) => (
              <ListingCard key={l.slug} l={l} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div
          className="relative overflow-hidden rounded-3xl bg-brand p-10 text-brand-foreground md:p-16"
          style={{ boxShadow: "var(--shadow-elevated)" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "var(--gradient-radial-glow)" }}
          />
          <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-display text-3xl font-extrabold leading-tight md:text-4xl">
                {session ? "Ready to grow your reach?" : "Own a business? \n List it free today."}
              </h2>
              <p className="mt-4 max-w-md text-brand-foreground/70">
                {session
                  ? "You're logged in! Go to your dashboard to manage your listings and track your growth."
                  : "Get found by thousands of customers searching every day. Free forever to start. Upgrade for premium placement."}
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              {session ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-display text-sm font-semibold text-primary-foreground"
                  style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                >
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-display text-sm font-semibold text-primary-foreground"
                  style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                >
                  Create your free listing <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <Link
                to="/pricing"
                className="text-sm text-brand-foreground/70 hover:text-brand-foreground"
              >
                Or compare paid plans →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ARTICLES */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
        <SectionHead
          eyebrow="From the blog"
          title="Stories, guides and insights"
          link={{ to: "/articles", label: "All articles" }}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              to="/articles/$slug"
              params={{ slug: a.slug }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="aspect-[16/10] bg-gradient-to-br from-primary/15 via-accent to-primary/5">
                {a.cover_image_url && (
                  <img
                    src={a.cover_image_url}
                    alt={a.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                  {a.read_minutes} min read
                </p>
                <h3 className="font-display text-lg font-semibold leading-tight text-foreground group-hover:text-primary">
                  {a.title}
                </h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <Icon className="h-4 w-4 text-primary-glow" />
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-foreground/50">
        {label}
      </span>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  subtitle,
  link,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  link?: { to: string; label: string };
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
      <div className="max-w-2xl">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</span>
        <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground md:text-4xl">
          {title}
        </h2>
        {subtitle && <p className="mt-4 text-base text-muted-foreground">{subtitle}</p>}
      </div>
      {link && (
        <Link
          to={link.to}
          className="flex items-center gap-2 text-sm font-bold text-foreground transition-colors hover:text-primary"
        >
          {link.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
