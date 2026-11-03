import type { Metadata } from "next";

// NEXT_PUBLIC_SITE_URL is sometimes set with a trailing slash; every URL below
// is built as `${SITE.url}/path`, so strip it once here or canonicals and
// sitemap entries come out as "https://host//path".
const RAW_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://astacollections.com";

export const SITE = {
  url: RAW_URL.replace(/\/+$/, ""),
  name: "Asta Collections",
  legalName: "Asta Collections",
  // Describes what the catalogue actually holds (stainless steel rings,
  // pendants, studs, bracelets and handcuffs). Earlier copy promised bridal,
  // kundan and pearl sets the store does not sell.
  description:
    "Stainless steel jewellery for women and couples in Pakistan: rings, pendants, stud earrings, bracelets and handcuffs in gold and silver finishes. Cash on delivery nationwide.",
  short: "Everyday stainless steel jewellery, delivered across Pakistan.",
  locale: "en_PK",
  language: "en",
  defaultImage: "/opengraph-image",
  logoUrl: "/nav_logo.png",
  twitterHandle: "@astacollections",
  social: {
    instagram: "https://www.instagram.com/astacollections",
    facebook: "https://www.facebook.com/share/1JaNNBZn93/",
    tiktok: "https://www.tiktok.com/@astacollections",
    whatsapp: "https://wa.me/923264348024",
  },
  contact: {
    email: "astacollection14@gmail.com",
    phone: "+923264348024",
    phoneDisplay: "+92 326 4348024",
    city: "Lahore",
    region: "Punjab",
    country: "PK",
    countryName: "Pakistan",
  },
  /** Return window stated on /shipping and the product page. */
  returnDays: 7,
};

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Per-page metadata with a self-referencing canonical. The root layout used to
 * set `alternates.canonical: "/"`, which every page inherited — so Google was
 * told that every product and category was a duplicate of the home page.
 */
export function pageMeta({
  title,
  description,
  path,
  image,
  noindex = false,
  absoluteTitle = false,
}: {
  title: string;
  description?: string;
  path: string;
  image?: string | null;
  noindex?: boolean;
  /** Skip the " | Asta Collections" template (title already carries the brand). */
  absoluteTitle?: boolean;
}): Metadata {
  const images = image ? [{ url: image }] : undefined;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE.name,
      locale: SITE.locale,
      type: "website",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Metadata for private / transactional pages: never indexed, links still followed. */
export function privatePageMeta(title: string): Metadata {
  return { title, robots: { index: false, follow: true } };
}

/** Clip text to a meta-description length on a word boundary. */
export function clip(text: string, max = 155): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

type Policy = { shippingFee: number; freeShippingThreshold: number };

function returnPolicyJsonLd() {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: SITE.contact.country,
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: SITE.returnDays,
    returnMethod: "https://schema.org/ReturnByMail",
  };
}

function shippingDetailsJsonLd(price: number, policy: Policy) {
  const free = policy.freeShippingThreshold > 0 && price >= policy.freeShippingThreshold;
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: free ? 0 : policy.shippingFee,
      currency: "PKR",
    },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: SITE.contact.country },
    // Mirrors /shipping: dispatched in 1–2 business days, delivered in 3–5.
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 5, unitCode: "DAY" },
    },
  };
}

/** Organization JSON-LD — an online-only store, so OnlineStore rather than a physical Store. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${SITE.url}#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SITE.logoUrl),
    },
    image: absoluteUrl(SITE.defaultImage),
    description: SITE.description,
    email: SITE.contact.email,
    telephone: SITE.contact.phone,
    sameAs: [SITE.social.instagram, SITE.social.facebook, SITE.social.tiktok],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: SITE.contact.phone,
        contactType: "customer service",
        areaServed: SITE.contact.country,
        availableLanguage: ["en", "ur"],
        email: SITE.contact.email,
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.contact.city,
      addressRegion: SITE.contact.region,
      addressCountry: SITE.contact.country,
    },
    areaServed: { "@type": "Country", name: SITE.contact.countryName },
    currenciesAccepted: "PKR",
    paymentAccepted: "Cash on Delivery, Bank Transfer",
    hasMerchantReturnPolicy: returnPolicyJsonLd(),
  };
}

/** WebSite JSON-LD with sitelinks search box */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}#website`,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    publisher: { "@id": `${SITE.url}#organization` },
    inLanguage: SITE.language,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/products?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** BreadcrumbList JSON-LD */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.url),
    })),
  };
}

/** Product JSON-LD with offer, shipping, returns and (only genuine) ratings */
export function productJsonLd(p: {
  name: string;
  description: string;
  sku: string;
  images: string[];
  category?: string;
  material?: string | null;
  price: number;
  currency?: string;
  inStock: boolean;
  url: string;
  policy: Policy;
  reviewCount?: number;
  ratingValue?: number;
  reviews?: { author: string; rating: number; body: string; datePublished: string }[];
}) {
  const obj: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    sku: p.sku,
    image: p.images.map(absoluteUrl),
    category: p.category,
    ...(p.material ? { material: p.material.trim() } : {}),
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(p.url),
      priceCurrency: p.currency ?? "PKR",
      price: p.price,
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${SITE.url}#organization` },
      shippingDetails: shippingDetailsJsonLd(p.price, p.policy),
      hasMerchantReturnPolicy: returnPolicyJsonLd(),
    },
  };
  if (p.reviewCount && p.reviewCount > 0 && p.ratingValue) {
    obj.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: p.ratingValue.toFixed(1),
      reviewCount: p.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }
  if (p.reviews && p.reviews.length > 0) {
    obj.review = p.reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.body,
      datePublished: r.datePublished,
    }));
  }
  return obj;
}

/** ItemList JSON-LD for a collection page (links Google to each product URL). */
export function itemListJsonLd(name: string, products: { name: string; slug: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 30).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/products/${p.slug}`),
      name: p.name,
    })),
  };
}

/** FAQPage JSON-LD */
export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Serialize JSON-LD safely for a <script> tag (a "</script>" in copy would end the tag). */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
