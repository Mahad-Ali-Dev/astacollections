import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/shop/product-card";
import { ProductFilters, ActiveFilterChips } from "@/components/shop/product-filters";
import { BundleStrip } from "@/components/shop/bundle-strip";
import { OfferTimer } from "@/components/shop/offer-timer";
import { defaultOfferEndsAt } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import type { Prisma } from "@prisma/client";
import { SectionSlot } from "@/components/shop/section-slot";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  sort?: string;
  category?: string;
  price?: string;
  material?: string;
  inStock?: string;
  onSale?: string;
}>;

export const metadata = {
  title: "Shop All Jewellery",
  description:
    "Browse our complete collection of handpicked jewellery — rings, necklaces, earrings, bracelets, bridal sets and more.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const sort = params.sort ?? "newest";
  const categorySlug = params.category;
  const price = params.price; // "min-max"
  const material = params.material;
  const inStock = params.inStock === "1";
  const onSale = params.onSale === "1";

  const where: Prisma.ProductWhereInput = { isActive: true };
  const ANDs: Prisma.ProductWhereInput[] = [];

  if (q) {
    ANDs.push({
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
        { material: { contains: q } },
        { tags: { contains: q.toLowerCase() } },
      ],
    });
  }
  if (categorySlug) ANDs.push({ category: { slug: categorySlug } });
  if (price) {
    const [min, max] = price.split("-").map(Number);
    if (!isNaN(min) && !isNaN(max)) {
      ANDs.push({ price: { gte: min, lte: max } });
    }
  }
  if (material) ANDs.push({ material: { contains: material } });
  if (inStock) ANDs.push({ stock: { gt: 0 } });
  if (onSale) ANDs.push({ comparePrice: { not: null } });

  if (ANDs.length > 0) where.AND = ANDs;

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price-low"
      ? { price: "asc" }
      : sort === "price-high"
        ? { price: "desc" }
        : sort === "name"
          ? { name: "asc" }
          : { createdAt: "desc" };

  const [products, categories, allMaterials, bundles, newArrivals] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, category: true },
      orderBy,
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { isActive: true, material: { not: null } },
      select: { material: true },
      distinct: ["material"],
    }),
    prisma.bundle.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 3,
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const materials = allMaterials
    .map((p) => p.material)
    .filter((m): m is string => Boolean(m))
    .sort();

  const selectedCategoryName = categories.find((c) => c.slug === categorySlug)?.name;

  return (
    <div>
      {/* Page banner */}
      <section className="bg-gradient-to-br from-secondary via-background to-secondary/40 border-b">
        <div className="container py-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium mb-3">
            {q ? "Search results" : selectedCategoryName ?? "The Shop"}
          </p>
          <h1 className="text-4xl md:text-6xl font-serif text-balance">
            {q ? (
              <>
                Results for <span className="italic gold-text">&ldquo;{q}&rdquo;</span>
              </>
            ) : selectedCategoryName ? (
              selectedCategoryName
            ) : (
              "All Jewellery"
            )}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-md">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
            {selectedCategoryName ? ` in ${selectedCategoryName}` : ""} • Free shipping above Rs. 5,000
          </p>
        </div>
      </section>

      <SectionSlot page="products" slot="top" />

      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 lg:gap-12">
          <ProductFilters
            categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
            materials={materials}
          />

          <div>
            <ActiveFilterChips
              categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
            />

            {/* Desktop result count + sort already shown in sidebar */}
            <div className="hidden md:flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Showing <strong className="text-foreground">{products.length}</strong>{" "}
                {products.length === 1 ? "piece" : "pieces"}
              </p>
            </div>

            {products.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="product-grid">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={{
                      id: p.id,
                      name: p.name,
                      slug: p.slug,
                      price: p.price,
                      comparePrice: p.comparePrice,
                      sku: p.sku,
                      stock: p.stock,
                      image: p.images[0]?.url,
                      video: p.videoUrl,
                      videoPoster: p.videoPoster,
                      isFeatured: p.isFeatured,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OFFER TIMER */}
      <section className="container py-10">
        <Reveal>
          <OfferTimer
            endsAt={defaultOfferEndsAt()}
            title="Limited time · Use code WELCOME10 for 10% off"
            cta={{ label: "Apply at checkout", href: "/checkout" }}
          />
        </Reveal>
      </section>

      {/* BUNDLES */}
      {bundles.length > 0 && (
        <section className="container py-12 border-t">
          <Reveal className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium mb-3">
              Bundle & Save
            </p>
            <h2 className="text-3xl md:text-4xl font-serif">Curated Bundles</h2>
            <p className="text-muted-foreground mt-3">
              Hand-picked sets at a special price.
            </p>
          </Reveal>
          <Reveal>
            <BundleStrip bundles={bundles} />
          </Reveal>
        </section>
      )}

      {/* NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="container pb-20 pt-4">
          <Reveal className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium mb-3">
                Just In
              </p>
              <h2 className="text-3xl md:text-4xl font-serif">New Arrivals</h2>
            </div>
          </Reveal>
          <Reveal className="product-grid" stagger={0.05}>
            {newArrivals.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  price: p.price,
                  comparePrice: p.comparePrice,
                  sku: p.sku,
                  stock: p.stock,
                  image: p.images[0]?.url,
                  video: p.videoUrl,
                  videoPoster: p.videoPoster,
                  isFeatured: p.isFeatured,
                }}
              />
            ))}
          </Reveal>
        </section>
      )}

      <SectionSlot page="products" slot="end" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 border-2 border-dashed rounded-2xl">
      <div className="text-6xl font-serif italic gold-text mb-3">∅</div>
      <h3 className="text-xl font-serif mb-2">No matches</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        We couldn&apos;t find any pieces matching your filters. Try widening your search.
      </p>
      <Link href="/products">
        <Button variant="outline">Clear all filters</Button>
      </Link>
    </div>
  );
}
