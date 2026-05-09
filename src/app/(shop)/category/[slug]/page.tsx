import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/shop/product-card";
import { BundleStrip } from "@/components/shop/bundle-strip";
import { Reveal } from "@/components/motion/reveal";

export const dynamic = "force-dynamic";

const CATEGORY_HEADER_IMAGES: Record<string, string> = {
  rings: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1600&auto=format&fit=crop&q=80",
  necklaces: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1600&auto=format&fit=crop&q=80",
  earrings: "https://images.unsplash.com/photo-1635767582909-345788c69757?w=1600&auto=format&fit=crop&q=80",
  bracelets: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1600&auto=format&fit=crop&q=80",
  "bridal-sets": "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1600&auto=format&fit=crop&q=80",
  anklets: "https://images.unsplash.com/photo-1620656798579-1984d9e87df7?w=1600&auto=format&fit=crop&q=80",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await prisma.category.findUnique({ where: { slug } });
  if (!c) return {};
  return {
    title: c.name,
    description: c.description ?? `Shop ${c.name} at Asta Collections.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isActive: true },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!category) notFound();

  // Featured + New Arrivals (across other categories) for the discovery sections at the bottom
  const [featuredOther, newArrivals, bundles] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        categoryId: { not: category.id },
      },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      take: 4,
    }),
    prisma.product.findMany({
      where: { isActive: true, categoryId: { not: category.id } },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 4,
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
  ]);

  const headerImage = CATEGORY_HEADER_IMAGES[category.slug];

  return (
    <>
      {/* Category hero banner */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0">
          {headerImage && (
            <Image
              src={headerImage}
              alt={category.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        </div>
        <div className="container relative py-20 md:py-28 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium mb-3">
            Collection
          </p>
          <h1 className="text-5xl md:text-7xl font-serif text-balance">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-pretty">
              {category.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            {category.products.length} {category.products.length === 1 ? "piece" : "pieces"}
          </p>
        </div>
      </section>

      <div className="container py-10 md:py-14">
        {category.products.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-2xl">
            <p className="text-muted-foreground">No products in this category yet.</p>
          </div>
        ) : (
          <Reveal className="product-grid" stagger={0.05}>
            {category.products.map((p) => (
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
                  isFeatured: p.isFeatured,
                }}
              />
            ))}
          </Reveal>
        )}
      </div>

      {/* BUNDLES */}
      {bundles.length > 0 && (
        <section className="container py-16">
          <Reveal className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium mb-3">
              Bundle & Save
            </p>
            <h2 className="text-3xl md:text-4xl font-serif">Curated Bundles</h2>
            <p className="text-muted-foreground mt-3">Hand-picked sets at a special price.</p>
          </Reveal>
          <Reveal>
            <BundleStrip bundles={bundles} />
          </Reveal>
        </section>
      )}

      {/* FEATURED FROM OTHER CATEGORIES */}
      {featuredOther.length > 0 && (
        <section className="container py-16 border-t">
          <Reveal className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium mb-3">
                Featured
              </p>
              <h2 className="text-3xl md:text-4xl font-serif">More to discover</h2>
            </div>
            <Link href="/products" className="text-sm font-medium text-accent underline-grow hidden md:block">
              View all →
            </Link>
          </Reveal>
          <Reveal className="product-grid" stagger={0.05}>
            {featuredOther.map((p) => (
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
                  isFeatured: p.isFeatured,
                }}
              />
            ))}
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
                  isFeatured: p.isFeatured,
                }}
              />
            ))}
          </Reveal>
        </section>
      )}
    </>
  );
}
