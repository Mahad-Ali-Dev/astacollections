// ───────────────────────────────────────────────────────────
//  Payment method resolution — pure, no DB imports.
//  Shared by the storefront checkout (client), the admin
//  Checkout designer (client), and the order/settings API
//  routes (server). Keep this free of `prisma` so it can be
//  bundled into client components.
// ───────────────────────────────────────────────────────────
import type { StoreSettings } from "./settings";

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
