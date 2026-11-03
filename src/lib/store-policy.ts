import { getSettings } from "./settings";
import { resolvePaymentConfig } from "./payment";
import { formatPrice } from "./utils";
import { SITE } from "./seo";

/**
 * The delivery and payment terms as the admin has configured them, for
 * DISPLAY ONLY (trust strips, FAQ answers, structured data). Checkout and the
 * order route compute money themselves; nothing here feeds a charge.
 *
 * Several pages used to hardcode "free shipping above Rs. 5,000" and a
 * "Rs. 250 COD advance" long after the settings had moved on, so copy that
 * quotes a number should take it from here.
 */
export type StorePolicy = {
  shippingFee: number;
  freeShippingThreshold: number;
  codEnabled: boolean;
  bankEnabled: boolean;
  codAdvance: number;
  returnDays: number;
};

export async function getStorePolicy(): Promise<StorePolicy> {
  const settings = await getSettings();
  const pay = resolvePaymentConfig(settings);
  return {
    shippingFee: Number(settings.shippingFee) || 0,
    freeShippingThreshold: Number(settings.freeShippingThreshold) || 0,
    codEnabled: pay.codEnabled,
    bankEnabled: pay.bankEnabled,
    codAdvance: pay.codEnabled ? pay.codAdvance : 0,
    returnDays: SITE.returnDays,
  };
}

/** "Rs. 250 delivery, free over Rs. 3,000" style line. */
export function deliveryLine(p: StorePolicy): string {
  if (p.shippingFee <= 0) return "Free delivery across Pakistan";
  if (p.freeShippingThreshold > 0) {
    return `Free delivery over ${formatPrice(p.freeShippingThreshold)}`;
  }
  return `${formatPrice(p.shippingFee)} delivery across Pakistan`;
}

/** Short description of how cash on delivery works right now. */
export function codLine(p: StorePolicy): string {
  if (!p.codEnabled) return "Pay by bank transfer";
  if (p.codAdvance > 0) return `Cash on delivery (${formatPrice(p.codAdvance)} advance)`;
  return "Cash on delivery across Pakistan";
}
