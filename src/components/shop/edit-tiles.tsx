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
 * "The edit": bright photos with the caption underneath (no overlay on the
 * image, no clipped text). One wider tile and two narrower ones share a fixed
 * image height on desktop so captions line up; on phones it's a swipe row.
 */
export function EditTiles({ tiles }: { tiles: EditTile[] }) {
  if (tiles.length === 0) return null;
  return (
    <section className="container py-14 md:py-24" data-section="edit-tiles">
      <div className="mb-8 max-w-3xl md:mb-12">
        <p className="eyebrow-accent flex items-center gap-3">
          <span className="h-px w-8 bg-accent" aria-hidden="true" />
          The edit
        </p>
        <h2 className="display-2 mt-3">
          Chosen for <span className="italic font-light rose-gold-text">how you wear it</span>
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Ready-to-gift sets, rings for every day, and matching pairs for two.
        </p>
      </div>

      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-[1.5fr_1fr_1fr] md:gap-6 md:overflow-visible md:px-0 md:pb-0">
        {tiles.map((t, i) => (
          <li key={t.href} className="w-[80vw] max-w-[360px] shrink-0 snap-start md:w-auto md:max-w-none">
            <Link href={t.href} className="press group block">
              <span className="relative block aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-secondary md:aspect-auto md:h-[460px]">
                <Image
                  src={t.image}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes={i === 0 ? "(max-width:768px) 80vw, 42vw" : "(max-width:768px) 80vw, 28vw"}
                  className="object-cover transition-transform duration-700 ease-out [@media(hover:hover)]:group-hover:scale-[1.04] motion-reduce:transition-none"
                />
              </span>
              <span className="mt-4 block">
                <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-accent">{t.eyebrow}</span>
                <span className="mt-1 block font-serif text-2xl leading-tight md:text-3xl">{t.title}</span>
                <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">{t.line}</span>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 group-hover:underline">
                  {t.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
