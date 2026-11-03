import Link from "next/link";
import Image from "next/image";
import { Star, Quote, Play, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type HomeReview = {
  id: string;
  name: string;
  rating: number;
  body: string;
  verified: boolean;
  /** How many other reviews used the same wording (collapsed into this one). */
  similar: number;
  product: { name: string; slug: string; image: string | null } | null;
};
export type UgcClip = { poster: string; href: string | null; caption: string | null };

function Stars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} aria-hidden="true" className={cn(size, i <= rating ? "fill-amber-400 text-amber-400" : "fill-border text-border")} />
      ))}
    </span>
  );
}

/**
 * Home reviews: one featured review with its product photo, the rest as a
 * swipeable row, and the admin's "Seen on you" clips (posters linking to the
 * product). Reviews arrive already de-duplicated: repeated template wording
 * is collapsed into one card, never shown twice.
 */
export function HomeReviews({ reviews, clips }: { reviews: HomeReview[]; clips: UgcClip[] }) {
  if (reviews.length === 0) return null;
  const [featured, ...rest] = reviews;
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--secondary))_55%,hsl(var(--background))_100%)] py-20 md:py-28">
      <div className="container">
        <div className="mb-10 max-w-xl md:mb-14">
          <p className="eyebrow-accent flex items-center gap-3">
            <span className="h-px w-8 bg-accent" aria-hidden="true" />
            Loved across Pakistan
          </p>
          <h2 className="display-2 mt-4">
            What our customers <span className="italic font-light rose-gold-text">say</span>
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
          {/* Featured review */}
          <figure className="relative grid overflow-hidden rounded-[2rem] border border-border/70 bg-white shadow-[0_30px_70px_-40px_rgba(60,30,20,0.4)] sm:grid-cols-[0.9fr_1.1fr]">
            {featured.product?.image && (
              <Link href={`/products/${featured.product.slug}`} className="group relative block aspect-[4/3] sm:aspect-auto sm:min-h-[340px]">
                <Image src={featured.product.image} alt={featured.product.name} fill sizes="(max-width:640px) 100vw, 320px" className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
              </Link>
            )}
            <div className="flex flex-col p-7 md:p-9">
              <Quote className="h-8 w-8 text-rose-200" aria-hidden="true" />
              <Stars rating={featured.rating} />
              <blockquote className="mt-4 font-serif text-2xl leading-snug text-balance md:text-[1.75rem]">
                &ldquo;{featured.body}&rdquo;
              </blockquote>
              <figcaption className="mt-auto pt-6">
                <Author r={featured} />
              </figcaption>
            </div>
          </figure>

          {/* Other reviews + UGC */}
          <div className="flex min-w-0 flex-col gap-6">
            {rest.length > 0 && (
              <ul className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-1 lg:overflow-visible lg:px-0">
                {rest.slice(0, 3).map((r) => (
                  <li key={r.id} className="w-[78vw] max-w-[340px] shrink-0 snap-start lg:w-auto lg:max-w-none">
                    <figure className="h-full rounded-2xl border border-border/70 bg-white/90 p-5 backdrop-blur">
                      <div className="flex items-center justify-between gap-3">
                        <Stars rating={r.rating} size="h-3.5 w-3.5" />
                      </div>
                      <blockquote className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/85">&ldquo;{r.body}&rdquo;</blockquote>
                      <figcaption className="mt-4">
                        <Author r={r} small />
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            )}

            {clips.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]">Seen on you</p>
                <ul className="grid grid-cols-3 gap-3">
                  {clips.slice(0, 3).map((c, i) => {
                    const inner = (
                      <>
                        <Image src={c.poster} alt={c.caption ?? "Customer photo"} fill sizes="160px" className="object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground">
                            <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                          </span>
                        </span>
                      </>
                    );
                    return (
                      <li key={i} className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-secondary">
                        {c.href ? <Link href={c.href} className="absolute inset-0">{inner}</Link> : inner}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Author({ r, small }: { r: HomeReview; small?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-rose-200 font-serif text-rose-800",
          small ? "h-8 w-8 text-sm" : "h-11 w-11 text-lg"
        )}
      >
        {r.name.trim().charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          {r.name}
          {r.verified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified buyer
            </span>
          )}
        </span>
        {r.product && (
          <Link href={`/products/${r.product.slug}`} className="block truncate text-xs text-muted-foreground hover:text-accent hover:underline">
            {r.product.name.trim()}
          </Link>
        )}
      </span>
    </span>
  );
}
