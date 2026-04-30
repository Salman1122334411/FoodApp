import { create } from 'zustand';

import { AddonOption } from '../lib/supabase';

interface CartItem {
  id: string; // MenuItem ID
  restaurantId: string;
  restaurantName: string;
  restaurantCurrency?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
  deliveryCharges?: number;
  selectedOptions?: AddonOption[];
}

interface CartStore {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string, selectedOptions?: AddonOption[]) => void;
  clearCart: () => void;
  getItemSubtotal: (item: CartItem) => number;
  getTotal: () => number;
  getItemCount: () => number;
  findLatestItemByProductId: (productId: string) => CartItem | undefined;
}

/**
 * Generates a consistent unique identifier for an item configuration.
 * Format: MenuItemId-SortedListOfOptionIds
 */
export const getCartItemKey = (itemId: string, selectedOptions?: AddonOption[]): string => {
  const optionsKey = (selectedOptions || [])
    .map(o => o.id)
    .sort()
    .join('_');
  return `${itemId}${optionsKey ? `-${optionsKey}` : ''}`;
};

/**
 * Universal calculation logic for a single cart item.
 * Base Price + Sum(Option Adjustments) * Quantity
 */
export const calculateItemSubtotal = (basePrice: number, quantity: number, selectedOptions?: AddonOption[]): number => {
  const itemBase = Number(basePrice) || 0;
  let optionsSum = 0;
  
  const options = selectedOptions || [];
  for (const opt of options) {
    // Universal matcher for varied schema field names
    const adjustment = opt.priceAdjustment !== undefined ? opt.priceAdjustment : 
                      (opt.price_adjustment !== undefined ? opt.price_adjustment : 0);
    optionsSum += Number(adjustment) || 0;
  }
  
  return (itemBase + optionsSum) * (quantity || 0);
};

export const useCart = create<CartStore>((set, get) => ({
  cartItems: [],


  addToCart: (newItem) => {
    set((state) => {
      const newItemKey = getCartItemKey(newItem.id, newItem.selectedOptions);

      const existingItemIndex = state.cartItems.findIndex(
        (item) => getCartItemKey(item.id, item.selectedOptions) === newItemKey
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...state.cartItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + (newItem.quantity || 1)
        };
        return { cartItems: updatedItems };
      }

      return { cartItems: [...state.cartItems, { ...newItem, quantity: newItem.quantity || 1 }] };
    });
  },

  removeFromCart: (itemId, selectedOptions = []) => {
    set((state) => {
      const targetKey = getCartItemKey(itemId, selectedOptions);

      const existingItemIndex = state.cartItems.findIndex(
        (item) => getCartItemKey(item.id, item.selectedOptions) === targetKey
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...state.cartItems];
        if (updatedItems[existingItemIndex].quantity > 1) {
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity - 1
          };
          return { cartItems: updatedItems };
        } else {
          return {
            cartItems: state.cartItems.filter((_, index) => index !== existingItemIndex)
          };
        }
      }

      return state;
    });
  },

  clearCart: () => {
    set({ cartItems: [] });
  },

  getItemSubtotal: (item) => {
    return calculateItemSubtotal(item.price, item.quantity, item.selectedOptions);
  },

  getTotal: () => {
    const state = get();
    return state.cartItems.reduce((acc, item) => acc + calculateItemSubtotal(item.price, item.quantity, item.selectedOptions), 0);
  },

  getItemCount: () => {
    const state = get();
    return state.cartItems.reduce(
      (count, item) => count + item.quantity,
      0
    );
  },

  findLatestItemByProductId: (productId) => {
    const state = get();
    // Return the last item added that matches the product ID
    return state.cartItems
      .filter(item => item.id === productId)
      .reverse()[0];
  },
}));
