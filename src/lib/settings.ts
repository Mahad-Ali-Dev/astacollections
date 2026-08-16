import { prisma } from "./prisma";
import { parseCodAdvance } from "./payment";

export type StoreSettings = {
  storeName: string;
  storeTagline: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  bankName: string;
  bankAccountTitle: string;
  bankAccountNumber: string;
  bankIBAN: string;
  codAdvance: string;
  shippingFee: string;
  freeShippingThreshold: string;
  currency: string;
  currencySymbol: string;

  // ───── Checkout / payment design (admin-configurable) ─────
  // Which methods appear at checkout. "true" / "false".
  codEnabled: string;
  bankTransferEnabled: string;
  // Pre-selected method: "COD" | "BANK_TRANSFER".
  defaultPaymentMethod: string;
  // Per-method copy shown on the selectable cards.
  codTitle: string;
  codBadge: string;            // small ribbon, e.g. "Most Popular" ("" = none)
  codNote: string;             // optional extra instruction line ("" = none)
  bankTransferTitle: string;
  bankTransferBadge: string;
  bankTransferNote: string;
  // Checkout page header text.
  checkoutHeading: string;
  checkoutSubheading: string;

  // ───── UI images / content ─────
  // Hero carousel — 3 slides
  hero1Image: string;
  hero1Eyebrow: string;
  hero1Title: string;
  hero1Accent: string;
  hero1Description: string;
  hero1CtaLabel: string;
  hero1CtaHref: string;

  hero2Image: string;
  hero2Eyebrow: string;
  hero2Title: string;
  hero2Accent: string;
  hero2Description: string;
  hero2CtaLabel: string;
  hero2CtaHref: string;

  hero3Image: string;
  hero3Eyebrow: string;
  hero3Title: string;
  hero3Accent: string;
  hero3Description: string;
  hero3CtaLabel: string;
  hero3CtaHref: string;

  // Editorial banners
  bannerBridalImage: string;
  bannerPromiseImage: string;
  bannerDualLeftImage: string;
  bannerDualRightImage: string;

  // Welcome popup
  popupImage: string;
  popupEnabled: string;

  // About page hero
  aboutHeroImage: string;
  aboutStoryImage: string;

  // Site-wide ribbons
  announcementText: string;
  announcementCode: string;       // optional highlighted code (e.g. "WELCOME10")
  marqueePhrases: string;         // pipe-separated phrases (e.g. "Free shipping above Rs. 5,000|COD across Pakistan")

  // Video carousel — a shoppable strip of short clips. Stored as flat
  // strings like every other setting so it round-trips through the
  // key/value Setting table without a migration.
  videoCarouselEnabled: string;   // "true" | "false"
  videoCarouselTitle: string;
  videoCarouselSubtitle: string;
  videoCarouselPages: string;     // legacy: comma-separated page keys, migrated to placements
  videoCarouselPlacements: string; // JSON map of page key → slot key, e.g. {"home":"bestsellers"}
  videoCarouselItems: string;     // JSON array of VideoCarouselItem
};

/**
 * Where the carousel can sit. Each page exposes named slots matching the
 * sections actually rendered on it, so the admin picks a position in the
 * page's own language ("after Bestsellers") rather than a number.
 *
 * Slot keys are referenced by the <VideoCarouselSection slot="..."> calls
 * placed in each page — adding a slot here means adding the matching render
 * point in that page too.
 */
export const VIDEO_CAROUSEL_PAGES = [
  {
    key: "home",
    label: "Homepage",
    slots: [
      { key: "hero", label: "Right under the hero" },
      { key: "pillars", label: "After the trust pillars" },
      { key: "collections", label: "After Shop by Collection" },
      { key: "offer", label: "After the offer timer" },
      { key: "bestsellers", label: "After Bestsellers" },
      { key: "dual-banner", label: "After the dual banner" },
      { key: "full-banner", label: "After the full banner" },
      { key: "bundles", label: "After Bundles" },
      { key: "featured", label: "After Featured" },
      { key: "promise", label: "After the dark promise band" },
      { key: "testimonials", label: "After Testimonials" },
      { key: "end", label: "At the very bottom" },
    ],
  },
  {
    key: "product",
    label: "Product pages",
    slots: [
      { key: "detail", label: "Right under the product" },
      { key: "reviews", label: "After the reviews" },
      { key: "related", label: "After You May Also Like" },
      { key: "end", label: "At the very bottom" },
    ],
  },
  {
    key: "products",
    label: "Shop All",
    slots: [
      { key: "top", label: "Above the product grid" },
      { key: "end", label: "Below the product grid" },
    ],
  },
  {
    key: "category",
    label: "Category pages",
    slots: [
      { key: "top", label: "Above the product grid" },
      { key: "end", label: "Below the product grid" },
    ],
  },
  {
    key: "about",
    label: "About page",
    slots: [
      { key: "story", label: "After the story section" },
      { key: "values", label: "After the values grid" },
      { key: "end", label: "At the very bottom" },
    ],
  },
] as const;

export type VideoCarouselItem = {
  /** Direct video URL (ImageKit). */
  url: string;
  /** Optional poster image shown before playback. */
  poster?: string;
  /** Optional caption rendered under the clip. */
  caption?: string;
  /** Optional link — e.g. the product the clip features. */
  href?: string;
};

const DEFAULTS: StoreSettings = {
  storeName: "Asta Collections",
  storeTagline: "Timeless jewellery, crafted with love",
  storeEmail: "astacollection14@gmail.com",
  storePhone: "+92 326 4348024",
  storeAddress: "Lahore, Pakistan",
  bankName: "Habib Bank Limited",
  bankAccountTitle: "Asta Collections",
  bankAccountNumber: "1234-5678-9012-3456",
  bankIBAN: "PK00HABB0000123456789012",
  codAdvance: "250",
  shippingFee: "0",
  freeShippingThreshold: "5000",
  currency: "PKR",
  currencySymbol: "Rs.",

  // Checkout / payment design
  codEnabled: "true",
  bankTransferEnabled: "true",
  defaultPaymentMethod: "COD",
  codTitle: "Cash on Delivery",
  codBadge: "Most Popular",
  codNote: "",
  bankTransferTitle: "Bank Transfer",
  bankTransferBadge: "",
  bankTransferNote: "",
  checkoutHeading: "Checkout",
  checkoutSubheading: "Almost there — just a few details.",

  // Hero defaults
  hero1Image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1800&auto=format&fit=crop&q=85",
  hero1Eyebrow: "Spring 2026 · The Pearl Edit",
  hero1Title: "Pearls,",
  hero1Accent: "reimagined.",
  hero1Description: "Lustrous freshwater pearls hand-set on contemporary forms — from minimal studs to statement chokers.",
  hero1CtaLabel: "Shop Pearls",
  hero1CtaHref: "/products?q=pearl",

  hero2Image: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1800&auto=format&fit=crop&q=85",
  hero2Eyebrow: "Bridal Collection",
  hero2Title: "For the day",
  hero2Accent: "you'll always remember.",
  hero2Description: "Complete kundan and emerald bridal sets, hand-set with care for the moments that matter most.",
  hero2CtaLabel: "Shop Bridal",
  hero2CtaHref: "/category/bridal-sets",

  hero3Image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1800&auto=format&fit=crop&q=85",
  hero3Eyebrow: "Everyday Elegance",
  hero3Title: "Pieces you'll",
  hero3Accent: "never take off.",
  hero3Description: "Minimalist rings, layering necklaces and crystal studs — built for daily wear.",
  hero3CtaLabel: "Shop Everyday",
  hero3CtaHref: "/category/rings",

  bannerBridalImage: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1400&auto=format&fit=crop&q=85",
  bannerPromiseImage: "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=1400&auto=format&fit=crop&q=85",
  bannerDualLeftImage: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1200&auto=format&fit=crop&q=85",
  bannerDualRightImage: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1200&auto=format&fit=crop&q=85",

  popupImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&auto=format&fit=crop&q=85",
  popupEnabled: "true",

  aboutHeroImage: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1400&auto=format&fit=crop&q=85",
  aboutStoryImage: "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=1400&auto=format&fit=crop&q=85",

  announcementText: "Free shipping above Rs. 5,000 · COD across Pakistan",
  announcementCode: "WELCOME10",
  marqueePhrases:
    "Free shipping above Rs. 5,000|Cash on Delivery|Bank transfer accepted|Handcrafted in Pakistan|7-day easy returns|Hypoallergenic materials|Hand-inspected before shipping",

  videoCarouselEnabled: "false",
  videoCarouselTitle: "Seen on you",
  videoCarouselSubtitle: "Real pieces, real light, real people.",
  videoCarouselPages: "",
  videoCarouselPlacements: '{"home":"bestsellers"}',
  videoCarouselItems: "[]",
};

/**
 * Parse the stored JSON, keeping every row — including ones with a blank
 * URL. The admin editor needs these so a freshly added row doesn't vanish
 * before it's been filled in. Bad or hand-edited JSON must never take a
 * page down, so anything unparseable yields [].
 */
export function parseVideoCarouselItemsRaw(raw: string): VideoCarouselItem[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is VideoCarouselItem =>
        !!v && typeof v === "object" && typeof v.url === "string"
    );
  } catch {
    return [];
  }
}

/**
 * A page URL is not a video. Instagram, TikTok, YouTube and Facebook links
 * point at a player page, not a file a <video> tag can decode, so pasting one
 * renders an empty card. Shared with the admin editor so the warning there and
 * the filter here can never drift apart.
 */
const VIDEO_PAGE_HOSTS =
  /(?:instagram\.com|tiktok\.com|youtube\.com|youtu\.be|facebook\.com|fb\.watch|vimeo\.com|drive\.google\.com|dropbox\.com)/i;

export function isPlayableVideoUrl(url: string): boolean {
  const u = url.trim();
  if (!u) return false;
  if (VIDEO_PAGE_HOSTS.test(u)) return false;
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u);
}

/** Storefront view: only rows a browser can actually play are renderable. */
export function parseVideoCarouselItems(raw: string): VideoCarouselItem[] {
  return parseVideoCarouselItemsRaw(raw).filter((v) => isPlayableVideoUrl(v.url));
}

/**
 * Which slot the carousel occupies on each page, as { page: slot }.
 *
 * Falls back to the legacy comma-separated page list — those installs get
 * the bottom-of-page position they already had, so upgrading doesn't move
 * anything unexpectedly.
 */
export function parseVideoCarouselPlacements(s: StoreSettings): Record<string, string> {
  try {
    const parsed = JSON.parse(s.videoCarouselPlacements || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const entries = Object.entries(parsed).filter(
        ([, v]) => typeof v === "string" && v !== ""
      ) as [string, string][];
      if (entries.length > 0) return Object.fromEntries(entries);
    }
  } catch {
    /* fall through to the legacy shape */
  }

  const legacy = (s.videoCarouselPages || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return Object.fromEntries(legacy.map((p) => [p, "end"]));
}

/** The slot to render in on this page, or null if the carousel is hidden here. */
export function videoCarouselSlotFor(s: StoreSettings, page: string): string | null {
  if (s.videoCarouselEnabled !== "true") return null;
  if (parseVideoCarouselItems(s.videoCarouselItems).length === 0) return null;
  return parseVideoCarouselPlacements(s)[page] ?? null;
}

export async function getSettings(): Promise<StoreSettings> {
  const rows = await prisma.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULTS, ...map } as StoreSettings;
}

export async function updateSettings(updates: Partial<StoreSettings>): Promise<void> {
  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value ?? "") },
        create: { key, value: String(value ?? "") },
      })
    )
  );
}

export function settingsToNumbers(s: StoreSettings) {
  return {
    codAdvance: parseCodAdvance(s.codAdvance),
    shippingFee: Number(s.shippingFee) || 0,
    freeShippingThreshold: Number(s.freeShippingThreshold) || 0,
  };
}
