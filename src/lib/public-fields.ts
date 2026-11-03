/**
 * Shapes for PUBLIC API responses. Admin routes return full records; anything
 * an anonymous visitor can fetch must go through these, so internal fields
 * (cost price = the store's margin, reviewer emails) never leave the server.
 */

/** Product fields that are internal to the business. */
const INTERNAL_PRODUCT_FIELDS = ["costPrice"] as const;

export function toPublicProduct<T extends Record<string, unknown>>(product: T): Omit<T, (typeof INTERNAL_PRODUCT_FIELDS)[number]> {
  const copy: Record<string, unknown> = { ...product };
  for (const f of INTERNAL_PRODUCT_FIELDS) delete copy[f];
  return copy as Omit<T, (typeof INTERNAL_PRODUCT_FIELDS)[number]>;
}

/** Prisma `select` for reviews shown to the public: no email, no moderation fields. */
export const PUBLIC_REVIEW_SELECT = {
  id: true,
  productId: true,
  customerName: true,
  rating: true,
  title: true,
  body: true,
  verified: true,
  createdAt: true,
} as const;
