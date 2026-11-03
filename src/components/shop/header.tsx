"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, ShoppingBag, Search, X, User, ChevronDown, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { CartDrawer } from "./cart-drawer";
import { SearchOverlay } from "./search-overlay";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

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
};

/** Event other components dispatch to open the search overlay (e.g. the mobile tab bar). */
export const OPEN_SEARCH_EVENT = "asta:open-search";

export function Header({
  announcementText = "Free shipping above Rs. 5,000 · COD across Pakistan",
  announcementCode = "WELCOME10",
  navItems,
  collections = [],
}: HeaderProps = {}) {
  const imageFor = (href: string) => collections.find((c) => c.href === href)?.image ?? null;
  const topCollections = collections.filter((c) => c.topLevel && c.image);
  const NAV_LINKS = navItems && navItems.length > 0 ? navItems : FALLBACK_NAV;
  const count = useCart((s) => s.count());
  const open = useCart((s) => s.open);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
      <div className="bg-foreground text-background text-[10px] uppercase tracking-[0.3em] py-2.5 px-4 text-center font-medium">
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
        <div className="container flex items-center justify-between gap-4 py-4 md:py-5">
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
              1024–1279px and the text ran under the first nav links. */}
          <div className="flex-1 lg:flex-initial lg:shrink-0 flex justify-center lg:justify-start min-w-0">
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
              <ShoppingBag className="h-5 w-5" strokeWidth={1.6} />
              {count > 0 && (
                <span className="absolute top-1 right-1 bg-accent text-accent-foreground rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold px-1 animate-in zoom-in duration-200">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobile && (
          <nav id="mobile-nav" aria-label="Main menu" className="lg:hidden border-t border-border/60 bg-white animate-in slide-in-from-top-2 duration-300">
            <div className="container py-6 flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <div key={l.id} className="border-b border-border/40 last:border-0">
                  <Link
                    href={l.href}
                    target={l.openInNewTab ? "_blank" : undefined}
                    onClick={() => setMobile(false)}
                    className="block py-3 text-sm uppercase tracking-[0.2em] font-medium hover:text-accent transition-colors"
                  >
                    {l.label}
                  </Link>
                  {l.children && l.children.length > 0 && (
                    <div className="pb-4 grid grid-cols-2 gap-2">
                      {l.children.map((c) => {
                        const img = imageFor(c.href) ?? imageFor(l.href);
                        return (
                          <Link
                            key={c.id}
                            href={c.href}
                            target={c.openInNewTab ? "_blank" : undefined}
                            onClick={() => setMobile(false)}
                            className="flex items-center gap-2.5 rounded-xl border border-border/60 p-1.5 pr-2 min-w-0 hover:border-accent transition-colors"
                          >
                            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
                              {img && <Image src={img} alt="" fill sizes="40px" className="object-cover" />}
                            </span>
                            <span className="text-[11px] uppercase tracking-[0.12em] leading-tight text-foreground/80 min-w-0">
                              {c.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex flex-wrap gap-x-5 gap-y-3 pt-6 text-xs uppercase tracking-[0.2em]">
                <Link href="/account" onClick={() => setMobile(false)} className="text-muted-foreground hover:text-foreground transition-colors">My Account</Link>
                <Link href="/track-order" onClick={() => setMobile(false)} className="text-muted-foreground hover:text-foreground transition-colors">Track Order</Link>
                <Link href="/about" onClick={() => setMobile(false)} className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
                <Link href="/contact" onClick={() => setMobile(false)} className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
                <Link href="/faq" onClick={() => setMobile(false)} className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
              </div>
            </div>
          </nav>
        )}
      </header>

      <SearchOverlay open={search} onClose={() => setSearch(false)} />
      <CartDrawer />
    </>
  );
}
