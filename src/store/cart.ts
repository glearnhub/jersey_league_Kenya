'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  key: string;
  productId: number;
  size: string;
  quantity: number;
  printName: string | null;
  printNumber: string | null;
  sleeveBadge: boolean;
}

export function makeCartKey(
  productId: number,
  size: string,
  printName: string | null,
  printNumber: string | null,
  sleeveBadge: boolean
): string {
  return [productId, size, printName || '', printNumber || '', sleeveBadge ? '1' : '0'].join('|');
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'key'>) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  totalCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (incoming) => {
        const key = makeCartKey(
          incoming.productId,
          incoming.size,
          incoming.printName,
          incoming.printNumber,
          incoming.sleeveBadge
        );
        const existing = get().items.find((i) => i.key === key);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.key === key ? { ...i, quantity: Math.min(10, i.quantity + incoming.quantity) } : i
            ),
          });
        } else {
          set({
            items: [...get().items, { ...incoming, key, quantity: Math.min(10, Math.max(1, incoming.quantity)) }],
          });
        }
      },
      setQuantity: (key, quantity) => {
        if (quantity < 1) {
          set({ items: get().items.filter((i) => i.key !== key) });
        } else {
          set({
            items: get().items.map((i) =>
              i.key === key ? { ...i, quantity: Math.min(10, Math.floor(quantity)) } : i
            ),
          });
        }
      },
      removeItem: (key) => {
        set({ items: get().items.filter((i) => i.key !== key) });
      },
      clear: () => set({ items: [] }),
      totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'jlk-cart-storage',
    }
  )
);
