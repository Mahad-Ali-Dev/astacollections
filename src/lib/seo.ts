export const SITE = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://astacollections.com",
  name: "Asta Collections",
  legalName: "Asta Collections",
  description:
    "Handpicked jewellery for every occasion — rings, necklaces, earrings, bracelets, and bridal sets. Crafted with care, delivered across Pakistan.",
  short: "Timeless jewellery, crafted with care.",
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
    streetAddress: "Lahore",
    city: "Lahore",
    region: "Punjab",
    country: "PK",
    countryName: "Pakistan",
  },
  keywords: [
    "jewellery Pakistan",
    "online jewellery store Pakistan",
    "Asta Collections",
    "rings Pakistan",
    "necklaces",
    "earrings",
    "bracelets",
    "bridal jewellery",
    "kundan sets",
    "pearl jewellery",
    "gold-plated jewellery",
    "wedding jewellery Lahore",
    "buy jewellery online Pakistan",
    "COD jewellery store",
  ],
};

/** Organization JSON-LD — emit once on home page for Google Knowledge Graph */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.url}#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: {
      "@type": "ImageObject",
      url: `${SITE.url}${SITE.logoUrl}`,
      width: 600,
      height: 600,
    },
    image: `${SITE.url}${SITE.defaultImage}`,
    description: SITE.description,
    sameAs: [
      SITE.social.instagram,
      SITE.social.facebook,
      SITE.social.tiktok,
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: SITE.contact.phone,
        contactType: "Customer Service",
        areaServed: SITE.contact.country,
        availableLanguage: ["en", "ur"],
        email: SITE.contact.email,
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.contact.streetAddress,
      addressLocality: SITE.contact.city,
      addressRegion: SITE.contact.region,
      addressCountry: SITE.contact.country,
    },
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
      item: it.url.startsWith("http") ? it.url : `${SITE.url}${it.url}`,
    })),
  };
}

/** Product JSON-LD with reviews + aggregate rating */
export function productJsonLd(p: {
  name: string;
  description: string;
  sku: string;
  images: string[];
  category?: string;
  price: number;
  currency?: string;
  inStock: boolean;
  url: string;
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
    image: p.images.map((img) => (img.startsWith("http") ? img : `${SITE.url}${img}`)),
    category: p.category,
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      url: p.url.startsWith("http") ? p.url : `${SITE.url}${p.url}`,
      priceCurrency: p.currency ?? "PKR",
      price: p.price,
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${SITE.url}#organization` },
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

/** LocalBusiness / Store JSON-LD */
export function storeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: SITE.name,
    image: `${SITE.url}${SITE.defaultImage}`,
    "@id": `${SITE.url}#store`,
    url: SITE.url,
    telephone: SITE.contact.phone,
    priceRange: "Rs. 1,000 – Rs. 35,000",
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.contact.streetAddress,
      addressLocality: SITE.contact.city,
      addressRegion: SITE.contact.region,
      addressCountry: SITE.contact.country,
    },
    openingHours: "Mo-Sa 10:00-19:00",
    paymentAccepted: "Cash on Delivery, Bank Transfer",
    currenciesAccepted: "PKR",
  };
}
