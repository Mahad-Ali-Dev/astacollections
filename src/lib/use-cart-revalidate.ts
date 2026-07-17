"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useCart, type CartRevalidation } from "./cart-store";

/**
 * Returns a `sync()` callback that reconciles the cart against live product
 * data and shows a gentle notice if anything changed (price, stock, or an item
 * that's no longer available). Safe to call on mount and on cart open — it's a
 * no-op for an empty or unchanged cart. Returns the change summary so callers
 * (e.g. the checkout submit guard) can react.
 */
export function useCartRevalidate() {
  const revalidate = useCart((s) => s.revalidate);

  return useCallback(
    async (opts?: { silent?: boolean }): Promise<CartRevalidation | null> => {
      const res = await revalidate();
      if (!res || opts?.silent) return res;

      if (res.removed.length > 0) {
        toast.info(
          res.removed.length === 1
            ? `"${res.removed[0]}" is no longer available and was removed from your bag.`
            : `${res.removed.length} items are no longer available and were removed from your bag.`
        );
      } else if (res.priceChanged) {
        toast.info("Prices in your bag were updated to the latest.");
      } else if (res.qtyAdjusted) {
        toast.info("Some quantities were adjusted to match available stock.");
      }
      return res;
    },
    [revalidate]
  );
}
