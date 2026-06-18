"use client";

import { useEffect } from "react";
import { track } from "@/lib/fbpixel";

type PurchaseContent = { id: string; quantity: number; item_price: number };

/**
 * Fires the Meta `Purchase` event on the order-success page — the single most
 * important signal for an Advantage+ Sales campaign. Rendered by the (server)
 * order-success page with the real order totals.
 *
 * Deduped per order via sessionStorage so a page refresh / back-forward cache
 * hit doesn't double-count the same sale.
 */
export function PurchaseTracker({
  orderNumber,
  value,
  currency = "PKR",
  contentIds,
  contents,
  numItems,
}: {
  orderNumber: string;
  value: number;
  currency?: string;
  contentIds: string[];
  contents: PurchaseContent[];
  numItems: number;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = `fb_purchase_${orderNumber}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* sessionStorage blocked — still fire once for this mount */
    }

    track("Purchase", {
      value,
      currency,
      content_type: "product",
      content_ids: contentIds,
      contents,
      num_items: numItems,
    });
  }, [orderNumber, value, currency, contentIds, contents, numItems]);

  return null;
}
