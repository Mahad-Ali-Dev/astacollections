// ───────────────────────────────────────────────────────────
//  Meta (Facebook) Pixel — thin client helper.
//
//  Set NEXT_PUBLIC_FACEBOOK_PIXEL_ID in .env to enable tracking.
//  When it's unset (e.g. local dev), every call here is a safe
//  no-op, so the site behaves identically with or without a pixel.
//
//  The <MetaPixel /> component (src/components/analytics) loads the
//  base script and fires PageView. These helpers fire the e-commerce
//  events Meta optimizes a Sales campaign against:
//    ViewContent → AddToCart → InitiateCheckout → Purchase
// ───────────────────────────────────────────────────────────

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ?? "";

export type FbEventParams = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function call(...args: unknown[]) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq(...args);
}

/** Standard PageView — fired on every route change by <MetaPixel />. */
export function pageview() {
  call("track", "PageView");
}

/** Fire a standard Meta event (ViewContent, AddToCart, Purchase, …). */
export function track(event: string, params?: FbEventParams) {
  call("track", event, params);
}

/** Fire a custom (non-standard) event. */
export function trackCustom(event: string, params?: FbEventParams) {
  call("trackCustom", event, params);
}
