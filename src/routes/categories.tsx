import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { CategoryCard } from "@/components/site/CategoryCard";
import { fetchCategories } from "@/lib/queries";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All categories — ListIQ" },
      {
        name: "description",
        content:
          "Browse every business category on ListIQ — from restaurants and hotels to lawyers, tech, and beauty.",
      },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const [cats, setCats] = useState<any[]>([]);
  useEffect(() => {
    fetchCategories().then(setCats);
  }, []);
  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Categories</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
          Find your kind of business
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Pick a category to explore verified listings across Ghana and West Africa.
        </p>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {cats.map((c) => (
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
    </SiteShell>
  );
}
