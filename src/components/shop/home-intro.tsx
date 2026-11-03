import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Banknote, Truck, RefreshCcw, MessageCircle } from "lucide-react";
import { codLine, deliveryLine, type StorePolicy } from "@/lib/store-policy";

export type IntroPhoto = { src: string; alt: string; href: string };
export type IntroCollection = { href: string; label: string; image: string | null };

/**
 * Home intro: an editorial split (statement + CTA beside a stack of real
 * product photos), round photo tiles for the main collections, and a slim
 * trust line. Replaces the centred text, plain pills and four boxed cards.
 */
export function HomeIntro({
  fromPrice,
  photos,
  collections,
  policy,
}: {
  fromPrice: string | null;
  photos: IntroPhoto[];
  collections: IntroCollection[];
  policy: StorePolicy;
}) {
  const [a, b, c] = photos;
  return (
    <section className="relative overflow-hidden">
      {/* soft blush wash behind the photo stack */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[720px] rounded-full bg-[radial-gradient(closest-side,rgba(233,205,193,0.55),transparent)]"
      />
      <div className="container relative grid items-center gap-12 py-14 md:grid-cols-2 md:gap-10 md:py-24">
        <div className="max-w-xl">
          <p className="eyebrow-accent flex items-center gap-3">
            <span className="h-px w-8 bg-accent" aria-hidden="true" />
            Gold-tone &amp; silver-tone stainless steel
          </p>
          <h1 className="mt-5 font-serif text-[2.6rem] leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-[4.5rem]">
            Stainless steel jewellery, <span className="italic font-light rose-gold-text">made to be worn</span> every day
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground text-pretty md:text-lg">
            Rings, pendant sets, studs and handcuffs in gold-tone and silver-tone stainless steel
            {fromPrice ? <>, from <strong className="font-semibold text-foreground">{fromPrice}</strong></> : null}.
            Delivered across Pakistan, paid in cash at your door.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-xs font-semibold uppercase tracking-[0.2em] text-background transition-colors hover:bg-accent"
            >
              Shop the collection
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              href="/guides/jewellery-gift-ideas-for-her-under-2000"
              className="inline-flex h-12 items-center rounded-full border border-border px-6 text-xs font-semibold uppercase tracking-[0.2em] transition-colors hover:border-accent hover:text-accent"
            >
              Gift ideas
            </Link>
          </div>
        </div>

        {/* Overlapping product photos (real catalogue images) */}
        {a && (
          <div className="relative mx-auto aspect-[5/4] w-full max-w-[560px] md:aspect-[1/1]">
            <Link
              href={a.href}
              className="group absolute left-0 top-0 h-[78%] w-[62%] overflow-hidden rounded-[2rem] shadow-[0_30px_60px_-30px_rgba(60,30,20,0.45)]"
            >
              <Image src={a.src} alt={a.alt} fill priority sizes="(max-width:768px) 60vw, 340px" className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
            </Link>
            {b && (
              <Link
                href={b.href}
                className="group absolute bottom-0 right-0 h-[62%] w-[52%] overflow-hidden rounded-[2rem] border-[6px] border-background shadow-[0_30px_60px_-30px_rgba(60,30,20,0.45)]"
              >
                <Image src={b.src} alt={b.alt} fill sizes="(max-width:768px) 50vw, 290px" className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
              </Link>
            )}
            {c && (
              <Link
                href={c.href}
                className="group absolute right-[6%] top-[4%] hidden h-[30%] w-[30%] overflow-hidden rounded-full border-[5px] border-background shadow-xl sm:block"
              >
                <Image src={c.src} alt={c.alt} fill sizes="170px" className="object-cover transition-transform duration-700 group-hover:scale-[1.08]" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Collections as round photo tiles */}
      {collections.length > 0 && (
        <nav aria-label="Shop by collection" className="container">
          <ul className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-2 md:mx-0 md:justify-center md:gap-8 md:px-0">
            {collections.map((col) => (
              <li key={col.href} className="snap-start shrink-0">
                <Link href={col.href} className="group flex w-[84px] flex-col items-center gap-2.5 text-center md:w-[104px]">
                  <span className="relative h-[84px] w-[84px] overflow-hidden rounded-full bg-secondary ring-1 ring-border ring-offset-4 ring-offset-background transition-all duration-300 group-hover:ring-accent md:h-[104px] md:w-[104px]">
                    {col.image && (
                      <Image src={col.image} alt="" fill sizes="104px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                    )}
                  </span>
                  <span className="text-[11px] font-medium uppercase leading-tight tracking-[0.14em] transition-colors group-hover:text-accent">
                    {col.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Slim trust line with dividers */}
      <div className="container mt-10 md:mt-14">
        <ul className="grid grid-cols-2 border-y border-border/70 md:grid-cols-4" aria-label="Delivery and payment">
          {[
            { icon: Banknote, label: codLine(policy) },
            { icon: Truck, label: deliveryLine(policy) },
            { icon: RefreshCcw, label: `${policy.returnDays}-day returns` },
            { icon: MessageCircle, label: "WhatsApp support" },
          ].map(({ icon: Icon, label }, i) => (
            <li
              key={label}
              className={`flex items-center justify-center gap-2.5 px-3 py-4 text-center text-xs font-medium tracking-wide md:text-[13px] ${
                i % 2 === 1 ? "border-l border-border/70" : ""
              } ${i >= 2 ? "border-t border-border/70 md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}
            >
              <Icon className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.6} aria-hidden="true" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
