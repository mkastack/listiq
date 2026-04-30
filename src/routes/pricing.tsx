import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { useState } from "react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — ListIQ" },
      { name: "description", content: "Simple, transparent plans for every business size. Start free, upgrade when you grow." },
    ],
  }),
  component: PricingPage,
});

const PLANS = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    badge: null,
    features: ["1 listing", "3 photos", "Basic profile", "Community support"],
    cta: "Start free",
  },
  {
    name: "Starter",
    monthly: 79,
    annual: 790,
    badge: null,
    features: ["3 listings", "10 photos per listing", "Customer messaging", "Email support"],
    cta: "Choose Starter",
  },
  {
    name: "Pro",
    monthly: 199,
    annual: 1990,
    badge: "Most popular",
    features: ["10 listings", "Unlimited photos", "Featured placement", "Analytics dashboard", "AI description generator"],
    cta: "Go Pro",
  },
  {
    name: "Enterprise",
    monthly: 499,
    annual: 4990,
    badge: null,
    features: ["Unlimited listings", "Priority placement", "Dedicated success manager", "Custom integrations", "Verified shield"],
    cta: "Talk to us",
  },
];

function PricingPage() {
  const [annual, setAnnual] = useState(false);
  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Pricing</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight md:text-5xl">Plans that grow with you</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Start free. Upgrade for visibility, analytics, and AI-powered tools when you're ready.</p>

          <div className="mt-8 inline-flex rounded-full border border-border bg-surface p-1 text-sm">
            <button onClick={() => setAnnual(false)} className={`rounded-full px-4 py-1.5 font-medium ${!annual ? "bg-foreground text-background" : "text-muted-foreground"}`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={`rounded-full px-4 py-1.5 font-medium ${annual ? "bg-foreground text-background" : "text-muted-foreground"}`}>Annual <span className="ml-1 text-xs text-success">-17%</span></button>
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => {
            const price = annual ? p.annual : p.monthly;
            const isHighlight = p.badge === "Most popular";
            return (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-3xl border p-7 ${isHighlight ? "border-transparent bg-brand text-brand-foreground" : "border-border bg-card text-foreground"}`}
                style={isHighlight ? { boxShadow: "var(--shadow-elevated)" } : { boxShadow: "var(--shadow-card)" }}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    <Sparkles className="h-3 w-3" /> {p.badge}
                  </span>
                )}
                <h3 className="font-display text-lg font-bold">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold">GHS {price}</span>
                  <span className={isHighlight ? "text-brand-foreground/60" : "text-muted-foreground"}>/{annual ? "yr" : "mo"}</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className={`mt-0.5 h-4 w-4 ${isHighlight ? "text-primary-glow" : "text-primary"}`} />
                      <span className={isHighlight ? "text-brand-foreground/85" : "text-muted-foreground"}>{f}</span>
                    </li>
                  ))}
                </ul>
                {p.name === "Free" ? (
                  <Link
                    to="/auth"
                    search={{ mode: "signup" }}
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold ${isHighlight ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border bg-background text-foreground hover:bg-accent"}`}
                  >
                    {p.cta}
                  </Link>
                ) : (
                  <a
                    href="https://paystack.shop/pay/norkkn1x5n"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold ${isHighlight ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border bg-background text-foreground hover:bg-accent"}`}
                  >
                    {p.cta}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </SiteShell>
  );
}