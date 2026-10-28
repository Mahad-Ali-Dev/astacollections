// ───────────────────────────────────────────────────────────
//  Payment method resolution + checkout pricing — pure, no DB
//  imports. Shared by the storefront checkout (client), the
//  admin Checkout designer (client), and the order/settings API
//  routes (server). Keep this free of `prisma` so it can be
//  bundled into client components.
//
//  computeCheckoutTotals() is the single source of truth for
//  what an order costs. The checkout page, the admin preview and
//  the order API all call it, so the price a shopper is shown is
//  the price the server charges.
// ───────────────────────────────────────────────────────────
import type { StoreSettings } from "./settings";
import { formatPrice } from "./utils";

export type PaymentMethodKey = "COD" | "BANK_TRANSFER";

export type ResolvedPaymentConfig = {
  /** Methods to show at checkout, in display order. Always length ≥ 1. */
  enabled: PaymentMethodKey[];
  /** Pre-selected method — guaranteed to be a member of `enabled`. */
  defaultMethod: PaymentMethodKey;
  codEnabled: boolean;
  bankEnabled: boolean;
  /** COD advance in rupees. 0 ⇒ pure COD (no upfront transfer / screenshot). */
  codAdvance: number;
};

/** Parse a "true"/"false" setting string, treating unset/empty as `fallback`. */
export function boolSetting(v: string | undefined | null, fallback = true): boolean {
  if (v === undefined || v === null || v === "") return fallback;
  return v === "true";
}

/** Historical COD advance used when the setting has never been set. */
export const DEFAULT_COD_ADVANCE = 250;

/**
 * Parse the COD advance amount.
 * - blank / unset  → the historical default (never silently drop an advance a
 *   store was already charging when this setting simply hasn't been touched);
 * - explicit "0"   → pure COD (pay everything to the courier, no screenshot);
 * - any N ≥ 0      → that advance.
 */
export function parseCodAdvance(raw: string | undefined | null): number {
  if (raw == null || String(raw).trim() === "") return DEFAULT_COD_ADVANCE;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_COD_ADVANCE;
}

/**
 * Resolve which payment methods are live and which is selected by default.
 * Defensive on every axis: never returns zero methods, and always returns a
 * default that is actually enabled — so callers can trust the result without
 * re-validating.
 */
export function resolvePaymentConfig(s: StoreSettings): ResolvedPaymentConfig {
  let codEnabled = boolSetting(s.codEnabled, true);
  const bankEnabled = boolSetting(s.bankTransferEnabled, true);

  // A store must always offer at least one way to pay. If the admin somehow
  // disabled both, fall back to COD rather than rendering an unusable checkout.
  if (!codEnabled && !bankEnabled) codEnabled = true;

  const enabled: PaymentMethodKey[] = [];
  if (codEnabled) enabled.push("COD");
  if (bankEnabled) enabled.push("BANK_TRANSFER");

  let defaultMethod = (s.defaultPaymentMethod as PaymentMethodKey) || "COD";
  if (!enabled.includes(defaultMethod)) defaultMethod = enabled[0];

  const codAdvance = parseCodAdvance(s.codAdvance);

  return { enabled, defaultMethod, codEnabled, bankEnabled, codAdvance };
}

// ───── Per-method pricing ─────

/** NONE: same price either way. FEE: method costs extra. DISCOUNT: method is cheaper. */
export type AdjustKind = "NONE" | "FEE" | "DISCOUNT";
export type AdjustMode = "FIXED" | "PERCENTAGE";

export type MethodPricing = {
  kind: AdjustKind;
  mode: AdjustMode;
  /** Rupees for FIXED, percent (0–100) for PERCENTAGE. Always ≥ 0. */
  value: number;
  /** Line label on the order summary, e.g. "COD charges". */
  label: string;
};

const DEFAULT_ADJUST_LABEL: Record<PaymentMethodKey, Record<"FEE" | "DISCOUNT", string>> = {
  COD: { FEE: "COD charges", DISCOUNT: "COD discount" },
  BANK_TRANSFER: { FEE: "Bank transfer charges", DISCOUNT: "Prepaid discount" },
};

/** Read a method's fee/discount settings, normalising anything malformed to NONE. */
export function methodPricing(s: StoreSettings, method: PaymentMethodKey): MethodPricing {
  const cod = method === "COD";
  const rawKind = cod ? s.codAdjustType : s.bankTransferAdjustType;
  const rawMode = cod ? s.codAdjustMode : s.bankTransferAdjustMode;
  const rawValue = Number(cod ? s.codAdjustValue : s.bankTransferAdjustValue);
  const rawLabel = cod ? s.codAdjustLabel : s.bankTransferAdjustLabel;

  const kind: AdjustKind = rawKind === "FEE" || rawKind === "DISCOUNT" ? rawKind : "NONE";
  const mode: AdjustMode = rawMode === "PERCENTAGE" ? "PERCENTAGE" : "FIXED";
  let value = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 0;
  if (mode === "PERCENTAGE") value = Math.min(value, 100);

  const label =
    (rawLabel || "").trim() ||
    (kind === "NONE" ? "" : DEFAULT_ADJUST_LABEL[method][kind]);

  return { kind: value > 0 ? kind : "NONE", mode, value, label };
}

/**
 * Signed amount a method adds to the order: positive for a fee, negative for
 * a discount, 0 for none. Percentages apply to the goods value after any
 * coupon — never to shipping. A discount can't take the goods below zero.
 */
export function paymentAdjustment(pricing: MethodPricing, goodsValue: number): number {
  if (pricing.kind === "NONE" || goodsValue <= 0) return 0;
  const raw =
    pricing.mode === "PERCENTAGE" ? Math.round((goodsValue * pricing.value) / 100) : pricing.value;
  return pricing.kind === "FEE" ? raw : -Math.min(raw, goodsValue);
}

/** Short customer-facing description, e.g. "Save 5%" or "+ Rs. 100 fee". */
export function describePricing(pricing: MethodPricing): string | null {
  if (pricing.kind === "NONE") return null;
  const amount = pricing.mode === "PERCENTAGE" ? `${pricing.value}%` : formatPrice(pricing.value);
  return pricing.kind === "DISCOUNT" ? `Save ${amount}` : `+ ${amount} ${pricing.label}`;
}

/** One-line description under a payment card: how the money moves + any fee/discount. */
export function methodSubtitle(s: StoreSettings, method: PaymentMethodKey): string {
  const advance = parseCodAdvance(s.codAdvance);
  const base =
    method === "BANK_TRANSFER"
      ? "Pay full amount now"
      : advance > 0
        ? `${formatPrice(advance)} advance · balance on delivery`
        : "Pay in full when it arrives";
  const extra = describePricing(methodPricing(s, method));
  return extra ? `${base} · ${extra}` : base;
}

/**
 * Delivery charge for a goods value. A zero/blank threshold means there's no
 * free-shipping tier — the same rule the product page advertises.
 */
export function shippingFor(s: StoreSettings, goodsValue: number): number {
  const fee = Number(s.shippingFee) || 0;
  const threshold = Number(s.freeShippingThreshold) || 0;
  if (fee <= 0) return 0;
  if (threshold > 0 && goodsValue >= threshold) return 0;
  return fee;
}

export type CheckoutTotals = {
  subtotal: number;
  discount: number;
  /** Goods value after the coupon — what shipping and percentages key off. */
  afterDiscount: number;
  shipping: number;
  /** Signed: + fee, − discount, 0 none. */
  adjustment: number;
  adjustmentLabel: string;
  total: number;
  /** What the customer transfers before dispatch. */
  payNow: number;
  /** What the courier collects. */
  balanceOnDelivery: number;
  /** Whether a transfer screenshot is needed to place the order. */
  needsProof: boolean;
};

export function computeCheckoutTotals(
  s: StoreSettings,
  input: { subtotal: number; discount: number; method: PaymentMethodKey }
): CheckoutTotals {
  const { subtotal, method } = input;
  const discount = Math.min(Math.max(0, input.discount), subtotal);
  const afterDiscount = subtotal - discount;
  const shipping = shippingFor(s, afterDiscount);

  const pricing = methodPricing(s, method);
  const adjustment = paymentAdjustment(pricing, afterDiscount);
  const total = Math.max(0, afterDiscount + shipping + adjustment);

  let payNow = total;
  if (method === "COD") payNow = Math.min(parseCodAdvance(s.codAdvance), total);

  return {
    subtotal,
    discount,
    afterDiscount,
    shipping,
    adjustment,
    adjustmentLabel: adjustment === 0 ? "" : pricing.label,
    total,
    payNow,
    balanceOnDelivery: total - payNow,
    needsProof: payNow > 0,
  };
}

/** Summary line for a stored order's adjustment, or null when there is none. */
export function adjustmentLine(
  amount: number | null | undefined,
  label: string | null | undefined
): { label: string; value: string; isDiscount: boolean } | null {
  if (!amount) return null;
  return {
    label: label || (amount > 0 ? "Payment charges" : "Payment discount"),
    value: amount > 0 ? formatPrice(amount) : `- ${formatPrice(-amount)}`,
    isDiscount: amount < 0,
  };
}

// ───── Customer fields ─────

export type FieldMode = "required" | "optional" | "hidden";

/** Parse a field-visibility setting; anything unrecognised falls back. */
export function fieldMode(raw: string | undefined | null, fallback: FieldMode): FieldMode {
  return raw === "required" || raw === "optional" || raw === "hidden" ? raw : fallback;
}

export function checkoutFields(s: StoreSettings) {
  return {
    email: fieldMode(s.checkoutEmailField, "optional"),
    area: fieldMode(s.checkoutAreaField, "optional"),
    notes: fieldMode(s.checkoutNotesField, "optional"),
    coupon: boolSetting(s.checkoutCouponEnabled, true),
  };
}
