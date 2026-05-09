import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Tag } from "lucide-react";
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

export function BundleStrip({ bundles }: { bundles: BundleListItem[] }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
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
        const linkSlug = b.items[0]?.product.slug;
        return (
          <Link
            key={b.id}
            href={linkSlug ? `/products/${linkSlug}` : "/products"}
            className="group bg-white border border-border rounded-3xl overflow-hidden card-soft card-hover flex flex-col"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-secondary/60">
              <div className="absolute inset-0 grid grid-cols-3 gap-1.5 p-1.5">
                {b.items.slice(0, 3).map((it, i) => (
                  <div key={i} className="relative bg-secondary overflow-hidden rounded-2xl">
                    {it.product.images[0] && (
                      <Image
                        src={it.product.images[0].url}
                        alt={it.product.name}
                        fill
                        sizes="(max-width: 768px) 33vw, 16vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                      />
                    )}
                  </div>
                ))}
              </div>
              <span className="absolute top-4 right-4 bg-accent text-accent-foreground text-[10px] uppercase tracking-[0.18em] font-bold px-3 py-1.5 rounded-full">
                Save {pricing.percent}%
              </span>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <p className="eyebrow-accent mb-2 flex items-center gap-1.5">
                <Tag className="h-3 w-3" />
                Bundle of {b.items.length}
              </p>
              <h3 className="font-serif text-xl md:text-2xl text-balance leading-tight group-hover:text-accent transition-colors">
                {b.name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-2 mb-5">
                {b.items.map((i) => i.product.name).join(" + ")}
              </p>

              <div className="mt-auto flex items-end justify-between border-t border-border/70 pt-4">
                <div>
                  <p className="text-xs text-muted-foreground line-through tabular-nums">
                    {formatPrice(pricing.original)}
                  </p>
                  <p className="text-xl font-semibold tabular-nums">{formatPrice(pricing.final)}</p>
                </div>
                <span className="shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-full border border-border transition-all group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-accent">
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-12" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
