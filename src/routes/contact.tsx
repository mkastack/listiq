import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — ListIQ" },
      { name: "description", content: "Get in touch with the ListIQ team." },
    ],
  }),
  component: () => (
    <SiteShell>
      <section className="mx-auto max-w-4xl px-4 py-20 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Contact</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          Let's talk.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Questions, partnerships, or feedback — we'd love to hear from you.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            { icon: Mail, label: "Email", value: "hello@listiq.gh" },
            { icon: Phone, label: "Phone", value: "+233 (0) 30 000 0000" },
            { icon: MapPin, label: "Office", value: "Accra, Ghana" },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-border bg-card p-6"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <c.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-1 font-semibold text-foreground">{c.value}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  ),
});
