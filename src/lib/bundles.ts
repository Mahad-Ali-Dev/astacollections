type BundleItemLite = {
  productId: string;
  quantity: number;
  product: { price: number };
};

type BundleLite = {
  discountType: string;
  discountValue: number;
  items: BundleItemLite[];
};

export function computeBundlePricing(bundle: BundleLite) {
  const original = bundle.items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );
  let discount =
    bundle.discountType === "PERCENTAGE"
      ? (original * bundle.discountValue) / 100
      : bundle.discountValue;
  if (discount > original) discount = original;
  const final = Math.max(0, original - discount);
  const percent = original > 0 ? Math.round((discount / original) * 100) : 0;
  return { original, discount, final, percent };
}
