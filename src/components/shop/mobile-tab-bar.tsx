"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { OPEN_SEARCH_EVENT } from "./header";
import { useBump } from "@/lib/use-bump";

/**
 * Phone-only bottom tab bar: Home, Shop, Search, Bag. Hidden on product
 * pages (they have their own sticky Add-to-Bag bar) and on checkout, where
 * a second fixed bar would only crowd the form.
 */
export function MobileTabBar() {
  const pathname = usePathname() ?? "/";
  const count = useCart((s) => s.count());
  const openCart = useCart((s) => s.open);
  const bump = useBump(count);
  // Cart count lives in localStorage; render it only after mount so the
  // server HTML and first client render agree.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (/^\/products\/[^/]+/.test(pathname) || pathname.startsWith("/checkout")) return null;

  const item = "press flex flex-1 flex-col items-center justify-center gap-1 h-full text-[11px] uppercase tracking-[0.12em] font-medium transition-colors";
  const active = (on: boolean) => (on ? "text-accent" : "text-foreground/70 hover:text-foreground");

  return (
    <nav
      aria-label="Quick navigation"
      className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex h-16 items-stretch">
        <Link href="/" className={cn(item, active(pathname === "/"))} aria-current={pathname === "/" ? "page" : undefined}>
          <Home className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
          Home
        </Link>
        <Link
          href="/products"
          className={cn(item, active(pathname === "/products" || pathname.startsWith("/category")))}
          aria-current={pathname === "/products" ? "page" : undefined}
        >
          <LayoutGrid className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
          Shop
        </Link>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
          className={cn(item, active(false))}
        >
          <Search className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
          Search
        </button>
        <button
          type="button"
          onClick={openCart}
          className={cn(item, active(pathname === "/cart"), "relative")}
          aria-label={mounted && count > 0 ? `Bag, ${count} items` : "Bag"}
        >
          <span className="relative">
            <ShoppingBag className={cn("h-5 w-5", bump && "bag-bounce")} strokeWidth={1.6} aria-hidden="true" />
            {mounted && count > 0 && (
              <span className={cn("absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[11px] font-bold flex items-center justify-center", bump && "count-bump")}>
                {count}
              </span>
            )}
          </span>
          Bag
        </button>
      </div>
    </nav>
  );
}
