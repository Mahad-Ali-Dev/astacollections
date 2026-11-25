import { prisma } from "./prisma";

// ───────────────────────────────────────────────────────────
//  Store-wide sale ("Flat 50% off everything")
//
//  Starting a sale rewrites the catalogue prices themselves:
//    price        → original price minus the sale %
//    comparePrice → original price (shown struck through, with the % badge)
//  Option surcharges (Product attribute priceModifier) drop by the same %.
//  Because the real prices change, every place that shows or charges a
//  price (cards, product pages, search, cart re-check, checkout, the order
//  total the server computes) follows the sale with no extra code.
//
//  Every original value is saved first (Setting key SALE_KEY), and ending
//  the sale puts them back. A price the admin edits by hand during the sale
//  is left as they set it: only untouched sale prices are restored.
// ───────────────────────────────────────────────────────────

/** Settings keys starting with "_" are internal: hidden from getSettings(). */
export const SALE_KEY = "_storeSale";

type SavedProduct = { price: number; comparePrice: number | null; sale: number };
type SavedOption = { priceModifier: number; sale: number };

export type SaleState = {
  active: boolean;
  percent: number;
  startedAt: string | null;
  products: Record<string, SavedProduct>;
  options: Record<string, SavedOption>;
};

const OFF: SaleState = { active: false, percent: 0, startedAt: null, products: {}, options: {} };

export type SaleSummary = {
  active: boolean;
  percent: number;
  startedAt: string | null;
  discounted: number;
  /** Products added after the sale started, still at full price. */
  notYetDiscounted: number;
  totalProducts: number;
};

export async function getSaleState(): Promise<SaleState> {
  const row = await prisma.setting.findUnique({ where: { key: SALE_KEY } });
  if (!row) return OFF;
  try {
    return { ...OFF, ...JSON.parse(row.value) } as SaleState;
  } catch {
    return OFF;
  }
}

export async function getSaleSummary(): Promise<SaleSummary> {
  const [state, ids] = await Promise.all([
    getSaleState(),
    prisma.product.findMany({ select: { id: true } }),
  ]);
  const discounted = ids.filter((p) => state.products[p.id]).length;
  return {
    active: state.active,
    percent: state.percent,
    startedAt: state.startedAt,
    discounted: state.active ? discounted : 0,
    notYetDiscounted: state.active ? ids.length - discounted : 0,
    totalProducts: ids.length,
  };
}

/** Whole rupees, never below 1. */
const salePrice = (price: number, percent: number) => Math.max(1, Math.round(price * (1 - percent / 100)));

/**
 * Start a sale, or (when one is running) discount products added since it
 * started. Products already discounted are never discounted twice.
 */
export async function applySale(percent: number): Promise<SaleSummary> {
  const current = await getSaleState();
  if (current.active && percent !== current.percent) {
    throw new Error(`A ${current.percent}% sale is running. End it before starting a different one.`);
  }
  if (!(percent >= 1 && percent <= 90)) throw new Error("The discount must be between 1% and 90%.");

  const state: SaleState = current.active
    ? current
    : { active: true, percent, startedAt: new Date().toISOString(), products: {}, options: {} };

  const [products, options] = await Promise.all([
    prisma.product.findMany({ select: { id: true, price: true, comparePrice: true } }),
    prisma.productAttributeOption.findMany({
      where: { priceModifier: { gt: 0 } },
      select: { id: true, priceModifier: true },
    }),
  ]);

  const writes = [];
  for (const p of products) {
    if (state.products[p.id] || !(p.price > 0)) continue;
    const sale = salePrice(p.price, percent);
    state.products[p.id] = { price: p.price, comparePrice: p.comparePrice, sale };
    writes.push(prisma.product.update({ where: { id: p.id }, data: { price: sale, comparePrice: p.price } }));
  }
  for (const o of options) {
    if (state.options[o.id] || o.priceModifier == null) continue;
    const sale = Math.round(o.priceModifier * (1 - percent / 100));
    state.options[o.id] = { priceModifier: o.priceModifier, sale };
    writes.push(prisma.productAttributeOption.update({ where: { id: o.id }, data: { priceModifier: sale } }));
  }

  // The saved originals and the new prices land together or not at all.
  writes.push(
    prisma.setting.upsert({
      where: { key: SALE_KEY },
      update: { value: JSON.stringify(state) },
      create: { key: SALE_KEY, value: JSON.stringify(state) },
    })
  );
  await prisma.$transaction(writes);
  return getSaleSummary();
}

/** End the sale and put the original prices back. */
export async function endSale(): Promise<{ restored: number; keptManualEdits: number }> {
  const state = await getSaleState();
  if (!state.active) throw new Error("No sale is running.");

  const ids = Object.keys(state.products);
  const optionIds = Object.keys(state.options);
  const [products, options] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, price: true, comparePrice: true } }),
    prisma.productAttributeOption.findMany({ where: { id: { in: optionIds } }, select: { id: true, priceModifier: true } }),
  ]);

  let restored = 0;
  let keptManualEdits = 0;
  const writes = [];
  for (const p of products) {
    const saved = state.products[p.id];
    if (p.price === saved.sale) {
      restored++;
      writes.push(prisma.product.update({ where: { id: p.id }, data: { price: saved.price, comparePrice: saved.comparePrice } }));
    } else {
      // The admin set a new price by hand during the sale: keep it, and only
      // drop the struck-through sale "was" price if it is still ours.
      keptManualEdits++;
      if (p.comparePrice === saved.price) {
        writes.push(prisma.product.update({ where: { id: p.id }, data: { comparePrice: saved.comparePrice } }));
      }
    }
  }
  for (const o of options) {
    const saved = state.options[o.id];
    if (o.priceModifier === saved.sale) {
      writes.push(prisma.productAttributeOption.update({ where: { id: o.id }, data: { priceModifier: saved.priceModifier } }));
    }
  }

  writes.push(prisma.setting.update({ where: { key: SALE_KEY }, data: { value: JSON.stringify(OFF) } }));
  await prisma.$transaction(writes);
  return { restored, keptManualEdits };
}
