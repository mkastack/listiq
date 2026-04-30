import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { fetchArticleBySlug } from "@/lib/queries";

export const Route = createFileRoute("/articles/$slug")({
  head: () => ({ meta: [{ title: "Article — ListIQ" }] }),
  component: ArticleDetail,
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-32 text-center">
        <h1 className="font-display text-4xl font-extrabold">Article not found</h1>
        <Link to="/articles" className="mt-6 inline-flex rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background">All articles</Link>
      </div>
    </SiteShell>
  ),
});

function ArticleDetail() {
  const { slug } = Route.useParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticleBySlug(slug).then((a) => { setArticle(a); setLoading(false); });
  }, [slug]);

  if (loading) return <SiteShell><div className="mx-auto max-w-3xl animate-pulse px-4 py-20"><div className="h-72 rounded-3xl bg-muted" /></div></SiteShell>;
  if (!article) throw notFound();

  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{article.read_minutes} min read · {new Date(article.published_at).toLocaleDateString()}</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">{article.title}</h1>
        {article.excerpt && <p className="mt-4 text-lg text-muted-foreground">{article.excerpt}</p>}
        {article.cover_image_url && (
          <img src={article.cover_image_url} alt={article.title} className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover" />
        )}
        <div
          className="prose prose-slate mt-10 max-w-none text-foreground prose-headings:font-display prose-headings:font-bold prose-h2:mt-8 prose-h2:text-2xl prose-p:leading-relaxed prose-p:text-muted-foreground prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: article.body || "" }}
        />
      </article>
    </SiteShell>
  );
}