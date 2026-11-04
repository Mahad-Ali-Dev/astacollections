"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { OPEN_SEARCH_EVENT } from "./header";
import { useBump } from "@/lib/use-bump";

// Fixed sizes the slide is calculated from: 15px padding either side of a 20px
// icon, in a bar with 7px padding and four items spread evenly.
const ITEM = 50;
const BAR_PADDING = 7;
const ORDER = ["home", "shop", "search", "bag"] as const;
type LabelKey = "home" | "shop" | "bag";

const EASE = "duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] motion-reduce:transition-none";

/**
 * Phone-only floating menu: Home, Shop, Search, Bag. Hidden on product pages
 * (they have their own sticky Add-to-Bag bar) and on checkout, where a second
 * fixed bar would only crowd the form.
 *
 * The cream lozenge slides to the active item while its label opens and the old
 * one closes. It moves on tap, because the URL only changes once the server has
 * sent the new page. Search and Bag open overlays, so they don't move it.
 * Until measured (first paint, or no JS) the active item carries its own cream.
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

  const hidden = /^\/products\/[^/]+/.test(pathname) || pathname.startsWith("/checkout");

  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => setPending(null), [pathname]);
  const at = pending ?? pathname;
  const go = (href: string) => () => {
    if (href !== pathname) setPending(href);
  };

  const nav = useRef<HTMLElement>(null);
  const labels = useRef<Partial<Record<LabelKey, HTMLSpanElement | null>>>({});
  const [size, setSize] = useState<{ bar: number; label: Record<LabelKey, number> } | null>(null);
  // Off for the first placement, so the lozenge doesn't fly in from the edge.
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const el = nav.current;
    if (!el) {
      setSize(null);
      setAnimate(false);
      return;
    }
    const measure = () =>
      setSize({
        bar: el.clientWidth,
        label: {
          home: labels.current.home?.offsetWidth ?? 0,
          shop: labels.current.shop?.offsetWidth ?? 0,
          bag: labels.current.bag?.offsetWidth ?? 0,
        },
      });
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [hidden]);

  const active: LabelKey | null =
    at === "/" ? "home" : at === "/products" || at.startsWith("/category") ? "shop" : at === "/cart" ? "bag" : null;

  // On pages with no active item (About, say) the lozenge fades out where it was.
  const [lozengeKey, setLozengeKey] = useState(active);
  if (active && active !== lozengeKey) setLozengeKey(active);

  if (hidden) return null;

  // Where the lozenge sits: the bar spreads its items evenly, so each one's left
  // edge follows from the active label's width.
  let lozenge: { left: number; width: number } | null = null;
  if (size && lozengeKey) {
    const labelWidth = size.label[lozengeKey];
    const gap = (size.bar - BAR_PADDING * 2 - ITEM * ORDER.length - labelWidth) / (ORDER.length - 1);
    lozenge = { left: BAR_PADDING + ORDER.indexOf(lozengeKey) * (ITEM + gap), width: ITEM + labelWidth };
  }

  const item = (on: boolean) =>
    cn(
      "press relative z-10 flex h-[46px] items-center rounded-full px-[15px] text-xs font-medium transition-colors",
      EASE,
      on ? "text-foreground" : "text-background/85 hover:text-background",
      on && !size && "bg-cream"
    );

  const label = (key: LabelKey, text: string) => {
    const on = active === key;
    return (
      <span
        aria-hidden="true"
        className={cn("block overflow-hidden whitespace-nowrap transition-[width,opacity]", EASE, on ? "opacity-100" : "opacity-0", !on && !size && "w-0")}
        style={size ? { width: on ? size.label[key] : 0 } : undefined}
      >
        <span
          ref={(el) => {
            labels.current[key] = el;
          }}
          className="inline-block pl-2"
        >
          {text}
        </span>
      </span>
    );
  };

  return (
    <nav
      ref={nav}
      aria-label="Quick navigation"
      className="md:hidden fixed inset-x-3.5 bottom-[calc(0.875rem+env(safe-area-inset-bottom))] z-30 flex h-[60px] items-center justify-between rounded-full bg-foreground px-[7px] shadow-[0_10px_24px_rgba(0,0,0,0.33)]"
    >
      {lozenge && (
        <span
          aria-hidden="true"
          className={cn("absolute left-0 top-[7px] h-[46px] rounded-full bg-cream", animate && "transition-[transform,width,opacity]", EASE)}
          style={{ width: lozenge.width, transform: `translateX(${lozenge.left}px)`, opacity: active ? 1 : 0 }}
        />
      )}
      <Link
        href="/"
        onClick={go("/")}
        className={item(active === "home")}
        aria-label="Home"
        aria-current={pathname === "/" ? "page" : undefined}
      >
        <Home className="h-5 w-5 shrink-0" strokeWidth={1.6} aria-hidden="true" />
        {label("home", "Home")}
      </Link>
      <Link
        href="/products"
        onClick={go("/products")}
        className={item(active === "shop")}
        aria-label="Shop"
        aria-current={pathname === "/products" ? "page" : undefined}
      >
        <LayoutGrid className="h-5 w-5 shrink-0" strokeWidth={1.6} aria-hidden="true" />
        {label("shop", "Shop")}
      </Link>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
        className={item(false)}
        aria-label="Search"
      >
        <Search className="h-5 w-5 shrink-0" strokeWidth={1.6} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={openCart}
        className={item(active === "bag")}
        aria-label={mounted && count > 0 ? `Bag, ${count} items` : "Bag"}
      >
        <span className="relative shrink-0">
          <ShoppingBag className={cn("h-5 w-5", bump && "bag-bounce")} strokeWidth={1.6} aria-hidden="true" />
          {mounted && count > 0 && (
            <span className={cn("absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[11px] font-bold flex items-center justify-center", bump && "count-bump")}>
              {count}
            </span>
          )}
        </span>
        {label("bag", "Bag")}
      </button>
    </nav>
  );
}
