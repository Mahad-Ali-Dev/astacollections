import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/seo";

// Built per request from the database so new products appear without a deploy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        updatedAt: true,
        images: { orderBy: { sortOrder: "asc" }, take: 4, select: { url: true } },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  // Only pages worth ranking. Login, register, cart and checkout are noindex
  // and stay out; track-order is a utility page with nothing to rank for.
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, priority: 1.0, changeFrequency: "weekly" },
    { url: `${SITE.url}/products`, priority: 0.9, changeFrequency: "daily" },
    { url: `${SITE.url}/faq`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${SITE.url}/shipping`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${SITE.url}/about`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${SITE.url}/contact`, priority: 0.5, changeFrequency: "monthly" },
  ];

  return [
    ...staticPages,
    ...categories.map((c) => ({
      url: `${SITE.url}/category/${c.slug}`,
      lastModified: c.updatedAt,
      priority: 0.8,
      changeFrequency: "weekly" as const,
    })),
    ...products.map((p) => ({
      url: `${SITE.url}/products/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.7,
      changeFrequency: "weekly" as const,
      // Image sitemap entries help product photos show in Google Images.
      images: p.images.map((i) => i.url),
    })),
  ];
}
