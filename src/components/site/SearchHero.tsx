import { Search, MapPin, Building2, LayoutGrid } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";

const POPULAR = ["Restaurants", "Hotels", "Lawyers", "Beauty salons", "Tech companies"];

export function SearchHero() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeField, setActiveField] = useState<'q' | 'city' | null>(null);

  useEffect(() => {
    if (activeField !== 'q' || q.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      const [listings, categories] = await Promise.all([
        supabase.from('listings').select('id, name, slug, city').ilike('name', `%${q}%`).limit(4),
        supabase.from('categories').select('id, name, slug').ilike('name', `%${q}%`).limit(2)
      ]);

      const results = [
        ...(categories.data?.map(c => ({ ...c, type: 'category' })) || []),
        ...(listings.data?.map(l => ({ ...l, type: 'listing' })) || []),
      ];
      setSuggestions(results);
    };

    const timeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [q, activeField]);

  useEffect(() => {
    if (activeField !== 'city' || city.length < 3) {
      setCitySuggestions([]);
      return;
    }

    const fetchCitySuggestions = async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&featuretype=city&limit=5`);
        if (response.ok) {
          const data = await response.json();
          // Filter to make sure they are somewhat unique and relevant
          const uniqueCities = Array.from(new Set(data.map((item: any) => item.display_name.split(',')[0].trim())))
            .map(name => {
              const fullData = data.find((d: any) => d.display_name.startsWith(name as string));
              return {
                name: name,
                full_name: fullData?.display_name,
                lat: fullData?.lat,
                lon: fullData?.lon
              };
            });
          setCitySuggestions(uniqueCities.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching location data:", error);
      }
    };

    const timeout = setTimeout(fetchCitySuggestions, 500);
    return () => clearTimeout(timeout);
  }, [city, activeField]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    setShowSuggestions(false);
    navigate({ to: "/search", search: { q: q || undefined, city: city || undefined } });
  };

  return (
    <div className="relative w-full">
      <form
        onSubmit={submit}
        className="relative w-full overflow-hidden rounded-[2rem] border border-border/60 bg-surface p-2 shadow-[var(--shadow-elevated)] z-20"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setShowSuggestions(true); setActiveField('q'); }}
              onFocus={() => { setShowSuggestions(true); setActiveField('q'); }}
              placeholder="Restaurants, lawyers, tech companies…"
              className="w-full bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <div className="hidden h-10 w-px bg-border sm:block" />
          <div className="flex flex-1 items-center gap-3 px-4 py-3">
            <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              value={city}
              onChange={(e) => { setCity(e.target.value); setShowSuggestions(true); setActiveField('city'); }}
              onFocus={() => { setShowSuggestions(true); setActiveField('city'); }}
              placeholder="City or region"
              className="w-full bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-xl px-8 font-display text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 active:scale-95 sm:rounded-2xl"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            Search
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-4 pb-2 pt-1 border-t border-slate-100 mt-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mr-1">Popular:</span>
          {POPULAR.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setQ(p); setTimeout(() => submit(), 0); }}
              className="rounded-full border border-slate-100 bg-white px-3 py-1 text-[11px] font-bold text-slate-500 transition-all hover:border-primary/40 hover:text-primary hover:bg-primary/5 active:scale-95"
            >
              {p}
            </button>
          ))}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && ((activeField === 'q' && suggestions.length > 0) || (activeField === 'city' && citySuggestions.length > 0)) && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowSuggestions(false)} />
          <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-30 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 bg-muted/30 border-b border-border">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">
                {activeField === 'q' ? 'Matches Found' : 'Location Suggestions'}
              </span>
            </div>
            <div className="py-2">
              {activeField === 'q' && suggestions.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.type === 'category' ? '/search' : '/listings/$slug'}
                  params={item.type === 'listing' ? { slug: item.slug } : undefined}
                  search={item.type === 'category' ? { category: item.slug } : undefined}
                  onClick={() => setShowSuggestions(false)}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      {item.type === 'category' ? <LayoutGrid size={18} /> : <Building2 size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-primary">{item.type === 'category' ? item.name : item.name}</p>
                      {item.city && <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.city}</p>}
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Select →</span>
                </Link>
              ))}

              {activeField === 'city' && citySuggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCity(item.name as string);
                    setShowSuggestions(false);
                  }}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-primary">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider line-clamp-1">{item.full_name}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Select →</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}