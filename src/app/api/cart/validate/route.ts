import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Reconcile a customer's (client-persisted) cart against live product data.
// The cart is stored in localStorage and caches price/stock/name at add-time,
// so it goes stale when an admin edits products. This endpoint returns the
// CURRENT price (base + selected variant modifiers), stock, and availability
// for each line — computed exactly like the order route — so the storefront
// can show what the customer will actually be charged.

const schema = z.object({
  items: z
    .array(
      z.object({
        key: z.string(),
        id: z.string(),
        selectedAttributes: z.record(z.string()).optional().nullable(),
      })
    )
    .max(100),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { items } = parsed.data;
  if (items.length === 0) return NextResponse.json({ items: [] });

  const ids = [...new Set(items.map((i) => i.id))];
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      attributes: { include: { options: true } },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const result = items.map((line) => {
    const p = byId.get(line.id);
    // Product deleted or deactivated → no longer purchasable.
    if (!p || !p.isActive) return { key: line.key, exists: false };

    // Recompute variant price modifier + effective stock (parity with the
    // order route and the product page's effectivePrice/effectiveStock).
    const selection = line.selectedAttributes ?? {};
    let priceMod = 0;
    let variantStock: number | null = null;
    for (const attr of p.attributes) {
      const chosen = selection[attr.name];
      if (!chosen) continue;
      const opt = attr.options.find((o) => o.value === chosen);
      if (!opt) continue; // option removed by admin — base price stands; order route will re-validate
      if (opt.priceModifier) priceMod += opt.priceModifier;
      if (typeof opt.stock === "number") {
        variantStock = variantStock === null ? opt.stock : Math.min(variantStock, opt.stock);
      }
    }
    const effectiveStock = variantStock === null ? p.stock : Math.min(p.stock, variantStock);

    return {
      key: line.key,
      exists: true,
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      image: p.images[0]?.url ?? null,
      price: p.price + priceMod,
      stock: effectiveStock,
    };
  });

  return NextResponse.json({ items: result });
}
