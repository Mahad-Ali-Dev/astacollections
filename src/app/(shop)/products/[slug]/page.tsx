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
            include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
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
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    take: 4,
  });
  if (related.length < 4) {
    const more = await prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: product.categoryId,
        id: { not: product.id, notIn: related.map((r) => r.id) },
      },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      take: 4 - related.length,
    });
    related = [...related, ...more];
  }

  // New arrivals (excluding current)
  const newArrivals = await prisma.product.findMany({
    where: { isActive: true, id: { not: product.id } },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  // Admin can switch the product page's review list between this product's
  // own reviews and every approved review in the store.
  const reviewScope = settings.productReviewsScope === "all" ? "all" : "product";
  const reviewWhere =
    reviewScope === "all"
      ? { status: "APPROVED" as const }
      : { productId: product.id, status: "APPROVED" as const };

  // The visible list is capped, but the rating summary must describe every
  // approved review — deriving it from the capped list understated both the
  // count and the average once a product passed the cap.
  const [reviews, ratingGroups, ownRatingGroups, ownReviews, policy] = await Promise.all([
    prisma.review.findMany({
      where: reviewWhere,
      orderBy: { createdAt: "desc" },
      take: 50,
      include:
        reviewScope === "all"
          ? { product: { select: { name: true, slug: true } } }
          : undefined,
    }),
    prisma.review.groupBy({
      by: ["rating"],
      where: reviewWhere,
      _count: { _all: true },
    }),
    // Structured data must describe THIS product, whatever the display scope
    // is, and only reviews shoppers submitted through the site. Those always
    // carry an email (the public form requires one); rows added with the
    // admin bulk importer have none and can't be shown to be genuine buyer
    // reviews, which Google's review-snippet policy requires — marking them up
    // risks a structured-data manual action. They still display on the page.
    prisma.review.groupBy({
      by: ["rating"],
      where: { productId: product.id, status: "APPROVED" as const, customerEmail: { not: "" } },
      _count: { _all: true },
    }),
    prisma.review.findMany({
      where: { productId: product.id, status: "APPROVED" as const, customerEmail: { not: "" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { customerName: true, rating: true, body: true, createdAt: true },
    }),
    getStorePolicy(),
  ]);

  const reviewCount = ratingGroups.reduce((n, g) => n + g._count._all, 0);
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratingGroups.find((g) => g.rating === star)?._count._all ?? 0,
  }));

  const customer = await getCustomerFromCookie();

  const avgRating =
    reviewCount > 0
      ? ratingGroups.reduce((sum, g) => sum + g.rating * g._count._all, 0) / reviewCount
      : 0;

  // Product-only, site-submitted figures for JSON-LD (see the query above).
  const ownGroups = ownRatingGroups;
  const ownCount = ownGroups.reduce((n, g) => n + g._count._all, 0);
  const ownAvg =
    ownCount > 0
      ? ownGroups.reduce((sum, g) => sum + g.rating * g._count._all, 0) / ownCount
      : 0;

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
    reviews: ownReviews.map((r) => ({
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
        avgRating={avgRating}
        reviewCount={reviewCount}
        codAdvance={money.codAdvance}
      />

      <SectionSlot page="product" slot="detail" />

      <ReviewsSection
        productId={product.id}
        initialReviews={reviews.map((r) => ({
          id: r.id,
          customerName: r.customerName,
          rating: r.rating,
          title: r.title,
          body: r.body,
          createdAt: r.createdAt.toISOString(),
        }))}
        customer={customer ? { id: customer.id, name: customer.name, email: customer.email } : null}
        totalCount={reviewCount}
        averageRating={avgRating}
        distribution={ratingDistribution}
        scope={reviewScope}
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
