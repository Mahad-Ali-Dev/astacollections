import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Review wall for the home page. Adapted from 21st.dev "Testimonials with
 * Marquee" (serafimcloud, after Launch UI): pure CSS animation, so no client
 * JS. Two rows run in opposite directions and pause on hover/focus. With
 * prefers-reduced-motion the rows stop and become horizontally scrollable.
 * Every card is a real approved review from the database.
 */
export type MarqueeReview = {
  id: string;
  name: string;
  rating: number;
  body: string;
  product: { name: string; slug: string } | null;
};

/** Below this many distinct reviews the marquee would visibly repeat. */
const MARQUEE_MIN = 8;

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} aria-label={`${rating} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn("h-3.5 w-3.5", i <= rating ? "fill-amber-400 text-amber-400" : "fill-border text-border")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function ReviewCard({ r }: { r: MarqueeReview }) {
  return (
    <figure className="w-[280px] sm:w-[320px] shrink-0 rounded-2xl border border-border/70 bg-white p-5 text-left shadow-[0_1px_2px_rgba(40,20,15,0.04),0_12px_32px_-16px_rgba(40,20,15,0.18)]">
      <Stars rating={r.rating} />
      <blockquote className="mt-3 text-sm leading-relaxed text-foreground/85 line-clamp-4">
        &ldquo;{r.body}&rdquo;
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <span
          className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 text-rose-800 font-serif text-base flex items-center justify-center"
          aria-hidden="true"
        >
          {r.name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold truncate">{r.name}</span>
          {r.product && (
            <Link
              href={`/products/${r.product.slug}`}
              className="block text-xs text-muted-foreground truncate hover:text-accent underline-offset-2 hover:underline"
            >
              {r.product.name.trim()}
            </Link>
          )}
        </span>
      </figcaption>
    </figure>
  );
}

function Row({ reviews, reverse = false, duration }: { reviews: MarqueeReview[]; reverse?: boolean; duration: string }) {
  return (
    <div
      className="group flex overflow-hidden motion-reduce:overflow-x-auto py-2 [--gap:1rem]"
      style={{ ["--duration" as string]: duration }}
    >
      {/* Rendered twice so the -50% keyframe loops seamlessly; the copy is hidden from screen readers. */}
      <div
        className={cn(
          "flex w-max shrink-0 gap-[var(--gap)] pr-[var(--gap)] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none",
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        )}
      >
        {reviews.map((r) => (
          <ReviewCard key={r.id} r={r} />
        ))}
        <div className="flex gap-[var(--gap)] motion-reduce:hidden" aria-hidden="true">
          {reviews.map((r) => (
            <ReviewCard key={`dup-${r.id}`} r={r} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReviewsMarquee({
  reviews,
  total,
  average,
}: {
  reviews: MarqueeReview[];
  total: number;
  average: number;
}) {
  if (reviews.length === 0) return null;
  const half = Math.ceil(reviews.length / 2);
  const rowA = reviews.slice(0, half);
  const rowB = reviews.slice(half);
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-background via-secondary/50 to-background overflow-hidden">
      <div className="container text-center max-w-2xl mb-10 md:mb-12">
        <p className="eyebrow-accent mb-4">Loved across Pakistan</p>
        <h2 className="display-2">What our customers say</h2>
        {total > 0 && (
          <p className="mt-4 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <Stars rating={Math.round(average)} />
            <span>
              <strong className="text-foreground">{average.toFixed(1)}</strong> out of 5 from{" "}
              <strong className="text-foreground">{total.toLocaleString("en-PK")}</strong> reviews
            </span>
          </p>
        )}
      </div>
      {reviews.length < MARQUEE_MIN ? (
        // Too few distinct reviews to loop without the same card passing
        // every few seconds: show them as a calm, swipeable row instead.
        <div className="no-scrollbar flex gap-4 overflow-x-auto snap-x scroll-px-4 px-4 md:justify-center md:flex-wrap md:overflow-visible">
          {reviews.map((r) => (
            <div key={r.id} className="snap-start">
              <ReviewCard r={r} />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          <Row reviews={rowA} duration="70s" />
          {rowB.length > 0 && <Row reviews={rowB} reverse duration="80s" />}
          {/* Soft fade at both edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-32 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-32 bg-gradient-to-l from-background to-transparent" />
        </div>
      )}
    </section>
  );
}
