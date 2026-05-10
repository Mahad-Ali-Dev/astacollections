"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Check, ShoppingBag, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-store";
import { computeBundlePricing } from "@/lib/bundles";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export type BundleData = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  discountType: string;
  discountValue: number;
  items: {
    productId: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      sku: string;
      price: number;
      stock: number;
      images: { url: string }[];
    };
  }[];
};

export function BundleSection({
  bundle,
  currentProductId,
}: {
  bundle: BundleData;
  currentProductId: string;
}) {
  const add = useCart((s) => s.add);
  const open = useCart((s) => s.open);
  const [adding, setAdding] = useState(false);

  // Per-item selection state — current product locked in
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(
      bundle.items.map((i) => [i.productId, true])
    )
  );

  // Compute current-selection pricing (only over selected items)
  const selectedItems = bundle.items.filter((i) => selected[i.productId]);
  const pricing = computeBundlePricing({
    discountType: bundle.discountType,
    discountValue: bundle.discountValue,
    items: selectedItems.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      product: { price: i.product.price },
    })),
  });
  const allPricing = computeBundlePricing({
    discountType: bundle.discountType,
    discountValue: bundle.discountValue,
    items: bundle.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      product: { price: i.product.price },
    })),
  });

  const toggle = (productId: string) => {
    if (productId === currentProductId) return; // current product can't be unchecked
    setSelected({ ...selected, [productId]: !selected[productId] });
  };

  const addBundle = () => {
    setAdding(true);
    try {
      let added = 0;
      for (const item of bundle.items) {
        if (!selected[item.productId]) continue;
        const p = item.product;
        if (p.stock < item.quantity) continue;
        // Apply per-unit bundle discount proportionally
        const itemTotal = p.price * item.quantity;
        const proportion = pricing.original > 0 ? itemTotal / pricing.original : 0;
        const itemDiscount = pricing.discount * proportion;
        const discountedPrice = Math.round((itemTotal - itemDiscount) / item.quantity);

        add(
          {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: discountedPrice,
            image: p.images[0]?.url,
            sku: `${p.sku}-BNDL`,
            stock: p.stock,
          },
          item.quantity
        );
        added += item.quantity;
      }
      toast.success(`Bundle added — ${added} pieces, you saved ${formatPrice(pricing.discount)}!`);
      open();
    } finally {
      setAdding(false);
    }
  };

  const selectedCount = selectedItems.length;

  return (
    <section className="mt-6 border-2 border-accent/30 rounded-2xl overflow-hidden bg-gradient-to-br from-accent/5 to-transparent">
      <header className="p-5 border-b border-accent/20 bg-accent/5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-accent font-medium mb-1">
              <Tag className="h-3 w-3 inline mr-1 -mt-0.5" />
              Bundle & Save
            </p>
            <h3 className="font-serif text-xl md:text-2xl">{bundle.name}</h3>
            {bundle.description && (
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">{bundle.description}</p>
            )}
          </div>
          <Badge variant="success" className="font-bold uppercase tracking-wider">
            Save {allPricing.percent}%
          </Badge>
        </div>
      </header>

      <div className="p-5 space-y-3">
        {bundle.items.map((item, i) => {
          const isCurrent = item.productId === currentProductId;
          const isSelected = selected[item.productId];
          const lowStock = item.product.stock < item.quantity;
          return (
            <div
              key={item.productId}
              className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                isSelected ? "bg-card border-accent/40" : "bg-muted/40 border-border opacity-60"
              }`}
            >
              <button
                onClick={() => toggle(item.productId)}
                disabled={isCurrent || lowStock}
                aria-label={isSelected ? "Deselect" : "Select"}
                className={`h-6 w-6 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                  isSelected
                    ? "bg-accent border-accent text-accent-foreground"
                    : "border-border hover:border-accent"
                } ${isCurrent ? "ring-2 ring-accent/30" : ""} ${
                  isCurrent || lowStock ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5" />}
              </button>

              {i > 0 && (
                <Plus className="h-4 w-4 text-muted-foreground hidden md:block shrink-0 -ml-1" />
              )}

              <Link
                href={`/products/${item.product.slug}`}
                className="relative w-14 h-14 md:w-16 md:h-16 rounded-lg bg-muted shrink-0 overflow-hidden border"
              >
                {item.product.images[0] && (
                  <Image
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="text-sm font-medium hover:text-accent line-clamp-1"
                >
                  {item.product.name}
                </Link>
                <p className="text-xs text-muted-foreground tabular-nums">
                  Qty {item.quantity} · {formatPrice(item.product.price)}
                  {isCurrent && (
                    <span className="ml-2 text-accent font-medium">· This item</span>
                  )}
                </p>
                {lowStock && (
                  <p className="text-xs text-destructive">Out of stock</p>
                )}
              </div>

              <p className="text-sm font-semibold tabular-nums shrink-0">
                {formatPrice(item.product.price * item.quantity)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Pricing summary */}
      <div className="border-t border-accent/20 p-5 space-y-3 bg-card">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Bundle total ({selectedCount} {selectedCount === 1 ? "item" : "items"})</span>
            <span className="tabular-nums line-through">{formatPrice(pricing.original)}</span>
          </div>
          <div className="flex justify-between text-green-700 font-medium">
            <span>Bundle discount</span>
            <span className="tabular-nums">- {formatPrice(pricing.discount)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base pt-1 border-t">
            <span>You pay</span>
            <span className="tabular-nums text-lg">{formatPrice(pricing.final)}</span>
          </div>
        </div>

        <Button
          onClick={addBundle}
          disabled={adding || selectedCount < 2}
          variant="gold"
          size="lg"
          className="w-full px-4 sm:px-6 text-[11px] sm:text-sm whitespace-normal sm:whitespace-nowrap"
        >
          {adding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding bundle...
            </>
          ) : selectedCount < 2 ? (
            "Select at least 2 items"
          ) : (
            <>
              <ShoppingBag className="h-4 w-4 shrink-0" />
              {/* Short label on mobile, full on sm+ */}
              <span className="sm:hidden">Add Bundle · Save {formatPrice(pricing.discount)}</span>
              <span className="hidden sm:inline">Add bundle to bag · save {formatPrice(pricing.discount)}</span>
            </>
          )}
        </Button>
      </div>
    </section>
  );
}
