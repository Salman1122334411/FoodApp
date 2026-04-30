import axios from 'axios';
import { supabase } from './supabaseClient';

const BASE_URL = 'https://fiestafood.vercel.app';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Diagnostic Interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`[API Success] ${response.config.url} - Status: ${response.status}, Data Count: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);
    return response;
  },
  (error) => {
    console.error(`[API Error] ${error.config?.url} - Status: ${error.response?.status}, Message: ${error.message}`);
    return Promise.reject(error);
  }
);

/**
 * Fetches menu items for a restaurant, including all addon groups and options.
 * This utilizes the Prisma-powered Next.js API to bypass Supabase RLS restrictions.
 */
export const getRestaurantMenuItems = async (restaurantId: string) => {
  try {
    const response = await api.get(`/api/restaurants/${restaurantId}/menu-items`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error fetching menu items:', error.response?.data || error.message);
    } else {
      console.error('Unexpected error fetching menu items:', error);
    }
    throw error;
  }
};

/**
 * Fetches specific addons for a menu item.
 * STRATEGY: API-Direct (Bypass DB for maximum parity and speed)
 */
export const getMenuItemAddonsFromAPI = async (restaurantId: string, menuItemId: string) => {
  try {
    console.log(`[Hydration] Fetching Addons DIRECT from VERCEL API for Item ${menuItemId}...`);

    const items = await getRestaurantMenuItems(restaurantId);
    
    if (items && items.length > 0) {
      const item = items.find((m: any) => String(m.id) === String(menuItemId));
      if (item && item.addonGroups && item.addonGroups.length > 0) {
        console.log(`[Hydration] Options Source: VERCEL API (Found ${item.addonGroups.length} groups)`);
        
        return item.addonGroups.map((ag: any) => {
          const groupDetails = ag.addonGroup || ag;
          const options = groupDetails.options || ag.options || [];
          
          return {
            ...groupDetails,
            options: options.map((opt: any) => ({
              ...opt,
              name: opt.name || opt.label,
              priceAdjustment: Number(opt.priceAdjustment) || 0
            }))
          };
        });
      }
    }

    console.log(`[Hydration] No addon data found in API for Item ${menuItemId}`);
    return [];

  } catch (error) {
    console.error('Critical error in API-Direct Hydration:', error);
    return [];
  }
};

/**
 * Fetches all restaurants from the Vercel Web API.
 */
export const getRestaurantsFromAPI = async () => {
  try {
    const response = await api.get('/api/restaurants');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error fetching restaurants:', error.response?.data || error.message);
    } else {
      console.error('Unexpected error fetching restaurants:', error);
    }
    throw error;
  }
};

/**
 * Fetches a single restaurant by its ID from the Vercel Web API.
 */
export const getRestaurantByIdFromAPI = async (id: string) => {
  try {
    const response = await api.get(`/api/restaurants/${id}`);
    return response.data.restaurant;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`API Error fetching restaurant ${id}:`, error.response?.data || error.message);
    } else {
      console.error(`Unexpected error fetching restaurant ${id}:`, error);
    }
    return null;
  }
};
/**
 * Retrieves delivery slots for a restaurant on a specific date.
 * Using hardcoded slots as requested, bypassing the backend API (which is currently returning 500).
 */
export const getDeliverySlots = async (restaurantId: string, date: Date) => {
  try {
    console.log(`[API] Fetching real delivery slots for ${restaurantId} on ${date.toDateString()}`);
    
    // Fetch the restaurant directly to get the DeliverySlot field
    const restaurant = await getRestaurantByIdFromAPI(restaurantId);
    if (!restaurant || !restaurant.DeliverySlot) {
      console.log(`[API] No delivery slots found for restaurant ${restaurantId}`);
      return [];
    }

    const dayOfWeek = date.getDay(); // 0-6 (Sunday to Saturday)
    const isToday = date.toDateString() === new Date().toDateString();
    
    // In React Native, local time is usually what's used for display, 
    // but availability check should be careful about timezones if the backend uses UTC.
    // However, the checkout logic currently uses UTC for "Deliver Now" validation.
    // For "Schedule Later", we'll filter by local hour if it's today.
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    const parseMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + (m || 0);
    };

    // Filter and transform slots
    const availableSlots = restaurant.DeliverySlot
      .filter((slot: any) => slot.dayOfWeek === dayOfWeek && slot.isAvailable)
      .map((slot: any) => {
        const startMinutes = parseMinutes(slot.startTime);
        
        // If it's today, we only show slots that haven't passed (give 30 min buffer)
        const isPast = isToday && (currentTimeMinutes > (startMinutes - 30));

        return {
          id: slot.id || `slot-${slot.startTime}-${slot.dayOfWeek}`,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: !isPast && slot.isAvailable,
        };
      })
      .sort((a: any, b: any) => parseMinutes(a.startTime) - parseMinutes(b.startTime));

    return availableSlots;
  } catch (error) {
    console.error(`Unexpected error fetching delivery slots for ${restaurantId}:`, error);
    return [];
  }
};
/**
 * Fetches order history for a specific user from the Vercel Web API.
 */
export const getUserOrders = async (userId: string, status?: string) => {
  try {
    const response = await api.get('/api/orders', {
      params: { userId, status }
    });
    return response.data;
  } catch (error) {
    console.error('API Error fetching user orders:', error);
    return [];
  }
};

/**
 * Fetches a single order by ID from the Vercel Web API.
 */
export const getOrderById = async (orderId: string) => {
  try {
    const response = await api.get('/api/orders', {
      params: { orderId }
    });
    return response.data;
  } catch (error) {
    console.error(`API Error fetching order ${orderId}:`, error);
    return null;
  }
};

/**
 * Creates a new order via the Vercel Web API.
 * This ensures backend validation (slots, user check) and POS synchronization.
 */
export const createOrder = async (orderData: any) => {
  try {
    const response = await api.post('/api/orders', orderData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const serverMessage = error.response?.data?.error || error.message;
      console.error('API Error creating order:', serverMessage);
      throw new Error(serverMessage);
    } else {
      console.error('Unexpected error creating order:', error);
      throw error;
    }
  }
};
