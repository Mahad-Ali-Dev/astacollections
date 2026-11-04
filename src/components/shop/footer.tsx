import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Plus } from "lucide-react";
import { NewsletterForm } from "./newsletter-form";

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
  { href: "/about", label: "Our story" },
];

const SOCIALS = [
  { href: SOCIAL.instagram, label: "Instagram", icon: <Instagram className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" /> },
  { href: SOCIAL.tiktok, label: "TikTok", icon: <TikTokIcon className="h-[18px] w-[18px]" /> },
  { href: SOCIAL.facebook, label: "Facebook", icon: <Facebook className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" /> },
  { href: SOCIAL.whatsapp, label: "WhatsApp", icon: <WhatsAppIcon className="h-[18px] w-[18px]" /> },
];

const linkClass = "flex min-h-[44px] items-center text-sm text-[#f3e7da] transition-colors hover:text-white lg:min-h-[32px]";

/**
 * Dark footer. Below lg: centred logo and sign-up, folding sections,
 * socials, copyright. From lg: logo and sign-up on the left, three open lists
 * on the right, then copyright left and socials right.
 * The logo is flattened to white until a white-and-rose file exists, and loads
 * lazily because the file is large. Bottom padding clears the floating buttons.
 */
export function Footer() {
  const contact = (
    <ul>
      <li><Link href="/contact" className={linkClass}>Contact us</Link></li>
      <li><a href={`tel:${SOCIAL.phoneRaw}`} className={linkClass}>{SOCIAL.whatsappNumber}</a></li>
      <li><a href="mailto:astacollection14@gmail.com" className={`${linkClass} break-all`}>astacollection14@gmail.com</a></li>
      <li className={linkClass}>Lahore, Pakistan</li>
    </ul>
  );

  return (
    <footer className="mt-10 bg-footer pb-[calc(9rem+env(safe-area-inset-bottom))] text-[#f8f1e9] md:mt-16 md:pb-10 lg:pb-24">
      <div className="container pt-10 lg:pt-14">
        <div className="lg:grid lg:grid-cols-[1.25fr_3fr] lg:gap-10">
          <div className="min-w-0">
            <Link href="/" aria-label="Asta Collections home" className="mx-auto block w-fit lg:mx-0">
              <Image src="/footer_logo.svg" alt="Asta Collections" width={165} height={126} className="brightness-0 invert" />
            </Link>
            <div className="mx-auto mt-6 flex max-w-md justify-center lg:mx-0 lg:max-w-[340px] lg:justify-start">
              <NewsletterForm />
            </div>
          </div>

          <div className="mt-6 divide-y divide-[#efe2d4]/30 border-y border-[#efe2d4]/30 lg:mt-0 lg:grid lg:grid-cols-3 lg:gap-10 lg:divide-y-0 lg:border-0">
            <FooterSection title="Shop"><LinkList links={SHOP_LINKS} /></FooterSection>
            <FooterSection title="Help"><LinkList links={HELP_LINKS} /></FooterSection>
            <FooterSection title="Contact">{contact}</FooterSection>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse items-center gap-5 lg:mt-10 lg:flex-row lg:justify-between lg:border-t lg:border-[#efe2d4]/30 lg:pt-6">
          <p className="text-xs text-[#f3e7da] lg:text-sm">© {new Date().getFullYear()} Asta Collections</p>
          <ul className="flex gap-2.5">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="press flex h-11 w-11 items-center justify-center rounded-full border border-[#efe2d4]/80 transition-colors hover:border-white hover:text-white"
                >
                  {s.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function LinkList({ links }: { links: { href: string; label: string }[] }) {
  return (
    <ul>
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className={linkClass}>{l.label}</Link>
        </li>
      ))}
    </ul>
  );
}

/** A native accordion below lg, so keyboard and screen readers work unaided. An open column from lg. */
function FooterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <details className="group lg:hidden">
        <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between text-sm [&::-webkit-details-marker]:hidden">
          {title}
          <Plus className="h-4 w-4 transition-transform group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true" />
        </summary>
        <div className="pb-3">{children}</div>
      </details>
      <div className="hidden lg:block">
        <p className="mb-2 text-sm font-semibold text-white">{title}</p>
        {children}
      </div>
    </div>
  );
}
