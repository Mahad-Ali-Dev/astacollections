/**
 * Shopper-facing filters derived in code from product text. The stored
 * `material` values are full sentences ("Premium Stainless Steel with a
 * high-polish gold finish and..."), about 60 distinct strings, which made the
 * old Material filter unusable. Stored data is not changed.
 *
 * Pure and client-safe: no database imports.
 */
export type FacetInput = {
  name: string;
  material?: string | null;
  tags?: string | null;
  shortDesc?: string | null;
  description?: string | null;
  price: number;
  stock: number;
  /** Collection slug, used only when the text names no tone. */
  categorySlug?: string;
};

/**
 * Tone for collections whose product text never names one, checked by eye
 * against every photo in the collection (Nov 2026). Hexagonal is mixed, so it
 * is left out: an untagged piece simply doesn't appear under a tone filter.
 */
const TONE_BY_COLLECTION: Record<string, string> = {
  "zircon-rings": "silver",
  "hormony-collection": "gold",
  "enamel-rings": "gold",
  studs: "gold",
};

export const TONES = [
  { key: "gold", label: "Gold tone" },
  { key: "silver", label: "Silver tone" },
] as const;

export const STONES = [
  { key: "zircon", label: "Zircon & crystal" },
  { key: "mop", label: "Mother of pearl" },
  { key: "pearl", label: "Pearl" },
  { key: "enamel", label: "Enamel" },
  { key: "natural", label: "Natural stone" },
] as const;

export const PRICE_BUCKETS = [
  { key: "0-699", label: "Under Rs. 700" },
  { key: "700-999", label: "Rs. 700 – 999" },
  { key: "1000-1499", label: "Rs. 1,000 – 1,499" },
  { key: "1500-999999", label: "Rs. 1,500 and above" },
] as const;

export const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "price-low", label: "Price: low to high" },
  { key: "price-high", label: "Price: high to low" },
] as const;

const haystack = (p: FacetInput) => `${p.name} ${p.material ?? ""} ${p.tags ?? ""}`.toLowerCase();

const tonesIn = (text: string): string[] => {
  const t = text.toLowerCase();
  const out: string[] = [];
  if (/\b(gold|golden|gilded)\b|gold-/.test(t)) out.push("gold");
  if (/\b(silver|argent)\b|silver-/.test(t)) out.push("silver");
  return out;
};

/**
 * Tones named in the product's own text, trusting the most specific field that
 * names one: a "Silver" ring whose description also mentions gold is silver. A
 * mixed-metal piece whose material names both has both.
 */
export function tonesOf(p: FacetInput): string[] {
  for (const text of [p.name, p.material ?? "", `${p.tags ?? ""} ${p.shortDesc ?? ""} ${p.description ?? ""}`]) {
    const tones = tonesIn(text);
    if (tones.length > 0) return tones;
  }
  const fallback = p.categorySlug && TONE_BY_COLLECTION[p.categorySlug];
  return fallback ? [fallback] : [];
}

export function stonesOf(p: FacetInput): string[] {
  const text = haystack(p);
  const out: string[] = [];
  if (/zircon|zirconia|crystal|\bcz\b/.test(text)) out.push("zircon");
  const mop = /mother[- ]of[- ]pearl|mother pearl|\bmop\b/.test(text);
  if (mop) out.push("mop");
  if (/\bpearls?\b/.test(text.replace(/mother[- ]of[- ]pearl|mother pearl/g, ""))) out.push("pearl");
  if (/enamel/.test(text)) out.push("enamel");
  if (/agate|chalcedony|natural [a-z ]*stone/.test(text)) out.push("natural");
  return out;
}

export type CatalogParams = {
  tone?: string;
  stone?: string;
  price?: string;
  inStock?: string;
  sort?: string;
};

export function inPriceBucket(price: number, bucket: string): boolean {
  const [min, max] = bucket.split("-").map(Number);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return true;
  return price >= min && price <= max;
}

type Facet = "tone" | "stone" | "price" | "inStock";

function matches<T extends FacetInput>(p: T, f: CatalogParams, skip?: Facet): boolean {
  if (skip !== "tone" && f.tone && !tonesOf(p).includes(f.tone)) return false;
  if (skip !== "stone" && f.stone && !stonesOf(p).includes(f.stone)) return false;
  if (skip !== "price" && f.price && !inPriceBucket(p.price, f.price)) return false;
  if (skip !== "inStock" && f.inStock === "1" && p.stock <= 0) return false;
  return true;
}

/**
 * Apply filters and sort. The input is expected newest-first. In the default
 * sort, sold-out pieces go last so they don't interrupt what can be bought.
 */
export function applyCatalog<T extends FacetInput>(products: T[], f: CatalogParams): T[] {
  const list = products.filter((p) => matches(p, f));
  if (f.sort === "price-low") return [...list].sort((a, b) => a.price - b.price);
  if (f.sort === "price-high") return [...list].sort((a, b) => b.price - a.price);
  return [...list.filter((p) => p.stock > 0), ...list.filter((p) => p.stock <= 0)];
}

export type FacetOption = { key: string; label: string; count: number };
export type FacetCounts = {
  tones: FacetOption[];
  stones: FacetOption[];
  prices: FacetOption[];
  inStock: number;
};

/** Option counts for each facet, given the OTHER active filters. Empty options are dropped. */
export function facetCounts<T extends FacetInput>(products: T[], f: CatalogParams): FacetCounts {
  const count = (skip: Facet, test: (p: T) => boolean) =>
    products.filter((p) => matches(p, f, skip) && test(p)).length;
  return {
    tones: TONES.map((o) => ({ ...o, count: count("tone", (p) => tonesOf(p).includes(o.key)) })).filter((o) => o.count > 0),
    stones: STONES.map((o) => ({ ...o, count: count("stone", (p) => stonesOf(p).includes(o.key)) })).filter((o) => o.count > 0),
    prices: PRICE_BUCKETS.map((o) => ({ ...o, count: count("price", (p) => inPriceBucket(p.price, o.key)) })).filter((o) => o.count > 0),
    inStock: count("inStock", (p) => p.stock > 0),
  };
}
