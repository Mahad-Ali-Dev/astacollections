import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export type EditTile = {
  eyebrow: string;
  title: string;
  line: string;
  cta: string;
  href: string;
  image: string;
};

/**
 * "The edit": one tall tile beside two stacked ones. Each has a proper bottom
 * scrim so the serif title, line and CTA stay readable on any photo.
 */
export function EditTiles({ tiles }: { tiles: EditTile[] }) {
  if (tiles.length === 0) return null;
  const [main, ...rest] = tiles;
  return (
    <section className="container py-20 md:py-28" data-section="edit-tiles">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
        <div className="max-w-xl">
          <p className="eyebrow-accent flex items-center gap-3">
            <span className="h-px w-8 bg-accent" aria-hidden="true" />
            The edit
          </p>
          <h2 className="display-2 mt-4">
            Chosen for <span className="italic font-light rose-gold-text">how you wear it</span>
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Ready-to-gift sets, rings for every day, and matching pairs for two.
        </p>
      </div>

      {/* Phones: swipe carousel with a peek of the next tile. md+: one tall
          tile beside two stacked ones, sized to fit a laptop screen. */}
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:grid-rows-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0">
        <Tile tile={main} className="aspect-[4/5] w-[82vw] max-w-[420px] shrink-0 snap-start md:row-span-2 md:aspect-auto md:h-[600px] md:w-auto md:max-w-none" priority />
        {rest.slice(0, 2).map((t) => (
          <Tile key={t.href} tile={t} compact className="aspect-[4/5] w-[82vw] max-w-[420px] shrink-0 snap-start md:aspect-auto md:h-[288px] md:w-auto md:max-w-none" />
        ))}
      </div>
    </section>
  );
}

function Tile({
  tile,
  className,
  priority,
  compact,
}: {
  tile: EditTile;
  className: string;
  priority?: boolean;
  /** Stacked desktop tiles are short, so their text steps down a size there. */
  compact?: boolean;
}) {
  return (
    <Link href={tile.href} className={`press group relative isolate block overflow-hidden rounded-[1.75rem] bg-secondary ${className}`}>
      <Image
        src={tile.image}
        alt=""
        fill
        priority={priority}
        sizes="(max-width:768px) 100vw, 50vw"
        className="-z-10 object-cover transition-transform duration-[1200ms] ease-out [@media(hover:hover)]:group-hover:scale-[1.04] motion-reduce:transition-none"
      />
      {/* Scrim: a light overall tint plus a tall bottom gradient, so white
          text stays readable even on very bright photos (e.g. white lace). */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#24160f]/10" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-3/4 bg-gradient-to-t from-[#24160f]/90 via-[#24160f]/45 to-transparent" />
      <div className={`absolute inset-x-0 bottom-0 p-6 text-background ${compact ? "md:p-7" : "md:p-9"}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-rose-100">{tile.eyebrow}</p>
        <h3 className={`mt-2 font-serif text-3xl leading-tight text-balance [text-shadow:0_2px_16px_rgba(0,0,0,0.25)] ${compact ? "md:text-3xl" : "md:text-[2.4rem]"}`}>{tile.title}</h3>
        <p className={`mt-2 max-w-sm text-sm text-background/85 ${compact ? "md:line-clamp-1" : "md:text-base"}`}>{tile.line}</p>
        <span className="mt-4 inline-flex items-center gap-2 border-b border-background/60 pb-1 text-xs font-semibold uppercase tracking-[0.22em] transition-colors group-hover:border-rose-200 group-hover:text-rose-100">
          {tile.cta}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
