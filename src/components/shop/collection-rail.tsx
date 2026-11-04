import Link from "next/link";
import Image from "next/image";
import { Banknote, MessageCircle, RefreshCcw, Truck } from "lucide-react";
import { codLine, deliveryLine, type StorePolicy } from "@/lib/store-policy";

export type RailCollection = { href: string; label: string; image: string | null };

/**
 * The page's one stable H1 (slide titles rotate, so the hero uses h2), the main
 * collections as a rail of large round photos, and the trust line.
 */
export function CollectionRail({ collections, facts, policy }: { collections: RailCollection[]; facts: string; policy: StorePolicy }) {
  return (
    <section className="container pt-10 md:pt-16">
      <div className="mx-auto mb-8 max-w-3xl text-center md:mb-12">
        <h1 className="font-serif text-3xl leading-tight tracking-tight text-balance md:text-5xl">
          Stainless steel jewellery, <span className="italic font-light rose-gold-text">made to be worn</span> every day
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">{facts}</p>
      </div>

      <nav aria-label="Shop by collection">
        <ul className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:justify-between md:gap-6 md:overflow-visible md:px-0">
          {collections.map((c) => (
            <li key={c.href} className="shrink-0 snap-start">
              <Link href={c.href} className="press group flex w-[112px] flex-col items-center gap-3 text-center md:w-[168px]">
                <span className="relative h-[112px] w-[112px] overflow-hidden rounded-full bg-secondary md:h-[168px] md:w-[168px]">
                  {c.image && (
                    <Image
                      src={c.image}
                      alt=""
                      fill
                      sizes="(max-width:768px) 112px, 168px"
                      className="object-cover transition-transform duration-500 [@media(hover:hover)]:group-hover:scale-[1.05] motion-reduce:transition-none"
                    />
                  )}
                </span>
                <span className="font-serif text-lg leading-tight transition-colors group-hover:text-accent md:text-xl">{c.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <ul className="mt-8 grid grid-cols-2 border-y border-border/70 md:mt-12 md:grid-cols-4" aria-label="Delivery and payment">
        {[
          { icon: Banknote, label: codLine(policy) },
          { icon: Truck, label: deliveryLine(policy) },
          { icon: RefreshCcw, label: `${policy.returnDays}-day returns` },
          { icon: MessageCircle, label: "WhatsApp support" },
        ].map(({ icon: Icon, label }, i) => (
          <li
            key={label}
            className={`flex items-center justify-center gap-2.5 px-3 py-4 text-center text-xs font-medium md:text-[13px] ${
              i % 2 === 1 ? "border-l border-border/70" : ""
            } ${i >= 2 ? "border-t border-border/70 md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}
          >
            <Icon className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.6} aria-hidden="true" />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
