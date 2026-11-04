"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type HomeReview = {
  id: string;
  name: string;
  rating: number;
  body: string;
  verified: boolean;
  product: { name: string; slug: string; image: string | null } | null;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} aria-hidden="true" className={cn("h-4 w-4", i <= rating ? "fill-amber-400 text-amber-400" : "fill-border text-border")} />
      ))}
    </span>
  );
}

/**
 * Equal review cards in a swipeable row with arrows on desktop. Cards come
 * from selectDistinctReviews, so no two show the same text, and each links to
 * the product it reviews.
 */
export function HomeReviews({ reviews }: { reviews: HomeReview[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  if (reviews.length === 0) return null;
  const nudge = (dir: -1 | 1) => {
    const el = trackRef.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (el && card) el.scrollBy({ left: dir * (card.offsetWidth + 24), behavior: "smooth" });
  };
  return (
    <section className="bg-secondary/50 py-14 md:py-24">
      <div className="container">
        <div className="mb-8 flex items-end justify-between gap-4 md:mb-12">
          <div>
            <p className="eyebrow-accent flex items-center gap-3">
              <span className="h-px w-8 bg-accent" aria-hidden="true" />
              Reviews
            </p>
            <h2 className="display-2 mt-3">What our customers say</h2>
          </div>
          {reviews.length > 3 && (
            <div className="hidden gap-2 md:flex">
              <button type="button" onClick={() => nudge(-1)} aria-label="Previous reviews" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white transition-colors hover:border-accent hover:text-accent">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => nudge(1)} aria-label="Next reviews" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white transition-colors hover:border-accent hover:text-accent">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        <ul
          ref={trackRef}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto overscroll-x-contain px-4 pb-2 md:mx-0 md:gap-6 md:scroll-px-0 md:px-0"
        >
          {reviews.map((r) => (
            <li key={r.id} className="flex w-[84vw] max-w-[360px] shrink-0 snap-start md:w-[calc((100%-1.5rem)/2)] md:max-w-none lg:w-[calc((100%-3rem)/3)]">
              <figure className="flex w-full flex-col rounded-[1.5rem] border border-border/70 bg-white p-6">
                <Stars rating={r.rating} />
                <blockquote className="mt-4 flex-1 font-serif text-xl leading-snug text-pretty">&ldquo;{r.body}&rdquo;</blockquote>
                <figcaption className="mt-5 border-t border-border/70 pt-4">
                  <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
                    {r.name}
                    {r.verified && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800">
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified buyer
                      </span>
                    )}
                  </p>
                  {r.product && (
                    <Link href={`/products/${r.product.slug}`} className="group mt-3 flex min-h-[44px] items-center gap-3">
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
                        {r.product.image && <Image src={r.product.image} alt="" fill sizes="48px" className="object-cover" />}
                      </span>
                      <span className="text-sm leading-snug text-muted-foreground transition-colors group-hover:text-accent">
                        {r.product.name.trim()}
                      </span>
                    </Link>
                  )}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
