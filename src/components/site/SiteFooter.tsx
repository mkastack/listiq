import { Link } from "@tanstack/react-router";
import { MapPin, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-brand text-brand-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "var(--gradient-primary)" }}>
                <MapPin className="h-4 w-4" />
              </span>
              <span className="font-display text-lg font-extrabold">ListIQ</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-brand-foreground/70">
              Find it. List it. Own it. The smarter way to discover the businesses that move Ghana forward.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-brand-foreground/80 transition-colors hover:bg-white/10 hover:text-brand-foreground">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Discover" links={[
            { to: "/search", label: "Browse listings" },
            { to: "/categories", label: "Categories" },
            { to: "/articles", label: "Articles" },
          ]} />
          <FooterCol title="For business" links={[
            { to: "/pricing", label: "Pricing" },
            { to: "/auth", label: "List your business" },
            { to: "/about", label: "How it works" },
          ]} />
          <FooterCol title="Company" links={[
            { to: "/about", label: "About" },
            { to: "/contact", label: "Contact" },
            { to: "/admin", label: "Admin Dashboard" },
            { to: "/terms", label: "Terms" },
            { to: "/privacy", label: "Privacy" },
          ]} />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-brand-foreground/60 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} ListIQ. All rights reserved.</p>
          <p>Made with care in Accra · Serving West Africa</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-brand-foreground/90">{title}</h4>
      <ul className="mt-4 space-y-2 text-sm text-brand-foreground/70">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="transition-colors hover:text-brand-foreground">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}