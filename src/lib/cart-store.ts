"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { track } from "@/lib/fbpixel";

export type SelectedAttributes = Record<string, string>; // { "Ring Size": "7", "Color": "Gold" }

export type CartItem = {
  /** Cart line key — same product with different variants must have different keys */
  key: string;
  /** Product ID (multiple cart lines may share this if variants differ) */
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  sku: string;
  quantity: number;
  stock: number;
  /** Variant selection at the time of add. Empty {} if product has no attributes. */
  selectedAttributes?: SelectedAttributes;
};

/** Build a stable cart-line key from product id + variant selection. */
export function makeCartKey(productId: string, selection?: SelectedAttributes): string {
  if (!selection || Object.keys(selection).length === 0) return productId;
  const sortedKey = Object.keys(selection)
    .sort()
    .map((k) => `${k}=${selection[k]}`)
    .join("|");
  return `${productId}::${sortedKey}`;
}

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  add: (item: Omit<CartItem, "quantity" | "key">, qty?: number, selection?: SelectedAttributes) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  count: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      add: (item, qty = 1, selection) => {
        const key = makeCartKey(item.id, selection);
        const items = [...get().items];
        const existing = items.find((i) => i.key === key);
        if (existing) {
          existing.quantity = Math.min(existing.quantity + qty, item.stock);
        } else {
          items.push({
            key,
            ...item,
            quantity: Math.min(qty, item.stock),
            selectedAttributes: selection,
          });
        }
        set({ items, isOpen: true });
        // Meta Pixel: AddToCart fires here so every entry point (product page,
        // quick-add on cards, bundles) is covered with a single source of truth.
        track("AddToCart", {
          content_type: "product",
          content_ids: [item.id],
          content_name: item.name,
          value: item.price * qty,
          currency: "PKR",
          contents: [{ id: item.id, quantity: qty, item_price: item.price }],
        });
      },
      remove: (key) => set({ items: get().items.filter((i) => i.key !== key) }),
      setQty: (key, qty) => {
        const items = get().items.map((i) =>
          i.key === key ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) } : i
        );
        set({ items });
      },
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set({ isOpen: !get().isOpen }),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "asta-cart",
      version: 2,
      // Migrate from v1 (no `key`) → v2 (key required)
      migrate: (persisted: any, version: number) => {
        if (version < 2 && persisted?.items) {
          persisted.items = persisted.items.map((i: any) => ({
            ...i,
            key: i.key ?? i.id,
          }));
        }
        return persisted;
      },
    }
  )
);
