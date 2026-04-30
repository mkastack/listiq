import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { fetchPublishedArticles } from "@/lib/queries";

export const Route = createFileRoute("/articles")({
  head: () => ({
    meta: [
      { title: "Articles — ListIQ" },
      { name: "description", content: "Stories, guides and insights about doing business in Ghana." },
    ],
  }),
  component: ArticlesPage,
});

function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  useEffect(() => { fetchPublishedArticles().then(setArticles); }, []);

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Articles</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight md:text-5xl">Stories from the directory</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">Guides, news and ideas for living, working and building in Ghana.</p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              to="/articles/$slug"
              params={{ slug: a.slug }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="aspect-[16/10] bg-gradient-to-br from-primary/15 via-accent to-primary/5">
                {a.cover_image_url && <img src={a.cover_image_url} alt={a.title} className="h-full w-full object-cover" loading="lazy" />}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">{a.read_minutes} min read</p>
                <h3 className="font-display text-lg font-semibold leading-tight group-hover:text-primary">{a.title}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  {(a.tags ?? []).slice(0, 3).map((t: string) => (
                    <span key={t} className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-foreground">{t}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}