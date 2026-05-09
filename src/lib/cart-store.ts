"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  sku: string;
  quantity: number;
  stock: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
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
      add: (item, qty = 1) => {
        const items = [...get().items];
        const existing = items.find((i) => i.id === item.id);
        if (existing) {
          existing.quantity = Math.min(existing.quantity + qty, item.stock);
        } else {
          items.push({ ...item, quantity: Math.min(qty, item.stock) });
        }
        set({ items, isOpen: true });
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      setQty: (id, qty) => {
        const items = get().items.map((i) =>
          i.id === id ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) } : i
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
    { name: "asta-cart" }
  )
);
