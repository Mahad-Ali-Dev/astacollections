"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "price-low", label: "Price: low to high" },
  { key: "price-high", label: "Price: high to low" },
] as const;

export const PRICES = [
  { key: "", label: "Any price" },
  { key: "0-699", label: "Under Rs. 700" },
  { key: "700-999", label: "Rs. 700 – 999" },
  { key: "1000-1499", label: "Rs. 1,000 – 1,499" },
  { key: "1500-999999", label: "Rs. 1,500 and above" },
] as const;

/**
 * Sort + price filter for a collection page. Desktop: inline controls.
 * Phones: a "Sort & filter" button that opens a bottom sheet. Options are
 * plain links (server-rendered results, shareable URLs, work without JS).
 */
export function CollectionToolbar({ count }: { count: number }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const sort = params.get("sort") ?? "newest";
  const price = params.get("price") ?? "";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const href = (next: { sort?: string; price?: string }) => {
    const p = new URLSearchParams(params.toString());
    const s = next.sort ?? sort;
    const pr = next.price ?? price;
    if (s && s !== "newest") p.set("sort", s);
    else p.delete("sort");
    if (pr) p.set("price", pr);
    else p.delete("price");
    const qs = p.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };
  const active = (sort !== "newest" ? 1 : 0) + (price ? 1 : 0);

  const Options = ({ onPick }: { onPick?: () => void }) => (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sort</legend>
        <ul className="space-y-1">
          {SORTS.map((o) => (
            <li key={o.key}>
              <Link
                href={href({ sort: o.key })}
                scroll={false}
                onClick={onPick}
                aria-current={sort === o.key ? "true" : undefined}
                className="flex min-h-[44px] items-center justify-between rounded-xl px-3 text-sm hover:bg-secondary"
              >
                {o.label}
                {sort === o.key && <Check className="h-4 w-4 text-accent" aria-hidden="true" />}
              </Link>
            </li>
          ))}
        </ul>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Price</legend>
        <ul className="flex flex-wrap gap-2">
          {PRICES.map((o) => (
            <li key={o.key || "any"}>
              <Link
                href={href({ price: o.key })}
                scroll={false}
                onClick={onPick}
                aria-current={price === o.key ? "true" : undefined}
                className={cn(
                  "inline-flex h-11 items-center rounded-full border px-4 text-sm transition-colors",
                  price === o.key ? "border-foreground bg-foreground text-background" : "border-border hover:border-accent"
                )}
              >
                {o.label}
              </Link>
            </li>
          ))}
        </ul>
      </fieldset>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-4">
        <p className="text-sm text-muted-foreground">
          <strong className="font-semibold text-foreground">{count}</strong> {count === 1 ? "piece" : "pieces"}
        </p>
        {/* Desktop: inline */}
        <div className="hidden items-center gap-2 md:flex">
          {PRICES.slice(1).map((o) => (
            <Link
              key={o.key}
              href={href({ price: price === o.key ? "" : o.key })}
              scroll={false}
              className={cn(
                "inline-flex h-10 items-center rounded-full border px-4 text-sm transition-colors",
                price === o.key ? "border-foreground bg-foreground text-background" : "border-border hover:border-accent"
              )}
            >
              {o.label}
            </Link>
          ))}
          <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
          {SORTS.map((o) => (
            <Link
              key={o.key}
              href={href({ sort: o.key })}
              scroll={false}
              className={cn("link-slide text-sm", sort === o.key ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {o.key === "newest" ? "Newest" : o.key === "price-low" ? "Price ↑" : "Price ↓"}
            </Link>
          ))}
        </div>
        {/* Phones: bottom sheet */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="press inline-flex h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium md:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Sort &amp; filter
          {active > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground">
              {active}
            </span>
          )}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Sort and filter">
          <div className="absolute inset-0 bg-foreground/40 animate-in fade-in duration-200" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[1.75rem] bg-white px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
            <div className="mb-4 flex items-center justify-between">
              <p className="font-serif text-2xl">Sort &amp; filter</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full border border-border">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Options onPick={() => setOpen(false)} />
            {active > 0 && (
              <Link
                href={pathname}
                scroll={false}
                onClick={() => setOpen(false)}
                className="mt-6 flex h-12 items-center justify-center rounded-full border border-border text-xs font-semibold uppercase tracking-[0.18em]"
              >
                Clear all
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
