import Link from "next/link";
import { Mail, MapPin, Phone, Send, Instagram, Facebook } from "lucide-react";
import { Logo } from "./logo";

// Real social URLs
export const SOCIAL = {
  instagram: "https://www.instagram.com/astacollections",
  facebook: "https://www.facebook.com/share/1JaNNBZn93/",
  tiktok: "https://www.tiktok.com/@astacollections",
  whatsapp: "https://wa.me/923264348024",
  whatsappNumber: "+92 326 4348024",
  phoneRaw: "+923264348024",
};

// Custom TikTok icon (lucide doesn't ship one)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.69a8.16 8.16 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1.84-.07Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="mt-32 bg-secondary/50 border-t border-border/70">
      {/* Brand strip — large prominent logo */}
      <div className="container pt-16 md:pt-20 pb-10 text-center border-b border-border/60">
        <Logo variant="footer" size="2xl" className="mx-auto" />
        <p className="mt-5 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Timeless jewellery handcrafted with care — pieces designed to be worn for a lifetime,
          treasured for generations.
        </p>
      </div>

      <div className="container py-16 grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8">
        {/* Brand socials — left column without logo (logo is now on top strip) */}
        <div className="col-span-2 md:col-span-4 space-y-5">
          <p className="eyebrow-accent">Follow our journey</p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            New arrivals, behind-the-scenes, and styling on Instagram, TikTok and Facebook.
          </p>
          <div className="flex gap-2 pt-1">
            <a
              href={SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-border bg-white hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all hover:-translate-y-0.5"
            >
              <Instagram className="h-4 w-4" strokeWidth={1.6} />
            </a>
            <a
              href={SOCIAL.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-border bg-white hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all hover:-translate-y-0.5"
            >
              <Facebook className="h-4 w-4" strokeWidth={1.6} />
            </a>
            <a
              href={SOCIAL.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-border bg-white hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all hover:-translate-y-0.5"
            >
              <TikTokIcon className="h-4 w-4" />
            </a>
            <a
              href={SOCIAL.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-border bg-white hover:bg-green-600 hover:text-white hover:border-green-600 transition-all hover:-translate-y-0.5"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7 0-.3-.2-1.2-.4-2.3-1.4-.9-.8-1.4-1.8-1.6-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5l.3-.5c.1-.2 0-.4-.1-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5 4.5 2.5 1 2.9.7 3.4.7.5 0 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4Zm-5.5 7.5c-1.7 0-3.4-.5-4.9-1.4l-.3-.2-3.6.9.9-3.5-.2-.4c-1-1.5-1.5-3.3-1.5-5.1 0-5.4 4.4-9.7 9.7-9.7 2.6 0 5 1 6.9 2.8 1.8 1.8 2.9 4.3 2.9 6.9-.1 5.3-4.5 9.7-9.9 9.7Zm8.2-17.9C18 1.9 15 .8 12 .8 5.5.8.2 6 .2 12.5c0 2.1.5 4.1 1.6 5.9L.1 24l5.7-1.5c1.7.9 3.6 1.4 5.5 1.4 6.5 0 11.8-5.3 11.8-11.8.1-3.1-1.1-6.1-3.4-8.3Z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Newsletter */}
        <div className="col-span-2 md:col-span-4 md:order-3">
          <p className="eyebrow-accent mb-3">Newsletter</p>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            Be the first to hear about new arrivals and private sales.
          </p>
          <form className="flex bg-white border border-border rounded-full overflow-hidden focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all max-w-sm">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 h-11 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="bg-accent text-accent-foreground px-5 hover:bg-accent/90 transition-colors flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] font-semibold"
            >
              Join
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {/* Shop */}
        <div className="md:col-span-2">
          <p className="eyebrow-accent mb-4">Shop</p>
          <ul className="space-y-2.5 text-sm">
            <FootLink href="/products">All Products</FootLink>
            <FootLink href="/category/rings">Rings</FootLink>
            <FootLink href="/category/necklaces">Necklaces</FootLink>
            <FootLink href="/category/earrings">Earrings</FootLink>
            <FootLink href="/category/bridal-sets">Bridal Sets</FootLink>
          </ul>
        </div>

        {/* Help */}
        <div className="md:col-span-2">
          <p className="eyebrow-accent mb-4">Help</p>
          <ul className="space-y-2.5 text-sm">
            <FootLink href="/account">My Account</FootLink>
            <FootLink href="/track-order">Track Order</FootLink>
            <FootLink href="/about">About Us</FootLink>
            <FootLink href="/shipping">Shipping & Returns</FootLink>
            <FootLink href="/faq">FAQ</FootLink>
            <FootLink href="/contact">Contact</FootLink>
          </ul>
        </div>
      </div>

      {/* Contact strip */}
      <div className="border-t border-border/70 bg-white">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Lahore, Pakistan</span>
            <a href={`tel:${SOCIAL.phoneRaw}`} className="flex items-center gap-1.5 hover:text-accent transition-colors">
              <Phone className="h-3 w-3" /> {SOCIAL.whatsappNumber}
            </a>
            <a href="mailto:astacollection14@gmail.com" className="flex items-center gap-1.5 hover:text-accent transition-colors">
              <Mail className="h-3 w-3" /> astacollection14@gmail.com
            </a>
          </div>
          <p className="text-muted-foreground flex items-center gap-3">
            <span>© {new Date().getFullYear()} Asta Collections</span>
            <span className="h-1 w-1 rounded-full bg-accent" />
            <Link href="/admin/login" className="hover:text-accent transition-colors">Admin</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FootLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-muted-foreground hover:text-accent transition-colors hover:translate-x-0.5 inline-block"
      >
        {children}
      </Link>
    </li>
  );
}
