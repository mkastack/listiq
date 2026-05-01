import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — ListIQ" },
      {
        name: "description",
        content: "ListIQ is the modern business directory built for Ghana and West Africa.",
      },
    ],
  }),
  component: () => (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-4 py-20 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">About</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          Built for the businesses that move Ghana forward.
        </h1>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
          <p>
            ListIQ is a modern business directory built from the ground up for Ghana and West
            Africa. From restaurants and hotels to lawyers and tech, we help customers find — and
            trust — the businesses that matter.
          </p>
          <p>
            For business owners, ListIQ is the easiest way to be discovered, build credibility
            through reviews, and grow. We're building tools — verified badges, analytics, AI-powered
            descriptions, claim flows — that put owners in control.
          </p>
          <p>Find it. List it. Own it.</p>
        </div>
      </section>
    </SiteShell>
  ),
});
