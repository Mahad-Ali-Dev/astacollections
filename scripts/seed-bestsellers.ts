/**
 * Create the "Bestsellers" collection and fill it with the 30 products that
 * are actually sellable right now.
 *
 * Run with:
 *   npm run seed:bestsellers
 *
 * Safe to run more than once — the category is upserted by slug and the
 * product list is `set`, so re-running syncs the collection to whatever is
 * listed below rather than piling on duplicates.
 *
 * Products keep their existing primary category. This only adds them to the
 * Bestsellers collection via extraCategories, so nothing moves and no
 * breadcrumb or URL changes.
 *
 * Selection rule: 2+ units in stock, weighted toward higher price, spread
 * across every category with real depth. Anything 1-unit is excluded — there
 * is no point advertising something that sells out on the first order.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SLUG = "bestsellers";

/** SKUs to include, grouped by category for readability. */
const SKUS = [
  // ── Pendants (11) — Rs 1,099–1,999
  "ASTA-PEN-MPL-CSA-001",
  "ASTA-PEN-CAS-007",
  "ASTA-PEN-SET-016",
  "ASTA-PEN-SET-013",
  "ASTA-PEN-SET-009",
  "ASTA-PEN-SET-007",
  "ASTA-PEN-SET-001",
  "ASTA-PEN-SET-002",
  "ASTA-PEN-SET-025",
  "ASTA-PEN-SET-026",
  "ASTA-PEN-CAS-004",

  // ── Hand Cuffs (5) — Rs 1,199–2,999
  "ASTA-HC-003",
  "ASTA-HC-002",
  "ASTA-HC-001",
  "ASTA-HC-008",
  "ASTA-HC-007",

  // ── Couple Rings (2) — gifting
  "ASTA-CP-SLV-007",
  "ASTA-CP-SLV-003",

  // ── Bracelets (2)
  "ASTA-BER-CSA-003",
  "ASTA-BER-CSA-005",

  // ── Rings (6) — Rs 699, the 3-for-Rs-1,799 bundle stock
  "ASTA-hex-004",
  "ASTA-hex-001",
  "ASTA-hex-003",
  "ASTA-HAR-004",
  "ASTA-HAR-005",
  "ASTA-HAR-003",

  // ── Studs (4) — 6-pair sets, strong photography
  "ASTA-CAS-EAR-007",
  "ASTA-CAS-EAR-005",
  "ASTA-CAS-EAR-003",
  "ASTA-CAS-EAR-001",
];

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: SLUG },
    update: {},
    create: {
      name: "Bestsellers",
      slug: SLUG,
      description:
        "Our most-loved pieces — in stock and ready to ship across Pakistan.",
      isActive: true,
      sortOrder: 0,
    },
  });
  console.log(`Category "${category.name}" ready (${category.id})`);

  const products = await prisma.product.findMany({
    where: { sku: { in: SKUS } },
    select: { id: true, sku: true, name: true, price: true, stock: true },
  });

  const found = new Set(products.map((p) => p.sku));
  const missing = SKUS.filter((s) => !found.has(s));

  // set() rather than connect() so re-running removes anything dropped from
  // the list above instead of leaving stale members behind.
  await prisma.category.update({
    where: { id: category.id },
    data: { extraProducts: { set: products.map((p) => ({ id: p.id })) } },
  });

  const units = products.reduce((n, p) => n + p.stock, 0);
  const avg = products.length
    ? Math.round(products.reduce((n, p) => n + p.price, 0) / products.length)
    : 0;

  console.log(`\nAdded ${products.length} products`);
  console.log(`  ${units} units in stock · Rs ${avg} average price`);

  const noStock = products.filter((p) => p.stock === 0);
  if (noStock.length > 0) {
    console.log(`\nWarning — ${noStock.length} are out of stock:`);
    for (const p of noStock) console.log(`  ${p.sku}  ${p.name}`);
  }

  if (missing.length > 0) {
    console.log(`\nWarning — ${missing.length} SKUs not found:`);
    for (const s of missing) console.log(`  ${s}`);
  }

  console.log(`\nLive at /category/${SLUG}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
