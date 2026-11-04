"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SORTS, type FacetCounts } from "@/lib/product-facets";

export type CategoryOption = { slug: string; label: string; count: number; children: { slug: string; label: string; count: number }[] };

/**
 * Filters + sort for the shop and collection pages. One control set:
 * Category (shop page only), Tone, Stone, Price, Availability, Sort.
 * Desktop: a compact row of dropdowns with removable chips. Phones: a
 * "Sort & filter" bottom sheet with the same options. Every option is a plain
 * link, so results are server-rendered and URLs can be shared.
 */
export function CatalogToolbar({
  count,
  facets,
  categories,
}: {
  count: number;
  facets: FacetCounts;
  /** Omitted on collection pages, which already are a category. */
  categories?: CategoryOption[];
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [sheet, setSheet] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = sheet ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheet]);

  // Close a dropdown on outside click or Escape.
  useEffect(() => {
    if (!menu && !sheet) return;
    const onDown = (e: MouseEvent) => {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        setSheet(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu, sheet]);

  const current = (k: string) => params.get(k) ?? "";
  const hrefWith = (key: string, value: string) => {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    const qs = p.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };
  const close = () => {
    setMenu(null);
    setSheet(false);
  };

  const flatCategories = (categories ?? []).flatMap((c) => [c, ...c.children]);
  const groups: { key: string; title: string; options: { key: string; label: string; count?: number; indent?: boolean }[] }[] = [
    ...(categories && categories.length > 0
      ? [
          {
            key: "category",
            title: "Category",
            options: categories.flatMap((c) => [
              { key: c.slug, label: c.label, count: c.count },
              ...c.children.map((x) => ({ key: x.slug, label: x.label, count: x.count, indent: true })),
            ]),
          },
        ]
      : []),
    { key: "tone", title: "Tone", options: facets.tones },
    { key: "stone", title: "Stone", options: facets.stones },
    { key: "price", title: "Price", options: facets.prices },
  ].filter((g) => g.options.length > 0);

  const labelFor = (key: string, value: string) =>
    key === "category"
      ? flatCategories.find((c) => c.slug === value)?.label
      : groups.find((g) => g.key === key)?.options.find((o) => o.key === value)?.label;

  const chips = [
    ...groups.flatMap((g) => {
      const v = current(g.key);
      return v ? [{ key: g.key, label: labelFor(g.key, v) ?? v }] : [];
    }),
    ...(current("inStock") === "1" ? [{ key: "inStock", label: "In stock" }] : []),
  ];
  const sort = current("sort") || "newest";
  const sortLabel = SORTS.find((s) => s.key === sort)?.label ?? "Newest";
  const activeCount = chips.length + (sort !== "newest" ? 1 : 0);

  const clearHref = (() => {
    const q = params.get("q");
    return q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname;
  })();

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="shrink-0 text-sm text-muted-foreground">
          <strong className="font-semibold text-foreground">{count}</strong> {count === 1 ? "piece" : "pieces"}
        </p>

        {/* Desktop dropdown row */}
        <div ref={rowRef} className="hidden flex-1 items-center justify-end gap-2 md:flex">
          {groups.map((g) => (
            <Dropdown
              key={g.key}
              label={g.title}
              active={!!current(g.key)}
              open={menu === g.key}
              onToggle={() => setMenu(menu === g.key ? null : g.key)}
              wide={g.key === "category"}
            >
              <OptionList group={g} value={current(g.key)} hrefWith={hrefWith} onPick={close} />
            </Dropdown>
          ))}
          <Link
            href={hrefWith("inStock", current("inStock") === "1" ? "" : "1")}
            scroll={false}
            aria-pressed={current("inStock") === "1"}
            className={cn(
              "inline-flex h-11 items-center rounded-full border px-4 text-sm transition-colors",
              current("inStock") === "1" ? "border-foreground bg-foreground text-background" : "border-border hover:border-accent"
            )}
          >
            In stock
          </Link>
          <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
          <Dropdown label={sortLabel} prefix="Sort:" open={menu === "sort"} onToggle={() => setMenu(menu === "sort" ? null : "sort")} alignRight>
            <OptionList
              group={{ key: "sort", options: SORTS.map((s) => ({ key: s.key, label: s.label })) }}
              value={sort}
              hrefWith={(k, v) => hrefWith(k, v === "newest" ? "" : v)}
              onPick={close}
              noClear
            />
          </Dropdown>
        </div>

        {/* Phones */}
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="press inline-flex h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium md:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Sort &amp; filter
          {activeCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filters */}
      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <Link
              key={c.key}
              href={hrefWith(c.key, "")}
              scroll={false}
              aria-label={`Remove filter: ${c.label}`}
              className="press inline-flex h-9 items-center gap-1.5 rounded-full bg-secondary px-3 text-sm transition-colors hover:bg-accent/10"
            >
              {c.label}
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ))}
          <Link href={clearHref} scroll={false} className="link-slide ml-1 text-sm text-muted-foreground hover:text-foreground">
            Clear all
          </Link>
        </div>
      )}

      {/* Phone sheet */}
      {sheet && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Sort and filter">
          <div className="absolute inset-0 bg-foreground/40 animate-in fade-in duration-200" onClick={() => setSheet(false)} aria-hidden />
          <div className="absolute inset-x-0 bottom-0 max-h-[88svh] overflow-y-auto overscroll-contain rounded-t-[1.75rem] bg-white px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
            <div className="mb-4 flex items-center justify-between">
              <p className="font-serif text-2xl">Sort &amp; filter</p>
              <button type="button" onClick={() => setSheet(false)} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full border border-border">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-6">
              <SheetGroup title="Sort">
                <OptionList
                  group={{ key: "sort", options: SORTS.map((s) => ({ key: s.key, label: s.label })) }}
                  value={sort}
                  hrefWith={(k, v) => hrefWith(k, v === "newest" ? "" : v)}
                  onPick={close}
                  noClear
                />
              </SheetGroup>
              {groups.map((g) => (
                <SheetGroup key={g.key} title={g.title}>
                  <OptionList group={g} value={current(g.key)} hrefWith={hrefWith} onPick={close} />
                </SheetGroup>
              ))}
              <SheetGroup title="Availability">
                <Link
                  href={hrefWith("inStock", current("inStock") === "1" ? "" : "1")}
                  scroll={false}
                  onClick={close}
                  aria-current={current("inStock") === "1" ? "true" : undefined}
                  className="flex min-h-[44px] items-center justify-between rounded-xl px-3 text-sm hover:bg-secondary"
                >
                  In stock only <span className="text-xs tabular-nums text-muted-foreground">{facets.inStock}</span>
                </Link>
              </SheetGroup>
            </div>
            {activeCount > 0 && (
              <Link
                href={clearHref}
                scroll={false}
                onClick={close}
                className="mt-6 flex h-12 items-center justify-center rounded-full border border-border text-xs font-semibold uppercase tracking-[0.18em]"
              >
                Clear all
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SheetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Dropdown({
  label,
  prefix,
  active,
  open,
  onToggle,
  children,
  wide,
  alignRight,
}: {
  label: string;
  prefix?: string;
  active?: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  wide?: boolean;
  alignRight?: boolean;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors",
          active ? "border-foreground bg-foreground text-background" : "border-border hover:border-accent"
        )}
      >
        {prefix && <span className="text-muted-foreground">{prefix}</span>}
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div
          className={cn(
            "absolute top-full z-30 mt-2 max-h-[420px] overflow-y-auto rounded-2xl border border-border/70 bg-white p-2 shadow-[0_24px_60px_-20px_rgba(40,20,15,0.25)] animate-in fade-in slide-in-from-top-1 duration-150",
            wide ? "w-72" : "w-64",
            alignRight ? "right-0" : "left-0"
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function OptionList({
  group,
  value,
  hrefWith,
  onPick,
  noClear,
}: {
  group: { key: string; options: { key: string; label: string; count?: number; indent?: boolean }[] };
  value: string;
  hrefWith: (key: string, value: string) => string;
  onPick: () => void;
  noClear?: boolean;
}) {
  return (
    <ul>
      {group.options.map((o) => {
        const on = value === o.key;
        return (
          <li key={o.key}>
            <Link
              href={hrefWith(group.key, on && !noClear ? "" : o.key)}
              scroll={false}
              onClick={onPick}
              aria-current={on ? "true" : undefined}
              className={cn(
                "flex min-h-[44px] items-center justify-between gap-3 rounded-xl px-3 text-sm transition-colors hover:bg-secondary",
                o.indent && "pl-7 text-foreground/80",
                on && "bg-secondary font-medium"
              )}
            >
              <span>{o.label}</span>
              <span className="flex items-center gap-2">
                {o.count !== undefined && <span className="text-xs tabular-nums text-muted-foreground">{o.count}</span>}
                {on && <Check className="h-4 w-4 text-accent" aria-hidden="true" />}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
