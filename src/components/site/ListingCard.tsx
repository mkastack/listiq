import { Link } from "@tanstack/react-router";
import { MapPin, BadgeCheck, Sparkles } from "lucide-react";
import { StarRating } from "./StarRating";

export type ListingCardData = {
  slug: string;
  name: string;
  short_description: string | null;
  category: string;
  city: string | null;
  region: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  is_verified: boolean;
  is_featured: boolean;
  rating_avg: number;
  rating_count: number;
};

export function ListingCard({ l }: { l: ListingCardData }) {
  return (
    <Link
      to="/listings/$slug"
      params={{ slug: l.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/30"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {l.cover_image_url || l.logo_url ? (
          <img
            src={l.cover_image_url || l.logo_url || ""}
            alt={l.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-accent to-primary/5">
            <span className="font-display text-3xl font-bold text-primary/40">{l.name.slice(0, 1)}</span>
          </div>
        )}
        {l.is_featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-foreground/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-background backdrop-blur-md">
            <Sparkles className="h-3 w-3" /> Featured
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-1.5 font-display text-base font-semibold leading-tight text-foreground">
              {l.name}
              {l.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
            </h3>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{l.category.replace(/-/g, " ")}</p>
          </div>
        </div>
        {l.short_description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{l.short_description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <StarRating value={l.rating_avg} count={l.rating_count} />
          {l.city && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {l.city}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}