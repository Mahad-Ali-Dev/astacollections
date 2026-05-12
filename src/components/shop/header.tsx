"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, ShoppingBag, Search, X, User, ChevronDown } from "lucide-react";
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
  { id: "fallback-3", label: "Necklaces", href: "/category/necklaces", openInNewTab: false, children: [] },
  { id: "fallback-4", label: "Earrings", href: "/category/earrings", openInNewTab: false, children: [] },
  { id: "fallback-5", label: "Bracelets", href: "/category/bracelets", openInNewTab: false, children: [] },
  { id: "fallback-6", label: "Bridal", href: "/category/bridal-sets", openInNewTab: false, children: [] },
];

type HeaderProps = {
  announcementText?: string;
  announcementCode?: string;
  navItems?: NavNode[];
};

export function Header({
  announcementText = "Free shipping above Rs. 5,000 · COD across Pakistan",
  announcementCode = "WELCOME10",
  navItems,
}: HeaderProps = {}) {
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
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
            aria-label="Toggle menu"
          >
            {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* LOGO LEFT — mark only on small phones, mark + wordmark from sm up */}
          <div className="flex-1 lg:flex-initial flex justify-center lg:justify-start min-w-0">
            {/* Phones < 640px: just the mark (saves space, prevents overlap with cart) */}
            <Logo variant="mark" size="md" className="sm:hidden" />
            {/* sm – md: mark + wordmark, smaller */}
            <Logo variant="inline" size="md" className="hidden sm:inline-flex md:hidden" />
            {/* md+: full big version */}
            <Logo variant="inline" size="lg" className="hidden md:inline-flex" />
          </div>

          {/* Desktop nav — center, with dropdowns for items that have children */}
          <nav className="hidden lg:flex items-center gap-9 flex-1 justify-center">
            {NAV_LINKS.map((l) =>
              l.children && l.children.length > 0 ? (
                <div key={l.id} className="relative group">
                  <Link
                    href={l.href}
                    target={l.openInNewTab ? "_blank" : undefined}
                    rel={l.openInNewTab ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.22em] font-medium text-foreground/85 hover:text-accent transition-colors link-grow"
                  >
                    {l.label}
                    <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180" />
                  </Link>
                  {/* Dropdown */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[200px]">
                    <div className="bg-white border border-border/70 rounded-xl shadow-xl py-2">
                      {l.children.map((c) => (
                        <Link
                          key={c.id}
                          href={c.href}
                          target={c.openInNewTab ? "_blank" : undefined}
                          rel={c.openInNewTab ? "noopener noreferrer" : undefined}
                          className="block px-4 py-2.5 text-xs uppercase tracking-[0.18em] font-medium hover:bg-accent/10 hover:text-accent transition-colors whitespace-nowrap"
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={l.id}
                  href={l.href}
                  target={l.openInNewTab ? "_blank" : undefined}
                  rel={l.openInNewTab ? "noopener noreferrer" : undefined}
                  className="text-xs uppercase tracking-[0.22em] font-medium text-foreground/85 hover:text-accent transition-colors link-grow"
                >
                  {l.label}
                </Link>
              )
            )}
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
          <nav className="lg:hidden border-t border-border/60 bg-white animate-in slide-in-from-top-2 duration-300">
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
                    <div className="pb-3 pl-4 flex flex-col gap-1">
                      {l.children.map((c) => (
                        <Link
                          key={c.id}
                          href={c.href}
                          target={c.openInNewTab ? "_blank" : undefined}
                          onClick={() => setMobile(false)}
                          className="py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-accent transition-colors"
                        >
                          ↳ {c.label}
                        </Link>
                      ))}
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
