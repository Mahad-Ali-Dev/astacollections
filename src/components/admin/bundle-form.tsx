"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, Plus, Trash2, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { computeBundlePricing } from "@/lib/bundles";
import { formatPrice, slugify } from "@/lib/utils";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  sku: string;
  images: { url: string }[];
};

type BundleItem = { productId: string; quantity: number };

export function BundleForm({
  bundle,
  products,
}: {
  bundle?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    discountType: string;
    discountValue: number;
    isActive: boolean;
    sortOrder: number;
    items: { productId: string; quantity: number }[];
  };
  products: Product[];
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    id: bundle?.id ?? "",
    name: bundle?.name ?? "",
    slug: bundle?.slug ?? "",
    description: bundle?.description ?? "",
    discountType: bundle?.discountType ?? "PERCENTAGE",
    discountValue: bundle ? String(bundle.discountValue) : "10",
    isActive: bundle?.isActive ?? true,
    sortOrder: bundle ? String(bundle.sortOrder) : "0",
    items: (bundle?.items ?? []) as BundleItem[],
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const matching = products.filter(
    (p) =>
      !form.items.find((i) => i.productId === p.id) &&
      (search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const addItem = (productId: string) => {
    setForm({
      ...form,
      items: [...form.items, { productId, quantity: 1 }],
    });
    setSearch("");
  };

  const removeItem = (productId: string) =>
    setForm({ ...form, items: form.items.filter((i) => i.productId !== productId) });

  const setQty = (productId: string, qty: number) =>
    setForm({
      ...form,
      items: form.items.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, qty) } : i)),
    });

  const move = (productId: string, dir: -1 | 1) => {
    const arr = [...form.items];
    const idx = arr.findIndex((i) => i.productId === productId);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setForm({ ...form, items: arr });
  };

  // Live pricing preview
  const pricingItems = form.items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    product: { price: productMap[i.productId]?.price ?? 0 },
  }));
  const pricing = computeBundlePricing({
    discountType: form.discountType,
    discountValue: Number(form.discountValue) || 0,
    items: pricingItems,
  });

  const save = async () => {
    if (!form.name || !form.slug) {
      toast.error("Name and slug are required");
      return;
    }
    if (form.items.length < 2) {
      toast.error("A bundle needs at least 2 products");
      return;
    }
    setSaving(true);
    try {
      const isNew = !form.id;
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        discountType: form.discountType,
        discountValue: Number(form.discountValue) || 0,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
        items: form.items,
      };
      const res = await fetch(isNew ? "/api/bundles" : `/api/bundles/${form.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isNew ? "Bundle created" : "Bundle updated");
      router.push("/admin/bundles");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!form.id) return;
    if (!confirm("Delete this bundle?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/bundles/${form.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Bundle deleted");
      router.push("/admin/bundles");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/bundles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-serif">{form.id ? "Edit Bundle" : "New Bundle"}</h1>
        </div>
        {form.id && (
          <Button variant="outline" size="sm" onClick={remove} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
        )}
        <Button onClick={save} disabled={saving} variant="gold">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Bundle"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold">Bundle Details</h2>
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm({
                    ...form,
                    name,
                    slug: form.slug && form.id ? form.slug : slugify(name),
                  });
                }}
                placeholder="e.g. Bridal Essentials Bundle"
              />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Shown on the bundle card and product page"
                rows={3}
              />
            </div>
          </section>

          <section className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold">Discount</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Discount Type</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) => setForm({ ...form, discountType: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount (Rs.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Products in this Bundle</h2>
              <span className="text-xs text-muted-foreground">
                {form.items.length} {form.items.length === 1 ? "item" : "items"} (min 2)
              </span>
            </div>

            {form.items.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No products yet — add 2 or more below.</p>
            ) : (
              <div className="space-y-2">
                {form.items.map((it, i) => {
                  const p = productMap[it.productId];
                  if (!p) return null;
                  return (
                    <div key={it.productId} className="flex items-center gap-3 border rounded-lg p-3 bg-muted/30">
                      <div className="relative w-12 h-12 bg-muted rounded shrink-0 overflow-hidden">
                        {p.images[0] && (
                          <Image src={p.images[0].url} alt="" fill sizes="48px" className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {formatPrice(p.price)} · {p.sku}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => move(it.productId, -1)}
                          disabled={i === 0}
                          className="p-1.5 hover:bg-muted rounded disabled:opacity-30"
                          aria-label="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => move(it.productId, 1)}
                          disabled={i === form.items.length - 1}
                          className="p-1.5 hover:bg-muted rounded disabled:opacity-30"
                          aria-label="Move down"
                        >
                          ↓
                        </button>
                        <Input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => setQty(it.productId, Number(e.target.value) || 1)}
                          className="w-16 h-9"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(it.productId)}
                          className="text-muted-foreground hover:text-destructive p-1.5"
                          aria-label="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t pt-4 space-y-2">
              <Label>Add Product</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products by name or SKU..."
                  className="pl-9"
                />
              </div>
              {(search || form.items.length === 0) && (
                <div className="border rounded-lg max-h-72 overflow-y-auto bg-card">
                  {matching.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 italic">No matches</p>
                  ) : (
                    matching.slice(0, 10).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addItem(p.id)}
                        className="w-full flex items-center gap-3 p-2.5 hover:bg-muted/40 transition border-b last:border-0 text-left"
                      >
                        <div className="relative w-10 h-10 bg-muted rounded shrink-0 overflow-hidden">
                          {p.images[0] && (
                            <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {formatPrice(p.price)} · {p.sku}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-accent shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-4">
          <section className="bg-card border rounded-lg p-6 space-y-3">
            <h2 className="font-semibold">Visibility</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">Active</span>
            </label>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
            </div>
          </section>

          {form.items.length > 0 && (
            <section className="bg-muted/40 border rounded-lg p-5 space-y-2 text-sm">
              <p className="font-semibold mb-2">Pricing Preview</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sum of items</span>
                <span className="tabular-nums">{formatPrice(pricing.original)}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>Discount</span>
                <span className="tabular-nums">- {formatPrice(pricing.discount)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Bundle price</span>
                <span className="tabular-nums">{formatPrice(pricing.final)}</span>
              </div>
              <p className="text-xs text-accent text-center pt-1">
                Customer saves {formatPrice(pricing.discount)} ({pricing.percent}%)
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
