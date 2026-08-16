import Link from "next/link";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/motion/reveal";

/**
 * Approved reviews drawn from the whole catalogue, not one product.
 *
 * The per-product section on a product page answers "is this piece good?".
 * This answers "is this shop real?", so it can sit on the homepage, Shop All
 * or About where there's no single product in context.
 */
export async function ReviewsStrip({
  title,
  subtitle,
  count,
  minRating,
  showProduct,
}: {
  title?: string;
  subtitle?: string;
  count: number;
  minRating: number;
  showProduct: boolean;
}) {
  const reviews = await prisma.review.findMany({
    where: { status: "APPROVED", rating: { gte: minRating } },
    orderBy: { createdAt: "desc" },
    take: count,
    include: { product: { select: { name: true, slug: true } } },
  });

  if (reviews.length === 0) return null;

  return (
    <section className="py-14 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        {(title || subtitle) && (
          <Reveal className="mb-10 text-center">
            {title && (
              <h2 className="font-serif text-3xl md:text-4xl text-foreground">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </Reveal>
        )}

        <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
          {reviews.map((r) => (
            <article
              key={r.id}
              className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center font-serif text-sm shrink-0">
                    {r.customerName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.customerName}</p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {r.createdAt.toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < r.rating
                          ? "h-3.5 w-3.5 fill-accent text-accent"
                          : "h-3.5 w-3.5 text-muted-foreground/30"
                      }
                    />
                  ))}
                </div>
              </div>

              {r.title && <p className="font-serif text-lg leading-snug">{r.title}</p>}

              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {r.body}
              </p>

              {showProduct && (
                <Link
                  href={`/products/${r.product.slug}`}
                  className="text-xs text-accent hover:underline truncate"
                >
                  {r.product.name}
                </Link>
              )}
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
