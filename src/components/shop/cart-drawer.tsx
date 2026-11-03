"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X, ArrowRight, Truck, Banknote } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useCartRevalidate } from "@/lib/use-cart-revalidate";
import { formatPrice } from "@/lib/utils";

export type DrawerDelivery = {
  /** Display-only copy of the admin delivery settings (checkout computes the charge). */
  fee: number;
  freeThreshold: number;
  codLabel: string;
};

export function CartDrawer({ delivery }: { delivery?: DrawerDelivery }) {
  const { items, isOpen, close, remove, setQty, subtotal } = useCart();
  const syncCart = useCartRevalidate();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  // Refresh prices/stock against the server whenever the bag is opened, so the
  // customer never sees stale (pre-price-change) figures.
  useEffect(() => {
    if (isOpen) syncCart();
  }, [isOpen, syncCart]);

  if (!isOpen) return null;

  const sub = subtotal();
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const showBar = !!delivery && delivery.fee > 0 && delivery.freeThreshold > 0;
  const remaining = showBar ? Math.max(0, delivery!.freeThreshold - sub) : 0;
  const pct = showBar ? Math.min(100, (sub / delivery!.freeThreshold) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Your bag">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={close} aria-hidden />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300 ease-out">
        <header className="flex items-center justify-between border-b border-border/70 px-5 py-4 md:px-6">
          <p className="font-serif text-2xl">
            Your bag{" "}
            {count > 0 && <span className="align-middle font-sans text-sm text-muted-foreground">({count})</span>}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Close bag"
            className="press flex h-11 w-11 items-center justify-center rounded-full border border-border transition-colors hover:border-accent hover:text-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-5 px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <ShoppingBag className="h-9 w-9 text-accent" strokeWidth={1.4} />
            </div>
            <div>
              <p className="font-serif text-2xl">Your bag is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">Rings, pendant sets and studs for every day.</p>
            </div>
            <Link
              href="/products"
              onClick={close}
              className="press inline-flex h-12 items-center rounded-full bg-foreground px-7 text-xs font-semibold uppercase tracking-[0.2em] text-background transition-colors hover:bg-accent"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            {showBar && (
              <div className="border-b border-border/70 bg-secondary/40 px-5 py-3.5 md:px-6">
                <p className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  {remaining > 0 ? (
                    <span>
                      Add <strong className="font-semibold">{formatPrice(remaining)}</strong> more for free delivery
                    </span>
                  ) : (
                    <span className="font-medium text-emerald-800">You&apos;ve unlocked free delivery</span>
                  )}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            <ul className="flex-1 divide-y divide-border/60 overflow-y-auto overscroll-contain px-5 md:px-6">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-5 animate-in fade-in duration-300">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={close}
                    className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-secondary"
                  >
                    {item.image && <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start gap-2">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={close}
                        className="line-clamp-2 flex-1 text-sm font-medium leading-snug transition-colors hover:text-accent"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(item.key)}
                        aria-label={`Remove ${item.name}`}
                        className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {Object.entries(item.selectedAttributes)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex h-11 items-center rounded-full border border-border">
                        <button
                          type="button"
                          onClick={() => setQty(item.key, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="flex h-full w-11 items-center justify-center transition-colors hover:text-accent disabled:opacity-30"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[1.75rem] text-center text-sm font-medium tabular-nums" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(item.key, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="flex h-full w-11 items-center justify-center transition-colors hover:text-accent disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="space-y-3 border-t border-border/70 bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 md:px-6">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium">Subtotal</p>
                <p className="font-serif text-2xl tabular-nums">{formatPrice(sub)}</p>
              </div>
              <p className="text-xs text-muted-foreground">Delivery and any coupon are applied at checkout.</p>
              <Link
                href="/checkout"
                onClick={close}
                className="press group flex h-14 items-center justify-center gap-2 rounded-full bg-foreground text-xs font-semibold uppercase tracking-[0.2em] text-background transition-colors hover:bg-accent gold-button-glow"
              >
                Checkout · {formatPrice(sub)}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <div className="flex items-center justify-between gap-3 pt-1 text-xs text-muted-foreground">
                {delivery?.codLabel && (
                  <span className="flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5 text-accent" aria-hidden="true" /> {delivery.codLabel}
                  </span>
                )}
                <Link href="/cart" onClick={close} className="link-slide ml-auto font-semibold uppercase tracking-[0.16em] text-foreground">
                  View bag
                </Link>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
