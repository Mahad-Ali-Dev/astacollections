"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

type Row = {
  id: string;
  name: string;
  sku: string;
  price: number;
  comparePrice: number | null;
  onSale: boolean;
  stock: number;
  isActive: boolean;
  isPrimary: boolean;
  categoryName: string;
};

/**
 * Curate which products appear in a category beyond the ones that live there.
 *
 * Sorted by stock then price, because the products worth putting in a
 * collection you intend to advertise are the ones you can actually fulfil —
 * a one-unit SKU sells out on the first order.
 */
export function CategoryProductsDialog({
  categoryId,
  categoryName,
  onClose,
}: {
  categoryId: string;
  categoryName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [minStock, setMinStock] = useState(0);
  const [saleOnly, setSaleOnly] = useState(false);
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/categories/${categoryId}/products`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (cancelled) return;
        setRows(data.products);
        setSelected(new Set<string>(data.selected));
      } catch (e: any) {
        toast.error(e.message ?? "Could not load products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  /** Categories present in the catalogue, for the chip filter. */
  const allCats = useMemo(
    () => [...new Set(rows.filter((r) => r.categoryName).map((r) => r.categoryName))].sort(),
    [rows]
  );

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const lo = minPrice === "" ? -Infinity : Number(minPrice);
    const hi = maxPrice === "" ? Infinity : Number(maxPrice);
    return rows.filter(
      (r) =>
        !r.isPrimary &&
        r.stock >= minStock &&
        (!saleOnly || r.onSale) &&
        // No categories ticked means "all", rather than "none".
        (cats.size === 0 || cats.has(r.categoryName)) &&
        r.price >= lo &&
        r.price <= hi &&
        (needle === "" ||
          r.name.toLowerCase().includes(needle) ||
          r.sku.toLowerCase().includes(needle) ||
          r.categoryName.toLowerCase().includes(needle))
    );
  }, [rows, q, minStock, saleOnly, cats, minPrice, maxPrice]);

  const primaryCount = rows.filter((r) => r.isPrimary).length;
  const chosen = rows.filter((r) => selected.has(r.id) && !r.isPrimary);
  const units = chosen.reduce((n, r) => n + r.stock, 0);
  const avg = chosen.length
    ? Math.round(chosen.reduce((n, r) => n + r.price, 0) / chosen.length)
    : 0;

  function toggle(id: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCat(name: string) {
    setCats((cur) => {
      const next = new Set(cur);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function resetFilters() {
    setQ("");
    setMinStock(0);
    setSaleOnly(false);
    setCats(new Set());
    setMinPrice("");
    setMaxPrice("");
  }

  function selectAllVisible() {
    setSelected((cur) => {
      const next = new Set(cur);
      for (const r of visible) next.add(r.id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/categories/${categoryId}/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Saved — ${data.saved} product${data.saved === 1 ? "" : "s"} added`);
      router.refresh();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[88vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Products in {categoryName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name, SKU or category"
                  className="pl-9"
                />
              </div>
              <select
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value={0}>Any stock</option>
                <option value={2}>2+ in stock</option>
                <option value={3}>3+ in stock</option>
                <option value={5}>5+ in stock</option>
              </select>
              <Button type="button" variant="outline" size="sm" onClick={selectAllVisible}>
                Select all shown
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelected(new Set())}
                disabled={selected.size === 0}
              >
                Clear selection
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => setSaleOnly((v) => !v)}
                className={`px-3 h-8 rounded-full border text-xs font-medium transition ${
                  saleOnly
                    ? "bg-foreground text-background border-foreground"
                    : "hover:bg-secondary"
                }`}
              >
                On sale only
              </button>

              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min Rs"
                  className="h-8 w-24 text-xs"
                />
                <span className="text-muted-foreground text-xs">–</span>
                <Input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max Rs"
                  className="h-8 w-24 text-xs"
                />
              </div>

              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Reset filters
              </button>
            </div>

            {allCats.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {allCats.map((c) => {
                  const on = cats.has(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCat(c)}
                      className={`px-2.5 h-7 rounded-full border text-[11px] font-medium transition ${
                        on
                          ? "bg-accent text-accent-foreground border-accent"
                          : "hover:bg-secondary text-muted-foreground"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {primaryCount > 0 && (
                <>
                  {primaryCount} product{primaryCount === 1 ? "" : "s"} already live here
                  as their main category and aren&apos;t listed below.{" "}
                </>
              )}
              Showing {visible.length} others.
            </p>

            <div className="flex-1 overflow-y-auto border rounded-lg divide-y min-h-0">
              {visible.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  Nothing matches those filters.
                </p>
              ) : (
                visible.map((r) => {
                  const on = selected.has(r.id);
                  return (
                    <label
                      key={r.id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-secondary/50 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-black shrink-0"
                        checked={on}
                        onChange={() => toggle(r.id)}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-medium">{r.name}</span>
                        <span className="block text-xs text-muted-foreground font-mono">
                          {r.sku} · {r.categoryName}
                          {!r.isActive && " · hidden"}
                        </span>
                      </span>
                      <span className="text-xs tabular-nums shrink-0 text-right">
                        <span className="block font-medium">
                          {formatPrice(r.price)}
                          {r.onSale && r.comparePrice != null && (
                            <span className="ml-1.5 font-normal text-muted-foreground line-through">
                              {formatPrice(r.comparePrice)}
                            </span>
                          )}
                        </span>
                        <span
                          className={
                            r.stock === 0
                              ? "block text-destructive"
                              : r.stock < 3
                                ? "block text-amber-600"
                                : "block text-muted-foreground"
                          }
                        >
                          {r.stock} in stock
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
              <p className="text-xs text-muted-foreground">
                {chosen.length === 0
                  ? "Nothing selected"
                  : `${chosen.length} selected · ${units} units · ${formatPrice(avg)} average`}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="gold" size="sm" onClick={save} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
