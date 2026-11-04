"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, ShoppingBag, Search, X, User, ChevronDown, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { CartDrawer, type DrawerDelivery } from "./cart-drawer";
import { SearchOverlay } from "./search-overlay";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { useBump } from "@/lib/use-bump";

type NavNode = {
  id: string;
  label: string;
  href: string;
  openInNewTab: boolean;
  children: NavNode[];
};

const FALLBACK_NAV: NavNode[] = [
  { id: "fallback-1", label: "Shop All", href: "/products", openInNewTab: false, children: [] },
  { id: "fallback-2", label: "Rings", href: "/category/rings", openInNewTab: false, children: [] },
  { id: "fallback-3", label: "Pendants", href: "/category/pendant", openInNewTab: false, children: [] },
  { id: "fallback-4", label: "Earrings", href: "/category/earrings", openInNewTab: false, children: [] },
  { id: "fallback-5", label: "Bracelets", href: "/category/bracelets", openInNewTab: false, children: [] },
  { id: "fallback-6", label: "Couple Rings", href: "/category/couple-rings", openInNewTab: false, children: [] },
];

/** Collection thumbnails for the mega menu, keyed by `/category/<slug>` href. */
export type HeaderCollection = { href: string; name: string; image: string | null; topLevel: boolean };

type HeaderProps = {
  announcementText?: string;
  announcementCode?: string;
  navItems?: NavNode[];
  collections?: HeaderCollection[];
  /** Delivery terms for the bag drawer (display only). */
  delivery?: DrawerDelivery;
};

/** Event other components dispatch to open the search overlay (e.g. the mobile tab bar). */
export const OPEN_SEARCH_EVENT = "asta:open-search";

export function Header({
  announcementText = "Free shipping above Rs. 5,000 · COD across Pakistan",
  announcementCode = "WELCOME10",
  navItems,
  collections = [],
  delivery,
}: HeaderProps = {}) {
  const imageFor = (href: string) => collections.find((c) => c.href === href)?.image ?? null;
  const topCollections = collections.filter((c) => c.topLevel && c.image);
  const NAV_LINKS = navItems && navItems.length > 0 ? navItems : FALLBACK_NAV;
  const count = useCart((s) => s.count());
  const open = useCart((s) => s.open);
  const bump = useBump(count);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Mobile menu: lock page scroll and close on Escape while open.
  useEffect(() => {
    if (!mobile) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobile(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [mobile]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch(true);
      }
    };
    const onOpenSearch = () => setSearch(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpenSearch);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpenSearch);
    };
  }, []);

  return (
    <>
      {/* Announcement bar — admin-editable from /admin/content */}
      <div className="bg-foreground text-background text-[11px] uppercase tracking-[0.3em] py-2.5 px-4 text-center font-medium">
        {announcementText}
        {announcementCode && (
          <>
            {" · Use "}
            <span className="text-rose-300 font-bold">{announcementCode}</span>
            {" for 10% off"}
          </>
        )}
      </div>

      <header
        className={cn(
          "sticky top-0 z-40 transition-all duration-500",
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-border/60 shadow-[0_2px_20px_-12px_rgba(40,20,15,0.12)]"
            : "bg-white border-b border-transparent"
        )}
      >
        {/* Top utility row — desktop only */}
        <div className="hidden lg:block border-b border-border/40">
          <div className="container flex h-9 items-center justify-between text-[11px] text-muted-foreground">
            <span className="tracking-[0.18em] uppercase">Crafted with care · Made in Pakistan</span>
            <div className="flex items-center gap-5 tracking-[0.18em] uppercase">
              <Link href="/track-order" className="hover:text-accent transition-colors">Track Order</Link>
              <Link href="/about" className="hover:text-accent transition-colors">About</Link>
              <Link href="/contact" className="hover:text-accent transition-colors">Contact</Link>
              <Link href="/faq" className="hover:text-accent transition-colors">FAQ</Link>
            </div>
          </div>
        </div>

        {/* Main header — logo LEFT + nav center + utility right */}
        <div className="container relative flex items-center justify-between gap-4 py-4 md:py-5">
          <button
            className="lg:hidden -ml-2 p-2 transition-transform active:scale-95"
            onClick={() => setMobile(!mobile)}
            aria-label={mobile ? "Close menu" : "Open menu"}
            aria-expanded={mobile}
            aria-controls="mobile-nav"
          >
            {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* LOGO LEFT — mark only on small phones, mark + wordmark from sm up */}
          {/* lg:shrink-0 — with min-w-0 alone the box shrank below the wordmark at
              1024–1279px and the text ran under the first nav links.
              Below lg it's centred on the screen itself: the icons either side
              differ in width, so centring between them sits left of true centre. */}
          <div className="max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2 lg:shrink-0 flex justify-start min-w-0">
            {/* Phones < 640px: just the mark (saves space, prevents overlap with cart) */}
            <Logo variant="mark" size="md" className="sm:hidden" />
            {/* sm – md: mark + wordmark, smaller */}
            <Logo variant="inline" size="md" className="hidden sm:inline-flex md:hidden" />
            {/* Tablets: mark + wordmark. 1024-1279px: mark only, so the full nav
                fits on one line. 1280px+: mark + wordmark again. */}
            <Logo variant="inline" size="md" className="hidden md:inline-flex lg:hidden xl:inline-flex 2xl:hidden" />
            <Logo variant="mark" size="md" className="hidden lg:inline-flex xl:hidden" />
            <Logo variant="inline" size="lg" className="hidden 2xl:inline-flex" />
          </div>

          {/* Desktop nav: one line from 1024px up (nowrap + tighter tracking on
              narrow desktops). Items with children open a mega panel with
              collection thumbnails; "Shop All" opens every top collection. */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 2xl:gap-8 flex-1 justify-center min-w-0">
            {NAV_LINKS.map((l) => {
              const isShopAll = l.href === "/products" && (!l.children || l.children.length === 0);
              const panel =
                l.children && l.children.length > 0
                  ? l.children.map((c) => ({ key: c.id, href: c.href, label: c.label, image: imageFor(c.href), newTab: c.openInNewTab }))
                  : isShopAll
                    ? topCollections.map((c) => ({ key: c.href, href: c.href, label: c.name, image: c.image, newTab: false }))
                    : [];
              const linkCls =
                "inline-flex items-center gap-1 whitespace-nowrap text-[11px] xl:text-xs uppercase tracking-[0.12em] xl:tracking-[0.18em] font-medium text-foreground/85 hover:text-accent transition-colors link-grow";
              if (panel.length === 0) {
                return (
                  <Link
                    key={l.id}
                    href={l.href}
                    target={l.openInNewTab ? "_blank" : undefined}
                    rel={l.openInNewTab ? "noopener noreferrer" : undefined}
                    className={linkCls}
                  >
                    {l.label}
                  </Link>
                );
              }
              const parentImage = imageFor(l.href);
              return (
                <div key={l.id} className="relative group/menu">
                  <Link
                    href={l.href}
                    target={l.openInNewTab ? "_blank" : undefined}
                    rel={l.openInNewTab ? "noopener noreferrer" : undefined}
                    className={linkCls}
                    aria-haspopup="true"
                  >
                    {l.label}
                    <ChevronDown className="inline-block align-[-1px] ml-1 h-3 w-3 transition-transform group-hover/menu:rotate-180" aria-hidden="true" />
                  </Link>
                  {/* Mega panel: opens on hover and on keyboard focus within */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 opacity-0 invisible translate-y-1 group-hover/menu:opacity-100 group-hover/menu:visible group-hover/menu:translate-y-0 group-focus-within/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:translate-y-0 transition-all duration-200 z-50">
                    <div
                      className="bg-white border border-border/70 rounded-2xl shadow-[0_24px_60px_-20px_rgba(40,20,15,0.25)] p-4 max-w-[80vw]"
                      style={{ width: Math.min(panel.length, 3) * 180 + 32 }}
                    >
                      <ul
                        className="grid gap-3"
                        style={{ gridTemplateColumns: `repeat(${Math.min(panel.length, 3)}, minmax(0, 1fr))` }}
                      >
                        {panel.map((c) => {
                          const img = c.image ?? parentImage;
                          return (
                            <li key={c.key}>
                              <Link
                                href={c.href}
                                target={c.newTab ? "_blank" : undefined}
                                rel={c.newTab ? "noopener noreferrer" : undefined}
                                className="group/item block"
                              >
                                <span className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-secondary">
                                  {img && (
                                    <Image
                                      src={img}
                                      alt=""
                                      fill
                                      sizes="200px"
                                      className="object-cover transition-transform duration-500 group-hover/item:scale-[1.06]"
                                    />
                                  )}
                                </span>
                                <span className="mt-2 block text-[11px] uppercase tracking-[0.16em] font-medium group-hover/item:text-accent transition-colors">
                                  {c.label}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                      <Link
                        href={l.href}
                        className="mt-4 flex items-center justify-between rounded-xl bg-secondary/70 px-4 py-3 text-xs uppercase tracking-[0.18em] font-semibold hover:bg-secondary transition-colors"
                      >
                        {isShopAll ? "Shop all jewellery" : `All ${l.label.toLowerCase()}`}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Right utility */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => setSearch(true)}
              aria-label="Search"
              className="p-2 hover:text-accent transition-all hover:scale-110 active:scale-95"
            >
              <Search className="h-5 w-5" strokeWidth={1.6} />
            </button>
            <Link
              href="/account"
              className="hidden md:flex p-2 hover:text-accent transition-all hover:scale-110 active:scale-95"
              aria-label="My Account"
            >
              <User className="h-5 w-5" strokeWidth={1.6} />
            </Link>
            <button
              onClick={open}
              className="relative p-2 hover:text-accent transition-all hover:scale-110 active:scale-95"
              aria-label={`Cart with ${count} items`}
            >
              <ShoppingBag className={cn("h-5 w-5", bump && "bag-bounce")} strokeWidth={1.6} />
              {count > 0 && (
                <span className={cn("absolute top-1 right-1 bg-accent text-accent-foreground rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[11px] font-bold px-1", bump && "count-bump")}>
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>


      </header>

      {/* Mobile menu: slide-in sheet from the left with an overlay */}
      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={() => setMobile(false)} aria-hidden />
          <nav
            id="mobile-nav"
            aria-label="Main menu"
            className="absolute inset-y-0 left-0 flex w-[86vw] max-w-sm flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-300 ease-out"
          >
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
              <span className="flex items-center gap-3">
                <Logo variant="mark" size="sm" />
                <span className="font-serif text-xl">Menu</span>
              </span>
              <button
                type="button"
                onClick={() => setMobile(false)}
                aria-label="Close menu"
                className="press flex h-11 w-11 items-center justify-center rounded-full border border-border"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              <ul>
                {NAV_LINKS.map((l) => (
                  <li key={l.id} className="border-b border-border/50 last:border-0">
                    <Link
                      href={l.href}
                      target={l.openInNewTab ? "_blank" : undefined}
                      onClick={() => setMobile(false)}
                      className="flex min-h-[52px] items-center justify-between font-serif text-xl transition-colors hover:text-accent"
                    >
                      {l.label}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </Link>
                    {l.children && l.children.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 pb-4">
                        {l.children.map((c) => {
                          const img = imageFor(c.href) ?? imageFor(l.href);
                          return (
                            <Link
                              key={c.id}
                              href={c.href}
                              target={c.openInNewTab ? "_blank" : undefined}
                              onClick={() => setMobile(false)}
                              className="press flex min-h-[52px] min-w-0 items-center gap-2.5 rounded-xl border border-border/60 p-1.5 pr-2 transition-colors hover:border-accent"
                            >
                              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
                                {img && <Image src={img} alt="" fill sizes="40px" className="object-cover" />}
                              </span>
                              <span className="min-w-0 text-xs leading-tight text-foreground/85">{c.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-border/70 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 text-sm">
              {[
                { href: "/account", label: "My account" },
                { href: "/track-order", label: "Track order" },
                { href: "/faq", label: "FAQ" },
                { href: "/contact", label: "Contact" },
              ].map((x) => (
                <Link
                  key={x.href}
                  href={x.href}
                  onClick={() => setMobile(false)}
                  className="flex min-h-[44px] items-center rounded-xl bg-secondary/60 px-3 text-foreground/85"
                >
                  {x.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}


      <SearchOverlay open={search} onClose={() => setSearch(false)} />
      <CartDrawer delivery={delivery} />
    </>
  );
}
