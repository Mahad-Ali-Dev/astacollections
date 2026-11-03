"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { X, Search, ArrowRight, TrendingUp } from "lucide-react";

// Terms that return results in the current catalogue (all stainless steel).
const POPULAR_TAGS = [
  "zircon",
  "couple",
  "pearl",
  "enamel",
  "clover",
  "heart",
  "gold",
  "silver",
  "adjustable",
  "set",
];

const QUICK_LINKS = [
  { label: "Rings", href: "/category/rings" },
  { label: "Couple Rings", href: "/category/couple-rings" },
  { label: "Pendant Sets", href: "/category/pendant" },
  { label: "Stud Earrings", href: "/category/studs" },
];

export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setQ("");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Live results: debounced query against the public products API.
  const [results, setResults] = useState<LiveResult[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const term = q.trim();
    if (!open || term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(term)}&take=6`, { signal: ctrl.signal });
        const data = await res.json();
        setResults(
          (data.products ?? []).map((p: any) => ({
            slug: p.slug,
            name: p.name,
            price: p.price,
            comparePrice: p.comparePrice,
            image: p.images?.[0]?.url ?? null,
          }))
        );
      } catch {
        /* aborted or offline: keep previous results */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    onClose();
    router.push(`/products?q=${encodeURIComponent(q.trim())}`);
  };

  if (!open) return null;

  const term = q.trim();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 backdrop-blur-md animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label="Search">
      <div className="container max-w-3xl pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4 md:py-10">
        <div className="mb-5 flex items-center justify-between md:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Search</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="press flex h-11 w-11 items-center justify-center rounded-full border border-border transition-colors hover:border-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="relative" role="search">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            enterKeyHint="search"
            placeholder="Rings, pendants, zircon…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search jewellery"
            className="h-14 w-full rounded-full border-2 border-border bg-card pl-12 pr-16 [&::-webkit-search-cancel-button]:appearance-none text-base transition-colors focus:border-accent focus:outline-none md:h-16 md:pr-36 md:text-lg"
            autoFocus
          />
          <button
            type="submit"
            aria-label="Search"
            className="press absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background transition-colors hover:bg-accent md:h-12 md:w-auto md:px-5"
          >
            <span className="hidden md:inline">Search</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>

        {term.length >= 2 ? (
          <div className="mt-6" aria-live="polite">
            {loading && results.length === 0 ? (
              <ul className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex items-center gap-4">
                    <span className="h-16 w-16 shrink-0 rounded-xl shimmer" />
                    <span className="h-4 flex-1 rounded shimmer" />
                  </li>
                ))}
              </ul>
            ) : results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No pieces match &ldquo;{term}&rdquo;. Try &ldquo;ring&rdquo;, &ldquo;pendant&rdquo; or &ldquo;studs&rdquo;.
              </p>
            ) : (
              <>
                <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
                  {results.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/products/${r.slug}`} onClick={onClose} className="press flex items-center gap-4 p-3 transition-colors hover:bg-secondary/50">
                        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
                          {r.image && <Image src={r.image} alt="" fill sizes="64px" className="object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-sm font-medium leading-snug">{r.name}</span>
                          <span className="mt-1 flex items-baseline gap-2 text-sm">
                            <span className="font-semibold tabular-nums">{formatPrice(r.price)}</span>
                            {r.comparePrice && r.comparePrice > r.price && (
                              <span className="text-xs tabular-nums text-muted-foreground line-through">{formatPrice(r.comparePrice)}</span>
                            )}
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={submit as unknown as () => void}
                  className="press mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
                >
                  See all results for &ldquo;{term}&rdquo; <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                Popular searches
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setQ(t)}
                    className="press h-11 rounded-full border bg-secondary px-4 text-sm font-medium capitalize transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Shop by collection</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {QUICK_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={onClose}
                    className="press group flex min-h-[56px] items-center justify-between rounded-xl border bg-card p-4 text-sm font-medium transition hover:border-accent hover:shadow-sm"
                  >
                    {l.label}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type LiveResult = { slug: string; name: string; price: number; comparePrice: number | null; image: string | null };
