"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, ShoppingBag, Search, X, User } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { CartDrawer } from "./cart-drawer";
import { SearchOverlay } from "./search-overlay";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/products", label: "Shop All" },
  { href: "/category/rings", label: "Rings" },
  { href: "/category/necklaces", label: "Necklaces" },
  { href: "/category/earrings", label: "Earrings" },
  { href: "/category/bracelets", label: "Bracelets" },
  { href: "/category/bridal-sets", label: "Bridal" },
];

export function Header() {
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
      {/* Announcement bar */}
      <div className="bg-foreground text-background text-[10px] uppercase tracking-[0.3em] py-2.5 px-4 text-center font-medium">
        <span className="hidden md:inline">Free shipping above Rs. 5,000 · </span>
        COD across Pakistan · Use{" "}
        <span className="text-rose-300 font-bold">WELCOME10</span> for 10% off
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

          {/* LOGO LEFT — mark + ASTACOLLECTIONS wordmark next to it */}
          <div className="flex-1 lg:flex-initial flex justify-center lg:justify-start">
            <Logo size="md" className="md:hidden" />
            <Logo size="lg" className="hidden md:inline-flex" />
          </div>

          {/* Desktop nav — center */}
          <nav className="hidden lg:flex items-center gap-9 flex-1 justify-center">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs uppercase tracking-[0.22em] font-medium text-foreground/85 hover:text-accent transition-colors link-grow"
              >
                {l.label}
              </Link>
            ))}
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
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobile(false)}
                  className="py-3 text-sm uppercase tracking-[0.2em] font-medium hover:text-accent border-b border-border/40 last:border-0 transition-colors"
                >
                  {l.label}
                </Link>
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
