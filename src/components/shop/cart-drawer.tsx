"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useCartRevalidate } from "@/lib/use-cart-revalidate";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const { items, isOpen, close, remove, setQty, subtotal } = useCart();
  const syncCart = useCartRevalidate();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Refresh prices/stock against the server whenever the bag is opened, so the
  // customer never sees stale (pre-price-change) figures.
  useEffect(() => {
    if (isOpen) syncCart();
  }, [isOpen, syncCart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={close}
        aria-hidden
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
        <header className="flex items-center justify-between p-6 border-b border-border/70">
          <div>
            <p className="eyebrow-accent">Your Bag</p>
            <p className="font-serif text-2xl mt-1">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Close cart"
            className="w-9 h-9 rounded-full border border-border hover:border-accent hover:text-accent transition-colors flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 space-y-5">
            <div className="bg-secondary w-20 h-20 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-9 w-9 text-accent" strokeWidth={1.4} />
            </div>
            <div>
              <p className="font-serif text-xl">Your bag is empty</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add some pieces to get started.
              </p>
            </div>
            <button
              onClick={close}
              className="bg-foreground text-background px-7 h-12 rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-border/60">
              {items.map((item) => (
                <div key={item.key} className="flex gap-4 py-5">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={close}
                    className="relative w-20 h-24 bg-secondary shrink-0 overflow-hidden rounded-xl"
                  >
                    {item.image && (
                      <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                    )}
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={close}
                      className="text-sm font-medium line-clamp-2 hover:text-accent transition-colors"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{item.sku}</p>
                    {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {Object.entries(item.selectedAttributes).map(([k, v], i, arr) => (
                          <span key={k}>
                            <span className="font-medium text-foreground">{v}</span>
                            <span className="text-muted-foreground"> {k}</span>
                            {i < arr.length - 1 && <span> · </span>}
                          </span>
                        ))}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-3">
                      <div className="flex items-center border border-border rounded-full">
                        <button
                          onClick={() => setQty(item.key, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-2.5 py-1.5 disabled:opacity-30 hover:text-accent transition-colors"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 text-xs tabular-nums font-medium">{item.quantity}</span>
                        <button
                          onClick={() => setQty(item.key, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="px-2.5 py-1.5 disabled:opacity-30 hover:text-accent transition-colors"
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(item.key)}
                    aria-label="Remove from cart"
                    className="text-muted-foreground hover:text-destructive shrink-0 self-start"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <footer className="border-t border-border/70 p-6 space-y-4 bg-secondary/30">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Subtotal</p>
                <p className="font-serif text-2xl tabular-nums">{formatPrice(subtotal())}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping & coupon calculated at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={close}
                className="group flex items-center justify-center gap-2 bg-foreground text-background h-13 py-4 rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-colors gold-button-glow"
              >
                Checkout
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/cart"
                onClick={close}
                className="block text-center text-xs uppercase tracking-[0.2em] font-semibold link-grow w-fit mx-auto"
              >
                View Bag
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
