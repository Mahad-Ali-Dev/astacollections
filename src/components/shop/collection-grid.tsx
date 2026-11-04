import Link from "next/link";
import Image from "next/image";

type Collection = {
  name: string;
  slug: string;
  image: string;
  productCount: number;
};

const FALLBACK = "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=1200&auto=format&fit=crop&q=85";

const pieces = (n: number) => `${n} ${n === 1 ? "piece" : "pieces"}`;

/** Pairs shown large on desktop. The rest become the first chips there. */
const DESKTOP_PAIRS = 4;

/**
 * Checkerboard of photo and colour-panel pairs. Names sit on the panels, so the
 * photos carry no shade.
 * Below lg: one pair per row, edge to edge, sides and colours alternating.
 * From lg: two pairs per row, photo 2/3 and slim panel 1/3, with Couple Rings
 * moving into the chips. Chips swipe in one row, and wrap from lg.
 */
export function CollectionGrid({ tiles, more }: { tiles: Collection[]; more: Collection[] }) {
  const chip = (c: Collection, className = "") => (
    <li key={c.slug} className={`shrink-0 snap-start ${className}`}>
      <Link
        href={`/category/${c.slug}`}
        className="press inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-white px-3.5 text-xs transition-colors hover:border-accent hover:text-accent lg:text-sm"
      >
        {c.name}
        <span className="tabular-nums text-muted-foreground">{c.productCount}</span>
      </Link>
    </li>
  );

  return (
    <>
      <ul className="-mx-4 grid grid-cols-1 lg:mx-0 lg:grid-cols-2">
        {tiles.map((c, i) => {
          const phoneFlip = i % 2 === 1;
          const desktopFlip = i === 1 || i === 2;
          return (
            <li key={c.slug} className={i >= DESKTOP_PAIRS ? "lg:hidden" : ""}>
              <Link href={`/category/${c.slug}`} className="group grid grid-cols-2 lg:grid-cols-3">
                <span
                  className={`relative block aspect-[1/1.15] overflow-hidden bg-secondary md:aspect-[4/3] lg:col-span-2 lg:aspect-square ${
                    phoneFlip ? "order-2" : "order-1"
                  } ${desktopFlip ? "lg:order-2" : "lg:order-1"}`}
                >
                  <Image
                    src={c.image || FALLBACK}
                    alt=""
                    fill
                    sizes="(max-width:1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out [@media(hover:hover)]:group-hover:scale-[1.04] motion-reduce:transition-none"
                  />
                </span>
                <span
                  className={`flex min-w-0 flex-col justify-end p-4 lg:p-5 xl:p-6 ${
                    phoneFlip ? "order-1 bg-espresso text-[#f4e9dd]" : "order-2 bg-cream text-foreground"
                  } ${desktopFlip ? "lg:order-1 lg:bg-espresso lg:text-[#f4e9dd]" : "lg:order-2 lg:bg-cream lg:text-foreground"}`}
                >
                  <span className="font-serif text-[1.7rem] leading-[1.08] xl:text-[2rem]">{c.name}</span>
                  <span className="mt-2 text-xs tabular-nums tracking-[0.04em] opacity-80 lg:text-sm">{pieces(c.productCount)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <ul className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pt-4 lg:mx-0 lg:flex-wrap lg:gap-2.5 lg:overflow-visible lg:px-0 lg:pt-7">
        {tiles.slice(DESKTOP_PAIRS).map((c) => chip(c, "hidden lg:block"))}
        {more.map((c) => chip(c))}
      </ul>
    </>
  );
}
