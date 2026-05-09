"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  Lock,
  RefreshCcw,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ProductCard, type ProductCardData } from "./product-card";
import { formatPrice } from "@/lib/utils";

export function CartPageClient({ recommended }: { recommended: ProductCardData[] }) {
  const { items, remove, setQty, subtotal, clear } = useCart();

  const FREE_SHIP_THRESHOLD = 5000;
  const sub = subtotal();
  const remaining = Math.max(0, FREE_SHIP_THRESHOLD - sub);
  const progress = Math.min(100, (sub / FREE_SHIP_THRESHOLD) * 100);

  if (items.length === 0) {
    return <EmptyCart recommended={recommended} />;
  }

  return (
    <>
      {/* Page banner */}
      <section className="bg-gradient-to-br from-secondary via-background to-secondary/40 border-b">
        <div className="container py-10 md:py-14">
          <Link
            href="/products"
            className="text-xs uppercase tracking-[0.3em] text-accent font-medium inline-flex items-center gap-1 hover:gap-2 transition-all"
          >
            <ArrowLeft className="h-3 w-3" />
            Continue Shopping
          </Link>
          <h1 className="text-4xl md:text-6xl font-serif text-balance mt-3">Your Bag</h1>
          <p className="text-muted-foreground mt-2">
            {items.length} {items.length === 1 ? "piece" : "pieces"} ready for the next step.
          </p>
        </div>
      </section>

      <div className="container py-8 md:py-12">
        {/* Free shipping bar */}
        <div className="bg-accent/5 border border-accent/30 rounded-xl p-4 mb-8 max-w-3xl">
          {remaining > 0 ? (
            <p className="text-sm flex items-center gap-2">
              <Truck className="h-4 w-4 text-accent" />
              Add{" "}
              <strong className="text-accent">{formatPrice(remaining)}</strong> more for{" "}
              <strong>free shipping</strong>.
            </p>
          ) : (
            <p className="text-sm flex items-center gap-2 text-green-700">
              <Sparkles className="h-4 w-4" />
              You&apos;ve unlocked <strong>free shipping!</strong>
            </p>
          )}
          <div className="mt-2 h-1.5 bg-accent/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-amber-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
          {/* ITEMS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {items.length} {items.length === 1 ? "Item" : "Items"}
              </p>
              <button
                onClick={clear}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Clear bag
              </button>
            </div>

            {items.map((item) => (
              <article
                key={item.id}
                className="group flex gap-4 border rounded-xl p-4 bg-card hover:border-accent/40 transition-colors"
              >
                <Link
                  href={`/products/${item.slug}`}
                  className="relative w-24 h-24 md:w-28 md:h-28 rounded-lg bg-muted shrink-0 overflow-hidden"
                >
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="112px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-medium hover:text-accent line-clamp-2"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{item.sku}</p>
                  <p className="font-semibold mt-2 tabular-nums">{formatPrice(item.price)}</p>

                  <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                    <div className="flex items-center border rounded-lg bg-background">
                      <button
                        onClick={() => setQty(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="px-3 py-2 disabled:opacity-30 hover:bg-muted rounded-l-lg transition-colors"
                        aria-label="Decrease"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-3 text-sm font-semibold tabular-nums min-w-[2.5rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => setQty(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="px-3 py-2 disabled:opacity-30 hover:bg-muted rounded-r-lg transition-colors"
                        aria-label="Increase"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    {item.stock < 5 && (
                      <span className="text-xs text-amber-700 font-medium">
                        Only {item.stock} left
                      </span>
                    )}
                    <button
                      onClick={() => remove(item.id)}
                      className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1.5 ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="font-semibold tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {/* SUMMARY */}
          <aside className="lg:sticky lg:top-24 h-fit space-y-4">
            <div className="border rounded-xl p-6 bg-card space-y-4">
              <h2 className="font-serif text-xl">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Subtotal ({items.reduce((n, i) => n + i.quantity, 0)} items)
                  </span>
                  <span className="tabular-nums font-medium">{formatPrice(sub)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span>Add code at checkout</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Estimated total</span>
                <span className="tabular-nums">{formatPrice(sub)}</span>
              </div>
              <Link href="/checkout" className="block">
                <Button variant="gold" size="xl" className="w-full">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/products" className="block">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground text-center pt-2 flex items-center justify-center gap-1.5">
                <Lock className="h-3 w-3" />
                Secure checkout · COD or Bank Transfer
              </p>
            </div>

            <div className="border rounded-xl p-5 bg-card text-sm space-y-3">
              <h3 className="font-semibold">Why shop with us</h3>
              <div className="flex items-start gap-3">
                <Truck className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  Free shipping on orders above Rs. 5,000
                </p>
              </div>
              <div className="flex items-start gap-3">
                <RefreshCcw className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <p className="text-muted-foreground">7-day returns, no questions asked</p>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <p className="text-muted-foreground">Secure payments — COD or bank transfer</p>
              </div>
            </div>
          </aside>
        </div>

        {/* RECOMMENDED */}
        {recommended.length > 0 && (
          <section className="mt-20">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium mb-2">
                  You might also love
                </p>
                <h2 className="text-2xl md:text-3xl font-serif">Complete the look</h2>
              </div>
            </div>
            <div className="product-grid">
              {recommended.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function EmptyCart({ recommended }: { recommended: ProductCardData[] }) {
  return (
    <>
      <div className="container py-16 md:py-24 text-center max-w-xl">
        <div className="mb-6 inline-flex p-6 bg-secondary rounded-full">
          <ShoppingBag className="h-12 w-12 text-accent" />
        </div>
        <h1 className="text-3xl md:text-5xl font-serif text-balance mb-3">
          Your bag is waiting
        </h1>
        <p className="text-muted-foreground mb-8 text-pretty">
          Discover handpicked pieces designed to be worn for a lifetime — start with our
          bestsellers below.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link href="/products">
            <Button variant="gold" size="lg">
              <ShoppingBag className="h-4 w-4" />
              Browse All Products
            </Button>
          </Link>
          <Link href="/category/bridal-sets">
            <Button variant="outline" size="lg">View Bridal</Button>
          </Link>
        </div>
      </div>

      {recommended.length > 0 && (
        <section className="container pb-20">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium mb-2">
              Bestsellers
            </p>
            <h2 className="text-3xl font-serif">Start with these</h2>
          </div>
          <div className="product-grid">
            {recommended.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
