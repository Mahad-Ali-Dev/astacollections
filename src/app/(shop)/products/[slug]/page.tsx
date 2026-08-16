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
import { productJsonLd, breadcrumbJsonLd, SITE } from "@/lib/seo";
import { VideoCarouselSection } from "@/components/shop/video-carousel-section";

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
  if (!product) return {};
  const description = product.metaDesc ?? product.shortDesc ?? product.description.slice(0, 160);
  const image = product.images[0]?.url;
  return {
    title: product.metaTitle ?? product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: image ? [{ url: image, width: 1200, height: 1200 }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const money = settingsToNumbers(await getSettings());
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

  const reviews = await prisma.review.findMany({
    where: { productId: product.id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const customer = await getCustomerFromCookie();

  const avgRating =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const jsonLd = productJsonLd({
    name: product.name,
    description: product.shortDesc ?? product.description.slice(0, 200),
    sku: product.sku,
    images: product.images.map((i) => i.url),
    category: product.category.name,
    price: product.price,
    inStock: product.stock > 0,
    url: `/products/${product.slug}`,
    reviewCount: reviews.length,
    ratingValue: avgRating,
    reviews: reviews.slice(0, 5).map((r) => ({
      author: r.customerName,
      rating: r.rating,
      body: r.body,
      datePublished: r.createdAt.toISOString(),
    })),
  });

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Shop", url: "/products" },
    { name: product.category.name, url: `/category/${product.category.slug}` },
    { name: product.name, url: `/products/${product.slug}` },
  ]);

  return (
    <div className="container py-6 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbs]) }}
      />

      <nav className="flex items-center text-xs text-muted-foreground mb-6 flex-wrap" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3 mx-1" />
        <Link href="/products" className="hover:text-foreground">Shop</Link>
        <ChevronRight className="h-3 w-3 mx-1" />
        <Link href={`/category/${product.category.slug}`} className="hover:text-foreground">
          {product.category.name}
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
        reviewCount={reviews.length}
      />

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
      />

      {related.length > 0 && (
        <section className="mt-24">
          <Reveal className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium mb-3">
              You may also like
            </p>
            <h2 className="text-3xl md:text-4xl font-serif">More from this style</h2>
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

      <VideoCarouselSection page="product" />
    </div>
  );
}
