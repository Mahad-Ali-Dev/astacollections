import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/seo";
import { COLLECTION_COPY } from "@/lib/collection-copy";
import { codLine, deliveryLine, getStorePolicy } from "@/lib/store-policy";
import { formatPrice } from "@/lib/utils";
import { GUIDES } from "@/lib/guides";

// llms.txt (https://llmstxt.org): a plain-markdown map of the site for AI
// assistants and answer engines. Generated from the database so collections,
// prices and policies stay current without a deploy.
export const dynamic = "force-dynamic";

export async function GET() {
  const [categories, priceAgg, policy] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.product.aggregate({
      where: { isActive: true },
      _min: { price: true },
      _max: { price: true },
      _count: { _all: true },
    }),
    getStorePolicy(),
  ]);

  const collections = categories
    .map((c) => {
      const copy = COLLECTION_COPY[c.slug];
      const name = copy?.h1 ?? c.name.trim();
      return `- [${name}](${SITE.url}/category/${c.slug})${copy ? `: ${copy.description}` : ""}`;
    })
    .join("\n");

  const guideLines = GUIDES.map(
    (g) => `- [${g.title}](${SITE.url}/guides/${g.slug}): ${g.description}`
  ).join("\n");

  const min = priceAgg._min.price;
  const max = priceAgg._max.price;

  const body = `# ${SITE.name}

> ${SITE.description}

${SITE.name} is an online jewellery store based in ${SITE.contact.city}, ${SITE.contact.countryName}. It sells ${priceAgg._count._all} pieces of stainless steel fashion jewellery with gold-tone and silver-tone finishes${
    min != null && max != null ? `, priced from ${formatPrice(min)} to ${formatPrice(max)} (Pakistani rupees)` : ""
  }. It does not sell solid gold, sterling silver or bridal sets.

## Ordering and delivery

- Payment: ${codLine(policy)}${policy.bankEnabled ? "; bank transfer also accepted" : ""}.
- Delivery: ${deliveryLine(policy)}${
    policy.shippingFee > 0 ? `; otherwise ${formatPrice(policy.shippingFee)}` : ""
  }. Dispatched in 1–2 business days, delivered in 3–5 business days anywhere in Pakistan.
- Returns: ${policy.returnDays} days from delivery for unworn pieces in original packaging; earrings only if faulty.
- Contact: WhatsApp ${SITE.contact.phoneDisplay}, email ${SITE.contact.email}.

## Collections

${collections}

## Guides

${guideLines}

## Key pages

- [All jewellery](${SITE.url}/products): full catalogue with prices
- [FAQ](${SITE.url}/faq): cash on delivery, delivery charges, ring sizes, care
- [Shipping and returns](${SITE.url}/shipping)
- [About](${SITE.url}/about)
- [Contact](${SITE.url}/contact)
- [Sitemap](${SITE.url}/sitemap.xml): every product URL
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
