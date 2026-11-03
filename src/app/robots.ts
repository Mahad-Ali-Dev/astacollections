import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Cart, checkout, account and order pages are deliberately NOT
        // disallowed: they carry a noindex tag, and Google can only see that
        // tag (and drop any already-indexed copies) if it may crawl them.
        // A separate Googlebot group used to override these rules entirely.
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
