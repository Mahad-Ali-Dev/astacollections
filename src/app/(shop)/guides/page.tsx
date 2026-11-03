import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GUIDES } from "@/lib/guides";
import { breadcrumbJsonLd, jsonLdString, pageMeta, absoluteUrl, SITE } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Jewellery Guides: Care, Ring Sizes and Gift Ideas",
  description:
    "Practical guides from Asta Collections: does stainless steel tarnish, how to clean it, how to find your ring size, choosing couple rings, and gift ideas under Rs. 2,000.",
  path: "/guides",
});

export default function GuidesIndexPage() {
  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", url: "/" },
      { name: "Guides", url: "/guides" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Jewellery guides",
      url: absoluteUrl("/guides"),
      isPartOf: { "@id": `${SITE.url}#website` },
      hasPart: GUIDES.map((g) => ({ "@type": "Article", headline: g.title, url: absoluteUrl(`/guides/${g.slug}`) })),
    },
  ];
  return (
    <section className="container py-12 md:py-20 max-w-5xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
        <p className="eyebrow-accent mb-3">Guides</p>
        <h1 className="display-2">Jewellery guides</h1>
        <p className="text-muted-foreground mt-4 text-pretty">
          Straight answers on caring for stainless steel jewellery, finding your ring size and
          choosing a gift.
        </p>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/guides/${g.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 card-soft card-hover"
            >
              <span className="text-xs text-muted-foreground">{g.readMins} min read</span>
              <h2 className="font-serif text-2xl mt-2 leading-snug group-hover:text-accent transition-colors">
                {g.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">{g.description}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] font-semibold">
                Read guide <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
