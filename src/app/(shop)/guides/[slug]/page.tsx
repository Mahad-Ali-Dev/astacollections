import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { GUIDES, getGuide, type GuideBlock } from "@/lib/guides";
import { guidePlaceholders, fillPlaceholders, guideProducts } from "@/lib/guide-data";
import { GuideText } from "@/components/shop/guide-text";
import { ProductCard } from "@/components/shop/product-card";
import { LifestylePhoto } from "@/components/shop/lifestyle-photo";
import { LIFESTYLE } from "@/lib/lifestyle-images";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  faqJsonLd,
  jsonLdString,
  pageMeta,
  SITE,
} from "@/lib/seo";
import { formatDate } from "@/lib/utils";

// Prices in the copy and the product grid are live.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  return {
    ...pageMeta({ title: guide.metaTitle, description: guide.description, path: `/guides/${guide.slug}` }),
    openGraph: {
      type: "article",
      title: guide.metaTitle,
      description: guide.description,
      url: `/guides/${guide.slug}`,
      siteName: SITE.name,
      publishedTime: guide.published,
      modifiedTime: guide.updated,
    },
  };
}

/** Every string in the guide, so placeholders can be resolved in one pass. */
function allText(guide: NonNullable<ReturnType<typeof getGuide>>): string[] {
  const out = [guide.summary];
  for (const s of guide.sections) {
    for (const b of s.blocks) {
      if (typeof b === "string") out.push(b);
      else if ("list" in b) out.push(...b.list);
    }
  }
  return out;
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const [values, products] = await Promise.all([
    guidePlaceholders(allText(guide)),
    guideProducts(guide.shop.categorySlugs, guide.shop.maxPrice),
  ]);
  const fill = (t: string) => fillPlaceholders(t, values);

  const url = `/guides/${guide.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      datePublished: guide.published,
      dateModified: guide.updated,
      mainEntityOfPage: absoluteUrl(url),
      inLanguage: "en-PK",
      author: { "@type": "Organization", name: SITE.name, url: SITE.url },
      publisher: { "@id": `${SITE.url}#organization` },
      image: absoluteUrl(SITE.defaultImage),
      ...(guide.sources.length > 0 ? { citation: guide.sources.map((s) => s.url) } : {}),
    },
    breadcrumbJsonLd([
      { name: "Home", url: "/" },
      { name: "Guides", url: "/guides" },
      { name: guide.title, url },
    ]),
    ...(guide.faqs.length > 0 ? [faqJsonLd(guide.faqs)] : []),
  ];
  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <article className="container py-8 md:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />

      <div className="max-w-2xl mx-auto">
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-3 w-3 mx-1" aria-hidden="true" />
          <Link href="/guides" className="hover:text-foreground">Guides</Link>
          <ChevronRight className="h-3 w-3 mx-1" aria-hidden="true" />
          <span className="text-foreground" aria-current="page">{guide.title}</span>
        </nav>

        <header>
          <h1 className="display-2">{guide.title}</h1>
          <p className="mt-3 text-xs text-muted-foreground">
            By {SITE.name} · Updated <time dateTime={guide.updated}>{formatDate(guide.updated)}</time> · {guide.readMins} min read
          </p>
        </header>

        {guide.slug === "jewellery-gift-ideas-for-her-under-2000" && (
          <LifestylePhoto
            src={LIFESTYLE.bouquetHand}
            sizes="(max-width:768px) 100vw, 672px"
            className="mt-8 h-52 md:h-72"
            imageClassName="object-[50%_35%]"
          />
        )}

        {/* The short answer first */}
        <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-5 md:p-6">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-accent mb-2">The short answer</p>
          <p className="leading-relaxed"><GuideText text={fill(guide.summary)} /></p>
        </div>

        <div className="mt-10 space-y-10">
          {guide.sections.map((s) => (
            <section key={s.heading} className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-serif">{s.heading}</h2>
              {s.blocks.map((b, i) => (
                <Block key={i} block={b} fill={fill} />
              ))}
            </section>
          ))}

          {guide.faqs.length > 0 && (
            <section>
              <h2 className="text-2xl md:text-3xl font-serif mb-4">Questions</h2>
              <div className="divide-y border-y">
                {guide.faqs.map((f) => (
                  <details key={f.q} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                      {f.q}
                      <span aria-hidden="true" className="text-accent text-xl transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {guide.sources.length > 0 && (
            <section className="text-sm">
              <h2 className="text-xs uppercase tracking-[0.2em] font-semibold mb-3">Sources</h2>
              <ul className="space-y-1.5 text-muted-foreground">
                {guide.sources.map((src) => (
                  <li key={src.url}>
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground">
                      {src.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {products.length > 0 && (
        <section className="mt-16 md:mt-20">
          <h2 className="text-2xl md:text-3xl font-serif text-center mb-8">{guide.shop.heading}</h2>
          <div className="product-grid">
            {products.map((p) => (
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
        </section>
      )}

      <section className="mt-16 max-w-5xl mx-auto border-t pt-10">
        <h2 className="text-xl font-serif mb-5">More guides</h2>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {others.map((g) => (
            <li key={g.slug}>
              <Link href={`/guides/${g.slug}`} className="block rounded-xl border p-4 h-full hover:border-accent transition-colors">
                <span className="font-medium leading-snug">{g.title}</span>
                <span className="block text-xs text-muted-foreground mt-1">{g.readMins} min read</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

function Block({ block, fill }: { block: GuideBlock; fill: (t: string) => string }) {
  if (typeof block === "string") {
    return <p className="text-muted-foreground leading-relaxed"><GuideText text={fill(block)} /></p>;
  }
  if ("list" in block) {
    const Tag = block.ordered ? "ol" : "ul";
    return (
      <Tag className={`space-y-2 pl-5 text-muted-foreground leading-relaxed ${block.ordered ? "list-decimal" : "list-disc"}`}>
        {block.list.map((item) => (
          <li key={item}><GuideText text={fill(item)} /></li>
        ))}
      </Tag>
    );
  }
  const { head, rows, caption } = block.table;
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        {caption && <caption className="caption-bottom p-3 text-xs text-muted-foreground text-left">{caption}</caption>}
        <thead className="bg-secondary/60">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-2.5 text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-t">
              {r.map((c, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="px-4 py-2.5 text-left font-medium">{c}</th>
                ) : (
                  <td key={i} className="px-4 py-2.5 tabular-nums">{c}</td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
