import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/shop/product-card";
import { CatalogToolbar } from "@/components/shop/catalog-toolbar";
import { applyCatalog, facetCounts } from "@/lib/product-facets";
import { COLLECTION_COPY } from "@/lib/collection-copy";
import { BundleStrip } from "@/components/shop/bundle-strip";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import type { Prisma } from "@prisma/client";
import { SectionSlot } from "@/components/shop/section-slot";
import { TrustLine } from "@/components/shop/trust-strip";
import { getStorePolicy } from "@/lib/store-policy";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  sort?: string;
  category?: string;
  tone?: string;
  stone?: string;
  price?: string;
  inStock?: string;
}>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  // Search results and filter combinations are thin near-duplicates of this
  // page: keep them out of the index but let crawlers follow product links.
  const filtered = Boolean(
    params.q || params.category || params.tone || params.stone || params.price || params.inStock || params.sort
  );
  return pageMeta({
    title: "Stainless Steel Jewellery Online in Pakistan: Shop All",
    description:
      "Shop all Asta Collections jewellery with prices in Pakistan: stainless steel rings, pendant sets, stud earrings, bracelets and handcuffs. Cash on delivery nationwide.",
    path: "/products",
    noindex: filtered,
  });
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const categorySlug = params.category ?? "";

  // Search narrows the query; every other filter runs on this list in memory
  // (tone and stone are derived from text, see src/lib/product-facets.ts).
  const where: Prisma.ProductWhereInput = { isActive: true };
  if (q) {
    where.OR = [
      // Postgres `contains` is case-sensitive; "ring" must find "Ring".
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { material: { contains: q, mode: "insensitive" } },
      { tags: { contains: q, mode: "insensitive" } },
    ];
  }

  const [rows, categories, bundles, newArrivals, policy] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 2 },
        _count: { select: { attributes: true } },
        category: { select: { slug: true } },
        extraCategories: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, slug: true, name: true, parentId: true },
    }),
    prisma.bundle.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 3,
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } } },
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    getStorePolicy(),
  ]);

  const products = rows.map((p) => ({ ...p, categorySlug: p.category.slug }));

  // Category tree: a parent includes its children; extra-category links count.
  const nameOf = (c: { slug: string; name: string }) => COLLECTION_COPY[c.slug]?.h1 ?? c.name.trim();
  const inCategory = (p: (typeof products)[number], id: string) =>
    p.categoryId === id || p.extraCategories.some((e) => e.id === id);
  const idsFor = (id: string) => [id, ...categories.filter((c) => c.parentId === id).map((c) => c.id)];
  const countFor = (id: string, list: typeof products) => list.filter((p) => idsFor(id).some((i) => inCategory(p, i))).length;

  const selectedCategory = categories.find((c) => c.slug === categorySlug);
  const filters = {
    tone: params.tone,
    stone: params.stone,
    price: params.price,
    inStock: params.inStock,
    sort: params.sort,
  };
  const inScope = selectedCategory
    ? products.filter((p) => idsFor(selectedCategory.id).some((i) => inCategory(p, i)))
    : products;
  const shown = applyCatalog(inScope, filters);
  const facets = facetCounts(inScope, filters);

  // Grouped for the Category filter: Rings (with its styles), Pendants, Earrings...
  const forCounts = products.filter((p) => applyCatalog([p], { ...filters, sort: undefined }).length > 0);
  const categoryOptions = categories
    .filter((c) => !c.parentId)
    .map((c) => ({
      slug: c.slug,
      label: nameOf(c),
      count: countFor(c.id, forCounts),
      children: categories
        .filter((x) => x.parentId === c.id)
        .map((x) => ({ slug: x.slug, label: nameOf(x), count: countFor(x.id, forCounts) }))
        .filter((x) => x.count > 0),
    }))
    .filter((c) => c.count > 0);

  const heading = selectedCategory ? nameOf(selectedCategory) : "All jewellery";

  return (
    <div>
      {/* Short header, so products start high on the page */}
      <section className="border-b border-border/70 bg-secondary/40">
        <div className="container py-6 md:py-8">
          <h1 className="font-serif text-3xl leading-tight text-balance md:text-5xl">
            {q ? (
              <>
                Results for <span className="italic">&ldquo;{q}&rdquo;</span>
              </>
            ) : (
              heading
            )}
          </h1>
          <div className="mt-2">
            <TrustLine policy={policy} />
          </div>
        </div>
      </section>

      <SectionSlot page="products" slot="top" />

      <div className="container py-5 md:py-8">
        <div className="mb-6 border-b border-border/70 pb-4 md:mb-8">
          <CatalogToolbar count={shown.length} facets={facets} categories={categoryOptions} />
        </div>

        {shown.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="product-grid">
            {shown.map((p) => (
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
                  hoverImage: p.images[1]?.url,
                  hasOptions: p._count.attributes > 0,
                  video: p.videoUrl,
                  videoPoster: p.videoPoster,
                  isFeatured: p.isFeatured,
                }}
              />
            ))}
          </div>
        )}
      </div>


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
                  hoverImage: p.images[1]?.url,
                  hasOptions: p._count.attributes > 0,
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
