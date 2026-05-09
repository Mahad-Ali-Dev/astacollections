"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRICE_RANGES = [
  { label: "Under Rs. 1,500", min: 0, max: 1500 },
  { label: "Rs. 1,500 – 3,000", min: 1500, max: 3000 },
  { label: "Rs. 3,000 – 5,000", min: 3000, max: 5000 },
  { label: "Rs. 5,000 – 10,000", min: 5000, max: 10000 },
  { label: "Above Rs. 10,000", min: 10000, max: 999999 },
];

type Category = { name: string; slug: string };
type FilterSidebarProps = {
  categories: Category[];
  materials: string[];
};

export function ProductFilters({ categories, materials }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [open, setOpen] = useState(false);

  const setParam = (k: string, v: string | null) => {
    const sp = new URLSearchParams(Array.from(search.entries()));
    if (v === null || v === "") sp.delete(k);
    else sp.set(k, v);
    router.push(`${pathname}?${sp.toString()}`);
  };

  const toggleParam = (k: string, v: string) => {
    const current = search.get(k);
    setParam(k, current === v ? null : v);
  };

  const selectedCat = search.get("category");
  const selectedMaterial = search.get("material");
  const selectedPrice = search.get("price");
  const inStock = search.get("inStock") === "1";
  const onSale = search.get("onSale") === "1";
  const sort = search.get("sort") ?? "newest";

  const activeCount =
    (selectedCat ? 1 : 0) +
    (selectedMaterial ? 1 : 0) +
    (selectedPrice ? 1 : 0) +
    (inStock ? 1 : 0) +
    (onSale ? 1 : 0);

  const clearAll = () => router.push(pathname);

  // Lock scroll when mobile filter open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Mobile filter button */}
      <div className="md:hidden flex items-center justify-between mb-4 sticky top-[64px] bg-background py-3 border-b z-10">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 border rounded-full hover:border-accent"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="bg-accent text-accent-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </button>
        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value === "newest" ? null : e.target.value)}
          className="text-sm border rounded-full px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:block sticky top-24 h-fit space-y-6 pr-2">
        <FilterContent
          categories={categories}
          materials={materials}
          selectedCat={selectedCat}
          selectedMaterial={selectedMaterial}
          selectedPrice={selectedPrice}
          inStock={inStock}
          onSale={onSale}
          sort={sort}
          activeCount={activeCount}
          setParam={setParam}
          toggleParam={toggleParam}
          clearAll={clearAll}
        />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-background shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
            <header className="flex items-center justify-between p-4 border-b">
              <h2 className="font-serif text-xl">Filters</h2>
              <button onClick={() => setOpen(false)} aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <FilterContent
                categories={categories}
                materials={materials}
                selectedCat={selectedCat}
                selectedMaterial={selectedMaterial}
                selectedPrice={selectedPrice}
                inStock={inStock}
                onSale={onSale}
                sort={sort}
                activeCount={activeCount}
                setParam={setParam}
                toggleParam={toggleParam}
                clearAll={clearAll}
              />
            </div>
            <footer className="p-4 border-t flex gap-2 bg-card">
              <Button variant="outline" className="flex-1" onClick={clearAll}>
                Clear All
              </Button>
              <Button variant="gold" className="flex-1" onClick={() => setOpen(false)}>
                Show Results
              </Button>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}

function FilterContent(props: {
  categories: Category[];
  materials: string[];
  selectedCat: string | null;
  selectedMaterial: string | null;
  selectedPrice: string | null;
  inStock: boolean;
  onSale: boolean;
  sort: string;
  activeCount: number;
  setParam: (k: string, v: string | null) => void;
  toggleParam: (k: string, v: string) => void;
  clearAll: () => void;
}) {
  return (
    <>
      {props.activeCount > 0 && (
        <button
          onClick={props.clearAll}
          className="text-xs text-accent hover:underline flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Clear all filters ({props.activeCount})
        </button>
      )}

      <Section title="Sort by">
        <div className="space-y-2 text-sm">
          {[
            { v: "newest", l: "Newest" },
            { v: "price-low", l: "Price: Low to High" },
            { v: "price-high", l: "Price: High to Low" },
            { v: "name", l: "Name A-Z" },
          ].map((s) => (
            <FilterRadio
              key={s.v}
              checked={props.sort === s.v}
              label={s.l}
              onChange={() => props.setParam("sort", s.v === "newest" ? null : s.v)}
            />
          ))}
        </div>
      </Section>

      <Section title="Category">
        <div className="space-y-2 text-sm">
          <FilterRadio
            checked={!props.selectedCat}
            label="All categories"
            onChange={() => props.setParam("category", null)}
          />
          {props.categories.map((c) => (
            <FilterRadio
              key={c.slug}
              checked={props.selectedCat === c.slug}
              label={c.name}
              onChange={() => props.setParam("category", c.slug)}
            />
          ))}
        </div>
      </Section>

      <Section title="Price">
        <div className="space-y-2 text-sm">
          <FilterRadio
            checked={!props.selectedPrice}
            label="Any price"
            onChange={() => props.setParam("price", null)}
          />
          {PRICE_RANGES.map((p) => {
            const v = `${p.min}-${p.max}`;
            return (
              <FilterRadio
                key={v}
                checked={props.selectedPrice === v}
                label={p.label}
                onChange={() => props.setParam("price", v)}
              />
            );
          })}
        </div>
      </Section>

      {props.materials.length > 0 && (
        <Section title="Material">
          <div className="space-y-2 text-sm">
            <FilterRadio
              checked={!props.selectedMaterial}
              label="All materials"
              onChange={() => props.setParam("material", null)}
            />
            {props.materials.slice(0, 8).map((m) => (
              <FilterRadio
                key={m}
                checked={props.selectedMaterial === m}
                label={m}
                onChange={() => props.setParam("material", m)}
              />
            ))}
          </div>
        </Section>
      )}

      <Section title="Availability">
        <div className="space-y-2 text-sm">
          <FilterCheck
            checked={props.inStock}
            label="In stock only"
            onChange={() => props.setParam("inStock", props.inStock ? null : "1")}
          />
          <FilterCheck
            checked={props.onSale}
            label="On sale only"
            onChange={() => props.setParam("onSale", props.onSale ? null : "1")}
          />
        </div>
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group border-b pb-5">
      <summary className="font-semibold text-xs uppercase tracking-widest text-muted-foreground cursor-pointer flex items-center justify-between mb-3 list-none">
        {title}
        <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
      </summary>
      {children}
    </details>
  );
}

function FilterRadio({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <span
        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
          checked ? "border-accent" : "border-border group-hover:border-foreground"
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-accent" />}
      </span>
      <span className={checked ? "font-medium" : "text-foreground/80 group-hover:text-foreground"}>
        {label}
      </span>
      <input type="radio" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  );
}

function FilterCheck({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <span
        className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition ${
          checked ? "border-accent bg-accent" : "border-border group-hover:border-foreground"
        }`}
      >
        {checked && (
          <svg className="h-2.5 w-2.5 text-accent-foreground" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={checked ? "font-medium" : "text-foreground/80 group-hover:text-foreground"}>
        {label}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  );
}

/**
 * Active filter chips shown above the product grid.
 */
export function ActiveFilterChips({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const remove = (k: string) => {
    const sp = new URLSearchParams(Array.from(search.entries()));
    sp.delete(k);
    router.push(`${pathname}?${sp.toString()}`);
  };

  const chips: { key: string; label: string }[] = [];
  const cat = search.get("category");
  if (cat) {
    const found = categories.find((c) => c.slug === cat);
    chips.push({ key: "category", label: found?.name ?? cat });
  }
  const price = search.get("price");
  if (price) {
    const [min, max] = price.split("-").map(Number);
    chips.push({
      key: "price",
      label: max >= 999999 ? `Above Rs. ${min.toLocaleString()}` : `Rs. ${min.toLocaleString()} – ${max.toLocaleString()}`,
    });
  }
  const material = search.get("material");
  if (material) chips.push({ key: "material", label: material });
  if (search.get("inStock") === "1") chips.push({ key: "inStock", label: "In stock" });
  if (search.get("onSale") === "1") chips.push({ key: "onSale", label: "On sale" });
  const q = search.get("q");
  if (q) chips.push({ key: "q", label: `“${q}”` });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">Filters:</span>
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={() => remove(c.key)}
          className="inline-flex items-center gap-1.5 bg-accent/10 text-accent-foreground border border-accent/30 px-3 py-1 rounded-full text-xs font-medium hover:bg-accent/20"
        >
          {c.label}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}
