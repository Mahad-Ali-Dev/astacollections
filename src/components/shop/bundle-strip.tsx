import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { computeBundlePricing } from "@/lib/bundles";
import { formatPrice } from "@/lib/utils";

type BundleListItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  discountType: string;
  discountValue: number;
  items: {
    productId: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      price: number;
      images: { url: string }[];
    };
  }[];
};

const Photo = ({ src, className = "" }: { src?: string; className?: string }) => (
  <span className={`relative block overflow-hidden rounded-xl bg-white ${className}`}>
    {src && (
      <Image
        src={src}
        alt=""
        fill
        sizes="(max-width:768px) 42vw, 16vw"
        className="object-cover transition-transform duration-700 ease-out [@media(hover:hover)]:group-hover:scale-[1.04] motion-reduce:transition-none"
      />
    )}
  </span>
);

/**
 * Photos arranged by how many pieces the bundle has, always near-square crops:
 * 2 = side by side, 3 = one large + two stacked, 4+ = 2 x 2 (the last tile says
 * how many more). The frame is the same 5:4 for every card so rows line up.
 */
function BundlePhotos({ urls }: { urls: (string | undefined)[] }) {
  const n = urls.length;
  const frame = "aspect-[5/4] gap-1.5 bg-secondary/50 p-1.5";
  if (n <= 1) {
    return (
      <span className={`grid ${frame}`}>
        <Photo src={urls[0]} />
      </span>
    );
  }
  if (n === 2) {
    return (
      <span className={`grid grid-cols-2 items-center ${frame}`}>
        <Photo src={urls[0]} className="aspect-[4/5]" />
        <Photo src={urls[1]} className="aspect-[4/5]" />
      </span>
    );
  }
  if (n === 3) {
    return (
      <span className={`grid grid-cols-[2fr_1fr] grid-rows-2 ${frame}`}>
        <Photo src={urls[0]} className="row-span-2" />
        <Photo src={urls[1]} />
        <Photo src={urls[2]} />
      </span>
    );
  }
  return (
    <span className={`grid grid-cols-2 grid-rows-2 ${frame}`}>
      {urls.slice(0, 4).map((u, i) => (
        <span key={i} className="relative">
          <Photo src={u} className="h-full" />
          {i === 3 && n > 4 && (
            <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-foreground/50 text-sm font-semibold text-background">
              +{n - 4} more
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

export function BundleStrip({ bundles }: { bundles: BundleListItem[] }) {
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3">
      {bundles.map((b) => {
        const pricing = computeBundlePricing({
          discountType: b.discountType,
          discountValue: b.discountValue,
          items: b.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            product: { price: i.product.price },
          })),
        });
        const pieces = b.items.reduce((n, i) => n + i.quantity, 0);
        const linkSlug = b.items[0]?.product.slug;
        return (
          <li key={b.id} className="flex w-[84vw] max-w-[380px] shrink-0 snap-start md:w-auto md:max-w-none">
            <Link
              href={linkSlug ? `/products/${linkSlug}` : "/products"}
              className="press group flex w-full flex-col overflow-hidden rounded-[1.5rem] border border-border/70 bg-white transition-shadow duration-300 hover:shadow-[0_24px_50px_-28px_rgba(60,30,20,0.35)]"
            >
              <BundlePhotos urls={b.items.map((i) => i.product.images[0]?.url)} />

              <span className="flex flex-1 flex-col p-5 md:p-6">
                <span className="text-xs font-medium text-muted-foreground">{pieces} pieces</span>
                <span className="mt-1 font-serif text-2xl leading-tight transition-colors group-hover:text-accent">{b.name}</span>

                <span className="mt-3 block space-y-1.5 text-sm leading-snug text-foreground/80">
                  {b.items.map((i) => (
                    <span key={i.productId} className="flex gap-2">
                      <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
                      <span>
                        {i.product.name.trim()}
                        {i.quantity > 1 && <span className="text-muted-foreground"> × {i.quantity}</span>}
                      </span>
                    </span>
                  ))}
                </span>

                <span className="mt-auto block pt-5">
                  <span className="flex flex-wrap items-baseline gap-x-2 border-t border-border/70 pt-4">
                    <span className="text-xl font-semibold tabular-nums">{formatPrice(pricing.final)}</span>
                    {pricing.discount > 0 && (
                      <>
                        <span className="text-sm tabular-nums text-muted-foreground line-through">{formatPrice(pricing.original)}</span>
                        <span className="text-sm font-medium text-emerald-800">You save {formatPrice(pricing.discount)}</span>
                      </>
                    )}
                  </span>
                  <span className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full border border-foreground text-xs font-semibold uppercase tracking-[0.18em] transition-colors group-hover:bg-foreground group-hover:text-background">
                    View bundle
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
