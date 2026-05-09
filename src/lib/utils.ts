import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ?? "Rs.";

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return `${SYMBOL} 0`;
  return `${SYMBOL} ${Math.round(value).toLocaleString("en-PK")}`;
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ASTA-${ts}-${rand}`;
}

export function generateSku(prefix = "ASTA"): string {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${prefix}-${ts}${rand}`;
}

export function calculateDiscount(
  subtotal: number,
  coupon: {
    discountType: string;
    discountValue: number;
    maxDiscount?: number | null;
    minOrder?: number | null;
  } | null
): number {
  if (!coupon) return 0;
  if (coupon.minOrder && subtotal < coupon.minOrder) return 0;
  let discount =
    coupon.discountType === "PERCENTAGE"
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;
  if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
  return Math.min(discount, subtotal);
}

export function getEffectivePrice(price: number, comparePrice?: number | null): number {
  return price;
}

export function getDiscountPercent(price: number, comparePrice?: number | null): number {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

/**
 * End-of-day in 2 days from now — a default offer deadline.
 * Safe to call from both server and client components.
 */
export function defaultOfferEndsAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(23, 59, 59, 0);
  return d.toISOString();
}
