import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductDetail } from "@/components/shop/product-detail";
import { ProductCard } from "@/components/shop/product-card";
import { ReviewsSection } from "@/components/shop/reviews-section";
import { Reveal } from "@/components/motion/reveal";
import { parseTags } from "@/lib/tags";
import { getCustomerFromCookie } from "@/lib/auth";
import { getSettings, settingsToNumbers } from "@/lib/settings";
import { getStorePolicy } from "@/lib/store-policy";
import { productJsonLd, breadcrumbJsonLd, pageMeta, clip, jsonLdString } from "@/lib/seo";
import { COLLECTION_COPY } from "@/lib/collection-copy";
import { formatPrice } from "@/lib/utils";
import { SectionSlot } from "@/components/shop/section-slot";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });
  // notFound() in metadata so crawlers get a real 404 (the page body streams
  // after a 200 has already been sent).
  if (!product || !product.isActive) notFound();
  const base = (product.metaTitle ?? product.name).trim();
  // "<name> Price in Pakistan" matches how shoppers search here; only add it
  // when the admin's title doesn't already say so and there's room.
  const title =
    /pakistan/i.test(base) || base.length > 42 ? base : `${base}: Price in Pakistan`;
  const source = product.metaDesc ?? product.shortDesc ?? product.description;
  const description = `${clip(source, 115)} ${formatPrice(product.price)}, cash on delivery across Pakistan.`;
  return pageMeta({
    title,
    description,
    path: `/products/${product.slug}`,
    image: product.images[0]?.url,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const settings = await getSettings();
  const money = settingsToNumbers(settings);
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
      attributes: {
        orderBy: { sortOrder: "asc" },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  if (!product || !product.isActive) notFound();

  const tags = parseTags(product.tags);

  // Find an active bundle that includes this product
  const bundle = await prisma.bundle.findFirst({
    where: {
      isActive: true,
      items: { some: { productId: product.id } },
    },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } },
          },
        },
      },
    },
  });

  // Related products: prefer same tags, fall back to category
  let related = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      OR: tags.length > 0 ? tags.map((t) => ({ tags: { contains: t } })) : undefined,
    },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } },
    take: 4,
  });
  if (related.length < 4) {
    const more = await prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: product.categoryId,
        id: { not: product.id, notIn: related.map((r) => r.id) },
      },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } },
      take: 4 - related.length,
    });
    related = [...related, ...more];
  }

  // New arrivals (excluding current)
  const newArrivals = await prisma.product.findMany({
    where: { isActive: true, id: { not: product.id } },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  // Reviews. A product page shows THIS product's reviews and count. The admin
  // "show all store reviews" option used to replace them with the store-wide
  // list and totals (every product read "4.7 · 951 reviews"); now it only
  // fills in, clearly labelled as store reviews, when a product has none.
  const ownWhere = { productId: product.id, status: "APPROVED" as const };
  const [ownGroups, ownList, policy] = await Promise.all([
    prisma.review.groupBy({ by: ["rating"], where: ownWhere, _count: { _all: true } }),
    prisma.review.findMany({ where: ownWhere, orderBy: { createdAt: "desc" }, take: 50 }),
    getStorePolicy(),
  ]);
  const ownCount = ownGroups.reduce((n, g) => n + g._count._all, 0);
  const ownAvg =
    ownCount > 0 ? ownGroups.reduce((sum, g) => sum + g.rating * g._count._all, 0) / ownCount : 0;

  const useStoreReviews = settings.productReviewsScope === "all" && ownCount === 0;
  const [storeGroups, storeList] = useStoreReviews
    ? await Promise.all([
        prisma.review.groupBy({ by: ["rating"], where: { status: "APPROVED" as const }, _count: { _all: true } }),
        prisma.review.findMany({
          where: { status: "APPROVED" as const },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { product: { select: { name: true, slug: true } } },
        }),
      ])
    : [null, null];

  const shownGroups = storeGroups ?? ownGroups;
  const shownCount = shownGroups.reduce((n, g) => n + g._count._all, 0);
  const shownAvg =
    shownCount > 0 ? shownGroups.reduce((sum, g) => sum + g.rating * g._count._all, 0) / shownCount : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: shownGroups.find((g) => g.rating === star)?._count._all ?? 0,
  }));
  const shownReviews = (storeList ?? ownList).map((r) => ({
    id: r.id,
    customerName: r.customerName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    verified: r.verified,
    createdAt: r.createdAt.toISOString(),
    product: "product" in r ? (r as { product: { name: string; slug: string } | null }).product : null,
  }));

  const customer = await getCustomerFromCookie();

  const jsonLd = productJsonLd({
    name: product.name.trim(),
    description: clip(product.shortDesc ?? product.description, 500),
    sku: product.sku,
    images: product.images.map((i) => i.url),
    category: product.category.name.trim(),
    material: product.material,
    price: product.price,
    inStock: product.stock > 0,
    url: `/products/${product.slug}`,
    policy,
    reviewCount: ownCount,
    ratingValue: ownAvg,
    reviews: ownList.slice(0, 5).map((r) => ({
      author: r.customerName,
      rating: r.rating,
      body: r.body,
      datePublished: r.createdAt.toISOString(),
    })),
  });

  const categoryLabel = COLLECTION_COPY[product.category.slug]?.h1 ?? product.category.name.trim();
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Shop", url: "/products" },
    { name: categoryLabel, url: `/category/${product.category.slug}` },
    { name: product.name, url: `/products/${product.slug}` },
  ]);

  return (
    <div className="container py-6 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString([jsonLd, breadcrumbs]) }}
      />

      <nav className="flex items-center text-xs text-muted-foreground mb-6 flex-wrap" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3 mx-1" />
        <Link href="/products" className="hover:text-foreground">Shop</Link>
        <ChevronRight className="h-3 w-3 mx-1" />
        <Link href={`/category/${product.category.slug}`} className="hover:text-foreground">
          {categoryLabel}
        </Link>
        <ChevronRight className="h-3 w-3 mx-1" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <ProductDetail
        product={{ ...product, tagsList: tags } as any}
        bundle={bundle as any}
        shippingFee={money.shippingFee}
        freeShippingThreshold={money.freeShippingThreshold}
        avgRating={ownAvg}
        reviewCount={ownCount}
        codAdvance={money.codAdvance}
        categoryLabel={categoryLabel}
      />

      <SectionSlot page="product" slot="detail" />

      <ReviewsSection
        productId={product.id}
        initialReviews={shownReviews}
        customer={customer ? { id: customer.id, name: customer.name, email: customer.email } : null}
        totalCount={shownCount}
        averageRating={shownAvg}
        distribution={ratingDistribution}
        scope={useStoreReviews ? "all" : "product"}
      />

      <SectionSlot page="product" slot="reviews" />

      {related.length > 0 && (
        <section className="mt-24">
          <Reveal className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium mb-3">
              You may also like
            </p>
            <h2 className="text-3xl md:text-4xl font-serif">More from this style</h2>
            <Link
              href={`/category/${product.category.slug}`}
              className="inline-block mt-4 text-sm font-medium underline underline-offset-4 hover:text-accent"
            >
              Shop all {categoryLabel.toLowerCase()}
            </Link>
          </Reveal>
          <Reveal className="product-grid" stagger={0.06}>
            {related.map((p) => (
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

      <SectionSlot page="product" slot="related" />

      {newArrivals.length > 0 && (
        <section className="mt-20 bg-secondary/40 -mx-4 md:-mx-8 px-4 md:px-8 py-16 rounded-3xl">
          <Reveal className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium mb-3">
              Just In
            </p>
            <h2 className="text-3xl md:text-4xl font-serif">New Arrivals</h2>
            <p className="text-muted-foreground mt-3">Fresh additions to the collection.</p>
          </Reveal>
          <Reveal className="product-grid" stagger={0.06}>
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

      <SectionSlot page="product" slot="end" />
    </div>
  );
}
