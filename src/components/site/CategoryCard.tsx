import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";

export function CategoryCard({
  slug,
  name,
  icon,
  count,
}: {
  slug: string;
  name: string;
  icon: string | null;
  count: number;
}) {
  const Icon = (icon && (Icons as any)[icon]) || Icons.Tag;
  return (
    <Link
      to="/search"
      search={{ category: slug }}
      className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-display text-sm font-semibold text-foreground">{name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {count} {count === 1 ? "listing" : "listings"}
        </p>
      </div>
    </Link>
  );
}
