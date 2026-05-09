import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

type Collection = {
  name: string;
  slug: string;
  description?: string | null;
  image: string;
  productCount?: number;
};

const DEFAULT_IMAGES: Record<string, string> = {
  rings: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&auto=format&fit=crop&q=85",
  necklaces: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&auto=format&fit=crop&q=85",
  earrings: "https://images.unsplash.com/photo-1635767582909-345788c69757?w=1200&auto=format&fit=crop&q=85",
  bracelets: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1200&auto=format&fit=crop&q=85",
  "bridal-sets": "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1200&auto=format&fit=crop&q=85",
  anklets: "https://images.unsplash.com/photo-1620656798579-1984d9e87df7?w=1200&auto=format&fit=crop&q=85",
};

const FALLBACK = "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=1200&auto=format&fit=crop&q=85";

export function CollectionGrid({ collections }: { collections: Collection[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
      {collections.map((c) => {
        const img = c.image || DEFAULT_IMAGES[c.slug] || FALLBACK;
        return (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="group relative overflow-hidden rounded-3xl bg-secondary/60 aspect-[4/5] card-soft card-hover"
          >
            <Image
              src={img}
              alt={c.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-5 md:p-7 text-background flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.32em] mb-1.5 opacity-80">
                  {c.productCount ? `${c.productCount} pieces` : "Shop"}
                </p>
                <h3 className="font-serif text-2xl md:text-3xl text-balance leading-tight">
                  {c.name}
                </h3>
              </div>
              <span className="shrink-0 w-10 h-10 md:w-12 md:h-12 inline-flex items-center justify-center rounded-full bg-white/95 text-foreground transition-all group-hover:bg-accent group-hover:text-accent-foreground">
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-12" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
