import Link from "next/link";
import Image from "next/image";

type Collection = {
  name: string;
  slug: string;
  image: string;
  productCount?: number;
};

const FALLBACK = "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=1200&auto=format&fit=crop&q=85";

/**
 * Clean, even collection grid: 2 / 3 / 4 columns across the full content
 * width, bright photos (no dark overlay), one 4:5 crop everywhere, and the
 * serif name with a piece count underneath.
 */
export function CollectionGrid({ collections }: { collections: Collection[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:gap-x-6 md:gap-y-12 lg:grid-cols-4">
      {collections.map((c) => (
        <li key={c.slug}>
          <Link href={`/category/${c.slug}`} className="group block">
            <span className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-secondary">
              <Image
                src={c.image || FALLBACK}
                alt=""
                fill
                sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05] motion-reduce:transition-none"
              />
            </span>
            <span className="mt-3 flex items-baseline justify-between gap-2 px-0.5">
              <span className="font-serif text-xl leading-tight transition-colors group-hover:text-accent md:text-2xl">
                {c.name}
              </span>
              {c.productCount ? (
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{c.productCount} pieces</span>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
