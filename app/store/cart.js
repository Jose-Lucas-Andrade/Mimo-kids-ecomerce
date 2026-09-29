'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const initialShipping = {
  cep: '',
  city: '',
  state: '',
  options: [],
  selectedIndex: 0,
};

export const useCart = create(
  persist(
    (set, get) => ({
      items: [], // {id, name, price, qty, imageUrl, weight}
      shipping: initialShipping,
      add: (product, qty = 1) => {
        const items = [...get().items];
        const idx = items.findIndex((i) => i.id === product.id);
        const previousQty = idx >= 0 ? items[idx].qty : 0;
        const stock = Number(product.stock);
        const nextQty = Math.min(stock, previousQty + qty);
        if (nextQty <= previousQty) return 0;

        if (idx >= 0) {
          items[idx] = {
            ...items[idx],
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            stock,
            weight: Number(product.shippingWeightKg) || 0.3,
            qty: nextQty,
          };
        }
        else items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          stock: Number(product.stock),
          qty: nextQty,
          weight: Number(product.shippingWeightKg) || 0.3,
        });
        set({ items, shipping: initialShipping });
        return nextQty - previousQty;
      },
      setQuantity: (id, qty) => {
        const items = get().items.map((item) => {
          if (item.id !== id) return item;
          const maximum = Number.isSafeInteger(item.stock) && item.stock >= 0 ? item.stock : 99;
          return { ...item, qty: Math.max(1, Math.min(maximum, Math.floor(Number(qty) || 1))) };
        }).filter((item) => item.stock !== 0);
        set({ items, shipping: initialShipping });
      },
      remove: (id) => {
        const items = get().items.filter((i) => i.id !== id);
        set({ items, shipping: initialShipping });
      },
      clear: () => set({ items: [], shipping: initialShipping }),
      setShippingQuote: ({ cep, city, state, options }) => {
        set({
          shipping: {
            cep,
            city,
            state,
            options: Array.isArray(options) ? options : [],
            selectedIndex: 0,
          }
        });
      },
      selectShipping: (index) => {
        const shipping = get().shipping;
        if (!shipping.options[index]) return;
        set({ shipping: { ...shipping, selectedIndex: index } });
      },
      clearShipping: () => set({ shipping: initialShipping }),
      selectedShipping: () => {
        const { shipping } = get();
        return shipping.options[shipping.selectedIndex] || null;
      },
      subtotal: () => get().items.reduce((acc, i) => acc + i.price * i.qty, 0),
      totalWeight: () => get().items.reduce((acc, i) => acc + (i.weight || 0.3) * i.qty, 0),
    }),
    {
      name: 'mimo-kids-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, shipping: state.shipping }),
    }
  )
);
