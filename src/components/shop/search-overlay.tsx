"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Search, ArrowRight, TrendingUp } from "lucide-react";

const POPULAR_TAGS = [
  "pearl",
  "bridal",
  "gold",
  "kundan",
  "minimal",
  "emerald",
  "vintage",
  "statement",
  "everyday",
  "wedding",
];

const QUICK_LINKS = [
  { label: "Bridal Sets", href: "/category/bridal-sets" },
  { label: "Rings", href: "/category/rings" },
  { label: "Necklaces", href: "/category/necklaces" },
  { label: "Earrings", href: "/category/earrings" },
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    onClose();
    router.push(`/products?q=${encodeURIComponent(q.trim())}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md animate-in fade-in duration-200">
      <div className="container py-6 md:py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Search</p>
          <button onClick={onClose} aria-label="Close search" className="p-2 hover:bg-muted rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by name, tag, or material..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full h-16 pl-12 pr-32 text-lg md:text-xl rounded-full border-2 bg-card focus:outline-none focus:border-accent transition-colors"
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground text-background px-5 h-12 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Search
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-10 space-y-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              Popular searches
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.map((t) => (
                <Link
                  key={t}
                  href={`/products?q=${encodeURIComponent(t)}`}
                  onClick={onClose}
                  className="px-4 py-2 bg-secondary hover:bg-accent hover:text-accent-foreground rounded-full text-sm font-medium border transition-colors capitalize"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Quick links
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {QUICK_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={onClose}
                  className="bg-card border rounded-xl p-4 hover:border-accent hover:shadow-sm transition flex items-center justify-between text-sm font-medium group"
                >
                  {l.label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-4 border-t">
            Press <kbd className="px-1.5 py-0.5 border rounded text-[10px] font-mono">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
