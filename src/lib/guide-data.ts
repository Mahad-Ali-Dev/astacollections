import { prisma } from "./prisma";
import { formatPrice } from "./utils";
import { deliveryLine, getStorePolicy } from "./store-policy";

/** Active products in a collection: its own, its child collections', and ones added to it. */
async function collectionProductWhere(slug: string) {
  const cat = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, isActive: true, children: { where: { isActive: true }, select: { id: true } } },
  });
  if (!cat || !cat.isActive) return null;
  const ids = [cat.id, ...cat.children.map((c) => c.id)];
  return {
    isActive: true,
    OR: [{ categoryId: { in: ids } }, { extraCategories: { some: { id: { in: ids } } } }],
  };
}

/**
 * Resolve the {range:slug} / {min:slug} / {delivery} placeholders used in
 * guide copy, from live data, so a guide never quotes a stale price.
 */
export async function guidePlaceholders(texts: string[]): Promise<Record<string, string>> {
  const all = texts.join("\n");
  const slugs = [...new Set([...all.matchAll(/\{(?:range|min):([a-z0-9-]+)\}/g)].map((m) => m[1]))];
  const out: Record<string, string> = {};
  await Promise.all(
    slugs.map(async (slug) => {
      const where = await collectionProductWhere(slug);
      const agg = where
        ? await prisma.product.aggregate({ where, _min: { price: true }, _max: { price: true } })
        : null;
      const min = agg?._min.price;
      const max = agg?._max.price;
      out[`min:${slug}`] = min != null ? formatPrice(min) : "";
      out[`range:${slug}`] =
        min == null || max == null ? "" : min === max ? formatPrice(min) : `${formatPrice(min)} to ${formatPrice(max)}`;
    })
  );
  if (all.includes("{delivery}")) out.delivery = deliveryLine(await getStorePolicy());
  return out;
}

export function fillPlaceholders(text: string, values: Record<string, string>): string {
  return text.replace(/\{((?:range|min):[a-z0-9-]+|delivery)\}/g, (_, key) => values[key] ?? "");
}

/** Products for a guide's "shop the guide" grid, in-stock first. */
export async function guideProducts(categorySlugs: string[], maxPrice?: number, take = 8) {
  const wheres = (await Promise.all(categorySlugs.map(collectionProductWhere))).filter(
    (w): w is NonNullable<typeof w> => w !== null
  );
  if (wheres.length === 0) return [];
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: wheres.flatMap((w) => w.OR),
      ...(maxPrice ? { price: { lte: maxPrice } } : {}),
    },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: take * 3,
  });
  // Interleave collections a little so one big collection doesn't fill the grid.
  const seen = new Set<string>();
  const byCat = new Map<string, typeof products>();
  for (const p of products) {
    if (!byCat.has(p.categoryId)) byCat.set(p.categoryId, []);
    byCat.get(p.categoryId)!.push(p);
  }
  const picked: typeof products = [];
  while (picked.length < take && [...byCat.values()].some((l) => l.length)) {
    for (const list of byCat.values()) {
      const p = list.shift();
      if (p && !seen.has(p.id) && p.stock > 0) {
        seen.add(p.id);
        picked.push(p);
        if (picked.length >= take) break;
      }
    }
  }
  return picked;
}
