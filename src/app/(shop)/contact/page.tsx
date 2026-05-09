import { Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SOCIAL } from "@/components/shop/footer";

export const metadata = {
  title: "Contact Us — Phone, Email, WhatsApp",
  description:
    "Get in touch with Asta Collections. WhatsApp +92 326 4348024 · contact@astacollections.com · Karachi, Pakistan. We reply within hours.",
};

// TikTok inline icon
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.69a8.16 8.16 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1.84-.07Z" />
    </svg>
  );
}
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7 0-.3-.2-1.2-.4-2.3-1.4-.9-.8-1.4-1.8-1.6-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5l.3-.5c.1-.2 0-.4-.1-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5 4.5 2.5 1 2.9.7 3.4.7.5 0 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4Zm-5.5 7.5c-1.7 0-3.4-.5-4.9-1.4l-.3-.2-3.6.9.9-3.5-.2-.4c-1-1.5-1.5-3.3-1.5-5.1 0-5.4 4.4-9.7 9.7-9.7 2.6 0 5 1 6.9 2.8 1.8 1.8 2.9 4.3 2.9 6.9-.1 5.3-4.5 9.7-9.9 9.7Zm8.2-17.9C18 1.9 15 .8 12 .8 5.5.8.2 6 .2 12.5c0 2.1.5 4.1 1.6 5.9L.1 24l5.7-1.5c1.7.9 3.6 1.4 5.5 1.4 6.5 0 11.8-5.3 11.8-11.8.1-3.1-1.1-6.1-3.4-8.3Z" />
    </svg>
  );
}

export default async function ContactPage() {
  return (
    <section className="container py-12 md:py-20 max-w-5xl">
      <Reveal className="text-center space-y-4 mb-10 md:mb-14">
        <p className="eyebrow-accent">Get in touch</p>
        <h1 className="display-2">We&apos;d love to hear from you</h1>
        <p className="text-muted-foreground max-w-md mx-auto text-pretty">
          Questions about an order? Looking for something specific? We usually reply within a few
          hours during business days.
        </p>
      </Reveal>

      <Reveal className="grid sm:grid-cols-2 gap-3 md:gap-4">
        <ContactCard
          icon={WhatsAppIcon}
          title="WhatsApp"
          value="+92 326 4348024"
          sub="Fastest way to reach us"
          href={SOCIAL.whatsapp}
          accent="green"
          external
        />
        <ContactCard
          icon={Phone}
          title="Phone"
          value="+92 326 4348024"
          sub="Mon–Sat · 10 AM – 7 PM"
          href="tel:+923264348024"
        />
        <ContactCard
          icon={Mail}
          title="Email"
          value="contact@astacollections.com"
          sub="We respond within 24 hours"
          href="mailto:contact@astacollections.com"
        />
        <ContactCard
          icon={MapPin}
          title="Location"
          value="Karachi, Pakistan"
          sub="By appointment only"
        />
      </Reveal>

      {/* Socials */}
      <Reveal className="mt-12 md:mt-16 text-center">
        <p className="eyebrow-accent mb-4">Follow our journey</p>
        <div className="flex justify-center gap-2.5 flex-wrap">
          <SocialIcon
            href={SOCIAL.instagram}
            label="Instagram"
            handle="@astacollections"
          >
            <Instagram className="h-4 w-4" strokeWidth={1.6} />
          </SocialIcon>
          <SocialIcon
            href={SOCIAL.facebook}
            label="Facebook"
            handle="Asta Collections"
          >
            <Facebook className="h-4 w-4" strokeWidth={1.6} />
          </SocialIcon>
          <SocialIcon
            href={SOCIAL.tiktok}
            label="TikTok"
            handle="@astacollections"
          >
            <TikTokIcon className="h-4 w-4" />
          </SocialIcon>
        </div>
      </Reveal>

      {/* Quick FAQ link */}
      <Reveal className="mt-12 md:mt-16 text-center bg-secondary/40 border border-border rounded-2xl md:rounded-3xl p-8 md:p-10 max-w-2xl mx-auto">
        <h2 className="font-serif text-xl md:text-2xl mb-2">Have a question about an order?</h2>
        <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
          Track an order, browse our FAQ, or message us on WhatsApp — we&apos;re here to help.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <a
            href="/track-order"
            className="bg-foreground text-background px-6 h-11 rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-colors inline-flex items-center"
          >
            Track Order
          </a>
          <a
            href="/faq"
            className="border border-border px-6 h-11 rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:border-accent hover:text-accent transition-colors inline-flex items-center"
          >
            Browse FAQ
          </a>
          <a
            href={SOCIAL.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 text-white px-6 h-11 rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-green-700 transition-colors inline-flex items-center gap-1.5"
          >
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </Reveal>
    </section>
  );
}

function ContactCard({
  icon: Icon,
  title,
  value,
  sub,
  href,
  external,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  sub: string;
  href?: string;
  external?: boolean;
  accent?: "green";
}) {
  const Inner = (
    <div
      className={`group bg-white border rounded-2xl p-5 md:p-6 transition-all space-y-2 ${
        href ? "hover:border-accent hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5" : ""
      } ${accent === "green" ? "hover:border-green-500 hover:shadow-green-500/10" : ""}`}
    >
      <div
        className={`inline-flex w-11 h-11 rounded-full items-center justify-center ${
          accent === "green"
            ? "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white"
            : "bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground"
        } transition-colors`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">{title}</p>
      <p className="font-medium text-base break-all">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
  return href ? (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {Inner}
    </a>
  ) : (
    Inner
  );
}

function SocialIcon({
  href,
  label,
  handle,
  children,
}: {
  href: string;
  label: string;
  handle: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group flex items-center gap-2.5 bg-white border border-border rounded-full pl-3 pr-4 h-10 hover:border-accent hover:shadow-sm transition-all"
    >
      <span className="w-7 h-7 rounded-full bg-secondary text-foreground flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
        {children}
      </span>
      <span className="text-sm font-medium">{handle}</span>
    </a>
  );
}
