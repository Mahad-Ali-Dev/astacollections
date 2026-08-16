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
  videoCarouselPages: string;     // comma-separated page keys — see VIDEO_CAROUSEL_PAGES
  videoCarouselItems: string;     // JSON array of VideoCarouselItem
};

/** Pages the video carousel can be switched on for, from the admin panel. */
export const VIDEO_CAROUSEL_PAGES = [
  { key: "home", label: "Homepage" },
  { key: "product", label: "Product pages" },
  { key: "products", label: "Shop All" },
  { key: "category", label: "Category pages" },
  { key: "about", label: "About page" },
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
  videoCarouselPages: "home",
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

/** Storefront view: only rows with a real URL are renderable. */
export function parseVideoCarouselItems(raw: string): VideoCarouselItem[] {
  return parseVideoCarouselItemsRaw(raw).filter((v) => v.url.trim() !== "");
}

/** Is the carousel switched on for this page key? */
export function videoCarouselShowsOn(s: StoreSettings, page: string): boolean {
  if (s.videoCarouselEnabled !== "true") return false;
  if (parseVideoCarouselItems(s.videoCarouselItems).length === 0) return false;
  return s.videoCarouselPages
    .split(",")
    .map((p) => p.trim())
    .includes(page);
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
