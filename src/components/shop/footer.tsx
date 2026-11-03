import Link from "next/link";
import { Mail, MapPin, Phone, Instagram, Facebook, Banknote, Truck, RefreshCcw, Landmark, Plus } from "lucide-react";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";
import { codLine, deliveryLine, getStorePolicy } from "@/lib/store-policy";

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
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.69a8.16 8.16 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1.84-.07Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7 0-.3-.2-1.2-.4-2.3-1.4-.9-.8-1.4-1.8-1.6-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5l.3-.5c.1-.2 0-.4-.1-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5 4.5 2.5 1 2.9.7 3.4.7.5 0 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4Zm-5.5 7.5c-1.7 0-3.4-.5-4.9-1.4l-.3-.2-3.6.9.9-3.5-.2-.4c-1-1.5-1.5-3.3-1.5-5.1 0-5.4 4.4-9.7 9.7-9.7 2.6 0 5 1 6.9 2.8 1.8 1.8 2.9 4.3 2.9 6.9-.1 5.3-4.5 9.7-9.9 9.7Zm8.2-17.9C18 1.9 15 .8 12 .8 5.5.8.2 6 .2 12.5c0 2.1.5 4.1 1.6 5.9L.1 24l5.7-1.5c1.7.9 3.6 1.4 5.5 1.4 6.5 0 11.8-5.3 11.8-11.8.1-3.1-1.1-6.1-3.4-8.3Z" />
    </svg>
  );
}

const SHOP_LINKS = [
  { href: "/products", label: "All jewellery" },
  { href: "/category/rings", label: "Rings" },
  { href: "/category/couple-rings", label: "Couple rings" },
  { href: "/category/pendant", label: "Pendants & sets" },
  { href: "/category/studs", label: "Stud earrings" },
  { href: "/category/bracelets", label: "Bracelets" },
  { href: "/category/hand-cuff", label: "Handcuffs" },
];
const HELP_LINKS = [
  { href: "/track-order", label: "Track your order" },
  { href: "/shipping", label: "Shipping & returns" },
  { href: "/faq", label: "FAQ" },
  { href: "/guides/ring-size-guide", label: "Ring size guide" },
  { href: "/guides", label: "Jewellery guides" },
  { href: "/account", label: "My account" },
];
const ABOUT_LINKS = [
  { href: "/about", label: "Our story" },
  { href: "/contact", label: "Contact us" },
];

/**
 * Footer: newsletter band, trust badges (from the live settings), link
 * columns that collapse into accordions on phones, payment methods, socials.
 */
export async function Footer() {
  const policy = await getStorePolicy();
  const socials = [
    { href: SOCIAL.instagram, label: "Instagram", icon: <Instagram className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" /> },
    { href: SOCIAL.tiktok, label: "TikTok", icon: <TikTokIcon className="h-[18px] w-[18px]" /> },
    { href: SOCIAL.facebook, label: "Facebook", icon: <Facebook className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" /> },
    { href: SOCIAL.whatsapp, label: "WhatsApp", icon: <WhatsAppIcon className="h-[18px] w-[18px]" /> },
  ];
  const trust = [
    { icon: Banknote, title: codLine(policy), sub: "Pay when your parcel arrives" },
    { icon: Truck, title: deliveryLine(policy), sub: "3–5 working days, nationwide" },
    { icon: RefreshCcw, title: `${policy.returnDays}-day returns`, sub: "On unworn pieces" },
  ];

  return (
    <footer className="mt-20 border-t border-border/70 bg-secondary/50 md:mt-28">
      {/* Newsletter band */}
      <div className="container grid grid-cols-1 gap-8 py-12 md:grid-cols-[1fr_auto] md:items-center md:py-16">
        <div className="max-w-lg">
          <p className="eyebrow-accent">The Asta list</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">New arrivals and offers, first.</h2>
          <p className="mt-2 text-sm text-muted-foreground">One email when something new lands. No spam, unsubscribe anytime.</p>
        </div>
        <NewsletterForm />
      </div>

      {/* Trust badges */}
      <div className="border-y border-border/70 bg-white/60">
        <ul className="container grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {trust.map(({ icon: Icon, title, sub }) => (
            <li key={title} className="flex items-center gap-4 py-5 sm:justify-center sm:px-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-50 to-rose-100 text-accent">
                <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-xs text-muted-foreground">{sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Brand + links */}
      <div className="container grid grid-cols-1 gap-10 py-12 md:grid-cols-12 md:py-16">
        <div className="md:col-span-4">
          <Logo variant="inline" size="md" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Stainless steel rings, pendant sets, studs and bracelets for everyday wear, delivered across Pakistan.
          </p>
          <ul className="mt-6 flex gap-2.5">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="press flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white transition-all hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-accent-foreground"
                >
                  {s.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="divide-y divide-border/70 border-y border-border/70 md:col-span-8 md:grid md:grid-cols-3 md:gap-8 md:divide-y-0 md:border-0">
          <LinkGroup title="Shop" links={SHOP_LINKS} />
          <LinkGroup title="Help" links={HELP_LINKS} />
          <div>
            <LinkGroup title="About" links={ABOUT_LINKS} />
            <ul className="hidden space-y-2.5 pt-4 text-sm text-muted-foreground md:block">
              <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Lahore, Pakistan</li>
              <li>
                <a href={`tel:${SOCIAL.phoneRaw}`} className="link-slide flex items-center gap-2 hover:text-foreground">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {SOCIAL.whatsappNumber}
                </a>
              </li>
              <li>
                <a href="mailto:astacollection14@gmail.com" className="link-slide flex items-center gap-2 break-all hover:text-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> astacollection14@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment + bottom bar */}
      <div className="border-t border-border/70 bg-white">
        <div className="container flex flex-col gap-4 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-medium uppercase tracking-[0.16em] text-foreground/70">We accept</span>
            {policy.codEnabled && (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 font-medium text-foreground/80">
                <Banknote className="h-3.5 w-3.5" aria-hidden="true" /> Cash on delivery
              </span>
            )}
            {policy.bankEnabled && (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 font-medium text-foreground/80">
                <Landmark className="h-3.5 w-3.5" aria-hidden="true" /> Bank transfer
              </span>
            )}
          </div>
          <p className="flex flex-wrap items-center gap-3 md:justify-end">
            <span>© {new Date().getFullYear()} Asta Collections</span>
            <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
            <Link href="/admin/login" className="link-slide hover:text-foreground">Admin</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

/** A link column; on phones it is a native accordion so the footer stays short. */
function LinkGroup({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <>
      <details className="group md:hidden">
        <summary className="flex h-14 cursor-pointer list-none items-center justify-between text-sm font-semibold uppercase tracking-[0.16em]">
          {title}
          <Plus className="h-4 w-4 transition-transform group-open:rotate-45" aria-hidden="true" />
        </summary>
        <ul className="pb-4">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex min-h-[44px] items-center text-sm text-muted-foreground hover:text-foreground">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </details>
      <div className="hidden md:block">
        <p className="eyebrow-accent mb-4">{title}</p>
        <ul className="space-y-2.5 text-sm">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="link-slide text-muted-foreground transition-colors hover:text-foreground">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
