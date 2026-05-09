import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, priority: 1.0, changeFrequency: "weekly" },
    { url: `${SITE.url}/products`, priority: 0.95, changeFrequency: "daily" },
    { url: `${SITE.url}/about`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE.url}/contact`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE.url}/faq`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${SITE.url}/shipping`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${SITE.url}/track-order`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE.url}/login`, priority: 0.4, changeFrequency: "yearly" },
    { url: `${SITE.url}/register`, priority: 0.5, changeFrequency: "yearly" },
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
      priority: 0.85,
      changeFrequency: "weekly" as const,
    })),
  ];
}
