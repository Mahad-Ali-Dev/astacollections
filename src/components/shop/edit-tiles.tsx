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

      <div className="grid gap-4 md:grid-cols-2 md:grid-rows-2 md:gap-6">
        <Tile tile={main} className="aspect-[4/5] md:row-span-2 md:aspect-auto md:min-h-[640px]" priority />
        {rest.slice(0, 2).map((t) => (
          <Tile key={t.href} tile={t} className="aspect-[4/3] md:aspect-auto md:min-h-[308px]" />
        ))}
      </div>
    </section>
  );
}

function Tile({ tile, className, priority }: { tile: EditTile; className: string; priority?: boolean }) {
  return (
    <Link href={tile.href} className={`group relative isolate block overflow-hidden rounded-[1.75rem] bg-secondary ${className}`}>
      <Image
        src={tile.image}
        alt=""
        fill
        priority={priority}
        sizes="(max-width:768px) 100vw, 50vw"
        className="-z-10 object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
      />
      {/* bottom scrim: strong enough for white text on bright photos */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[#2a1a16]/85 via-[#2a1a16]/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-background md:p-9">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-200">{tile.eyebrow}</p>
        <h3 className="mt-2 font-serif text-3xl leading-tight text-balance md:text-[2.6rem]">{tile.title}</h3>
        <p className="mt-2 max-w-sm text-sm text-background/85 md:text-base">{tile.line}</p>
        <span className="mt-5 inline-flex items-center gap-2 border-b border-background/60 pb-1 text-xs font-semibold uppercase tracking-[0.22em] transition-colors group-hover:border-rose-200 group-hover:text-rose-100">
          {tile.cta}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
