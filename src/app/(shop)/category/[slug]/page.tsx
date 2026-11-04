import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/shop/product-card";
import { BundleStrip } from "@/components/shop/bundle-strip";
import { Reveal } from "@/components/motion/reveal";
import { SectionSlot } from "@/components/shop/section-slot";
import { TrustLine } from "@/components/shop/trust-strip";
import { CatalogToolbar } from "@/components/shop/catalog-toolbar";
import { HeaderPhoto } from "@/components/shop/lifestyle-photo";
import { LIFESTYLE } from "@/lib/lifestyle-images";
import { applyCatalog, facetCounts } from "@/lib/product-facets";
import { COLLECTION_COPY, fillRange } from "@/lib/collection-copy";
import { guidesForCollections } from "@/lib/guides";
import { getStorePolicy } from "@/lib/store-policy";
import { formatPrice } from "@/lib/utils";
import {
  pageMeta,
  clip,
  breadcrumbJsonLd,
  itemListJsonLd,
  faqJsonLd,
  jsonLdString,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Recursively walk Category.parentId children to gather the full subtree.
 * Returns the root id plus every descendant id, so a category page can show
 * products that admins assigned to subcategories.
 */
async function collectDescendantCategoryIds(rootId: string): Promise<string[]> {
  const result: string[] = [rootId];
  let frontier: string[] = [rootId];
  // BFS — most stores will be 2-3 levels deep, this stays trivially cheap.
  while (frontier.length > 0) {
    const next = await prisma.category.findMany({
      where: { parentId: { in: frontier }, isActive: true },
      select: { id: true },
    });
    if (next.length === 0) break;
    const ids = next.map((c) => c.id);
    result.push(...ids);
    frontier = ids;
  }
  return result;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await prisma.category.findUnique({ where: { slug } });
  // notFound() here (not just in the page) so crawlers get a real 404 status:
  // metadata resolves before the streamed shell, the page body does not.
  if (!c || !c.isActive) notFound();
  const copy = COLLECTION_COPY[c.slug];
  return pageMeta({
    title: copy?.title ?? `${c.name.trim()}: Price in Pakistan`,
    description: copy?.description ?? clip(c.description ?? `Shop ${c.name.trim()} at Asta Collections. Cash on delivery across Pakistan.`),
    path: `/category/${c.slug}`,
    image: c.image,
  });
}

function priceRange(prices: number[]): string {
  if (prices.length === 0) return "";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `${formatPrice(min)} to ${formatPrice(max)}`;
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; price?: string; tone?: string; stone?: string; inStock?: string }>;
}) {
  const { slug } = await params;
  const filters = await searchParams;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category || !category.isActive) notFound();
  const copy = COLLECTION_COPY[category.slug];
  const heading = copy?.h1 ?? category.name.trim();

  // Walk the category tree to collect this category + all descendant subcategories.
  // Then query products across the entire subtree so a parent like "Necklaces" shows
  // items even when admins assigned them to a child like "Pearl Necklaces".
  const allCategoryIds = await collectDescendantCategoryIds(category.id);

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { categoryId: { in: allCategoryIds } },
        // Products whose primary category is elsewhere but that were also
        // added to this one.
        { extraCategories: { some: { id: { in: allCategoryIds } } } },
      ],
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 2 },
      _count: { select: { attributes: true } },
      category: { select: { slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filters and sort are for display only (range + JSON-LD use the full set).
  const facetable = products.map((p) => ({ ...p, categorySlug: p.category.slug }));
  const shown = applyCatalog(facetable, filters);
  const facets = facetCounts(facetable, filters);

  // Featured + New Arrivals (across other categories) for the discovery sections at the bottom.
  // "Other" = anything outside this category's subtree.
  const [featuredOther, newArrivals, bundles, policy, parent, siblings] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        categoryId: { notIn: allCategoryIds },
        NOT: { extraCategories: { some: { id: { in: allCategoryIds } } } },
      },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } },
      take: 4,
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: { notIn: allCategoryIds },
        NOT: { extraCategories: { some: { id: { in: allCategoryIds } } } },
      },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } },
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
            product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } } },
          },
        },
      },
    }),
    getStorePolicy(),
    category.parentId
      ? prisma.category.findUnique({
          where: { id: category.parentId },
          select: { name: true, slug: true },
        })
      : Promise.resolve(null),
    // Related collections for internal linking: same parent, or the other
    // top-level collections when this one has no parent.
    prisma.category.findMany({
      where: { isActive: true, parentId: category.parentId, id: { not: category.id } },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true },
    }),
  ]);

  const range = priceRange(products.map((p) => p.price));
  // Collections added later in the admin have no entry in COLLECTION_COPY;
  // they fall back to the description typed in the admin.
  const intro = copy
    ? copy.intro.map((t) => fillRange(t, range))
    : category.description
      ? [category.description]
      : [];
  const faqs = copy?.faqs ?? [];
  const guides = guidesForCollections([category.slug, ...(parent ? [parent.slug] : [])]).slice(0, 3);
  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Shop", url: "/products" },
    ...(parent ? [{ name: COLLECTION_COPY[parent.slug]?.h1 ?? parent.name.trim(), url: `/category/${parent.slug}` }] : []),
    { name: heading, url: `/category/${category.slug}` },
  ];
  const jsonLd = [
    breadcrumbJsonLd(crumbs),
    itemListJsonLd(heading, products),
    ...(faqs.length > 0 ? [faqJsonLd(faqs)] : []),
  ];

  // Fetch subcategories (children of this category)
  const subcategories = await prisma.category.findMany({
    where: { parentId: category.id, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />

      {/* Short header, so products start high on the page. The intro copy lives
          in "About this collection" below the grid. */}
      <section className="relative overflow-hidden border-b border-border/70 bg-secondary/40">
        <HeaderPhoto src={LIFESTYLE.driedVase} />
        <div className="container relative py-5 md:py-7">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
              {crumbs.map((c, i) => (
                <li key={c.url} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden="true">/</span>}
                  {i < crumbs.length - 1 ? (
                    <Link href={c.url} className="underline-offset-2 hover:text-foreground hover:underline">
                      {c.name}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-foreground">{c.name}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <h1 className="mt-2 font-serif text-3xl leading-tight text-balance md:text-5xl">{heading}</h1>
          <div className="mt-2">
            <TrustLine policy={policy} />
          </div>

          {/* Subcategory pills: one swipeable row on phones; wrapped from md. */}
          {subcategories.length > 0 && (
            <div className="no-scrollbar -mx-4 mt-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
              {subcategories.map((sc) => (
                <Link
                  key={sc.id}
                  href={`/category/${sc.slug}`}
                  className="press inline-flex h-11 shrink-0 snap-start items-center whitespace-nowrap rounded-full border border-border bg-white px-4 text-sm transition-colors hover:border-accent hover:text-accent"
                >
                  {COLLECTION_COPY[sc.slug]?.h1 ?? sc.name.trim()}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="container py-5 md:py-8">
        {products.length > 0 && (
          <div className="mb-6 border-b border-border/70 pb-4 md:mb-8">
            <CatalogToolbar count={shown.length} facets={facets} />
          </div>
        )}
        {products.length === 0 || shown.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-border bg-secondary/30 px-6 py-16 text-center">
            <p className="font-serif text-2xl">{products.length === 0 ? "New pieces are on the way" : "Nothing matches those filters"}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {products.length === 0 ? "This collection is being restocked." : "Try removing a filter to see more pieces."}
            </p>
            <Link
              href={products.length === 0 ? "/products" : `/category/${category.slug}`}
              className="press mt-6 inline-flex h-12 items-center rounded-full bg-foreground px-6 text-xs font-semibold uppercase tracking-[0.18em] text-background"
            >
              {products.length === 0 ? "Shop all jewellery" : "Clear filters"}
            </Link>
          </div>
        ) : (
          <Reveal className="product-grid" stagger={0.05}>
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
          </Reveal>
        )}
      </div>

      {/* The admin's "top" slot renders under the grid so products stay on the first screen. */}
      <SectionSlot page="category" slot="top" />

      {/* ABOUT THIS COLLECTION — helpful copy + FAQs + related collections */}
      {(intro.length > 0 || faqs.length > 0 || siblings.length > 0 || guides.length > 0) && (
        <section className="container pb-6">
          <div className="grid gap-10 md:grid-cols-2 md:gap-16 border-t pt-12">
            <div className="space-y-4 max-w-prose">
              <h2 className="text-2xl md:text-3xl font-serif">About our {heading.toLowerCase()}</h2>
              {intro.map((t) => (
                <p key={t} className="text-sm md:text-base text-muted-foreground leading-relaxed">{t}</p>
              ))}
              {siblings.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-3">Related collections</p>
                  <ul className="flex flex-wrap gap-2">
                    {siblings.map((sc) => (
                      <li key={sc.slug}>
                        <Link
                          href={`/category/${sc.slug}`}
                          className="px-4 h-10 inline-flex items-center rounded-full border border-border text-sm hover:border-accent hover:text-accent transition-colors"
                        >
                          {COLLECTION_COPY[sc.slug]?.h1 ?? sc.name.trim()}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {guides.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-3">Helpful guides</p>
                  <ul className="space-y-2">
                    {guides.map((g) => (
                      <li key={g.slug}>
                        <Link href={`/guides/${g.slug}`} className="text-sm underline underline-offset-4 hover:text-accent">
                          {g.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {faqs.length > 0 && (
              <div>
                <h2 className="text-2xl md:text-3xl font-serif mb-4">Questions</h2>
                <div className="divide-y border-y">
                  {faqs.map((f) => (
                    <details key={f.q} className="group py-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                        {f.q}
                        <span aria-hidden="true" className="text-accent text-xl transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

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
                  hoverImage: p.images[1]?.url,
                  hasOptions: p._count.attributes > 0,
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
                  hoverImage: p.images[1]?.url,
                  hasOptions: p._count.attributes > 0,
                  isFeatured: p.isFeatured,
                }}
              />
            ))}
          </Reveal>
        </section>
      )}

      <SectionSlot page="category" slot="end" />
    </>
  );
}
