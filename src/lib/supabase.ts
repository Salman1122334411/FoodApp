import { supabase } from './supabaseClient';
export { supabase };
import { getDistance } from "../utils/geo";

export type SelectionType = 'SINGLE' | 'MULTIPLE';

export interface AddonOption {
  id: string;
  addonGroupId: string;
  name: string;
  priceAdjustment: number;
  price_adjustment?: number; // Support snake_case from DB/API
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
  image?: string;
  linkedMenuItemId?: string;
}

export interface AddonGroup {
  id: string;
  restaurantId: string;
  name: string;
  displayName: string | null;
  selectionType: SelectionType;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number | null;
  sortOrder: number;
  isActive: boolean;
  options: AddonOption[];
}

export type MenuItem = {
  id: string;
  restaurantId: string;
  label: string;
  description: string;
  price: number;
  image: string;
  category: string;
  created_at?: string;
  addonGroups?: AddonGroup[];
};

export type Restaurant = {
  id: string;
  name: string;
  chainName: string;
  address: string;
  latitude: number;
  longitude: number;
  cuisineType: string;
  segment: string;
  city: string;
  area: string;
  rating: number;
  coverImage: string;
  deliveryTime: string;
  minimumOrder: string;
  deliveryCharges: number;
  currency?: string;
  createdAt?: string;
  menuItems?: MenuItem[];
  MenuItem?: MenuItem[];
};

export type OrderItem = {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  options?: any;
  price: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  userId: string;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED";
  totalAmount: number;
  deliveryAddress: string;
  driverId: string | null;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  estimatedTime: number | null;
  actualTime: number | null;
  driverRating: number | null;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  restaurant?: Restaurant;
};


export const searchOrders = async (
  searchTerm: string,
  userId: string
): Promise<Order[]> => {
  if (!searchTerm.trim()) return []; // Return empty array if search term is empty

  const { data, error } = await supabase
    .from("Order")
    .select(
      `
      *,
      orderItems:OrderItem (
        id,
        orderId,
        menuItemId,
        quantity,
        options,
        price,
        name,
        createdAt,
        updatedAt
      )
    `
    )
    .eq("userId", userId)
    // Use ilike on the alias "orderItems.name" (case-insensitive)
    .ilike("orderItems.name", `%${searchTerm}%`)
    .order("createdAt", { ascending: false });

  if (error) throw error;
  return data || [];
};


export const getRestaurants = async (): Promise<Restaurant[]> => {
  try {
    console.log("Fetching all restaurants via Web API...");
    const data = await getRestaurantsFromAPI();
    return data || [];
  } catch (error: any) {
    console.error("Error fetching restaurants from Web API:", error.message);
    console.log("Attempting fallback to direct Supabase...");
    
    // Fallback to direct Supabase
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("Restaurant")
      .select(`
        *,
        MenuItem (*)
      `)
      .order("name");

    if (fallbackError) throw fallbackError;
    return fallbackData || [];
  }
};

export const getRestaurantById = async (
  id: string
): Promise<Restaurant | null> => {
  try {
    console.log(`Fetching restaurant ${id} via Web API...`);
    const data = await getRestaurantByIdFromAPI(id);
    return data;
  } catch (error: any) {
    console.error(`Error fetching restaurant ${id} from Web API:`, error.message);
    console.log("Attempting fallback to direct Supabase...");

    const { data, error: fallbackError } = await supabase
      .from("Restaurant")
      .select(`
        *,
        MenuItem (*)
      `)
      .eq("id", id)
      .maybeSingle();

    if (fallbackError) throw fallbackError;
    return data;
  }
};

export const getRestaurantsByFilters = async ({
  cuisineType,
  segment,
  city,
  area,
  minRating,
}: {
  cuisineType?: string;
  segment?: string;
  city?: string;
  area?: string;
  minRating?: number;
}): Promise<Restaurant[]> => {
  try {
    const allRestaurants = await getRestaurants(); // Now using API call
    let filteredData = allRestaurants;

    if (cuisineType) {
      filteredData = filteredData.filter(res => res.cuisineType === cuisineType);
    }
    if (segment) {
      filteredData = filteredData.filter(res => res.segment === segment);
    }
    if (city) {
      filteredData = filteredData.filter(res => res.city === city);
    }
    if (area) {
      filteredData = filteredData.filter(res => res.area === area);
    }
    if (minRating) {
      filteredData = filteredData.filter(res => (res.rating || 0) >= minRating);
    }

    return filteredData.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } catch (error) {
    console.error("Error in getRestaurantsByFilters:", error);
    return [];
  }
};

// In your supabase helper file
export const searchRestaurants = async (
  searchTerm: string,
  latitude: number,
  longitude: number,
  radius: number = 10
) => {
  if (!searchTerm.trim()) return [];
  
  try {
    const allRestaurants = await getRestaurants(); // Now using API call
    
    // Search by name locally
    const matchedRestaurants = allRestaurants.filter((res: any) => 
      res.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter by distance
    const filteredData = matchedRestaurants.filter((restaurant: any) => {
      if (!restaurant.latitude || !restaurant.longitude) return false;
      return getDistance(latitude, longitude, restaurant.latitude, restaurant.longitude) <= radius;
    });
    return filteredData;
  } catch (error) {
    console.error("Error in searchRestaurants:", error);
    return [];
  }
};

/**
 * Search menu items by label and filter by their restaurant's location.
 * @param searchTerm The text to search for.
 * @param latitude User's latitude.
 * @param longitude User's longitude.
 * @param radius Radius in km (default: 10 km).
 * @returns Array of nearby menu items.
 */
export const searchMenuItems = async (
  searchTerm: string,
  latitude: number,
  longitude: number,
  radius: number = 10
) => {
  if (!searchTerm.trim()) return [];
  
  try {
    const allRestaurants = await getRestaurants(); // Now using API call
    const results: any[] = [];
    
    allRestaurants.forEach((restaurant: any) => {
      // Check distance first
      if (!restaurant.latitude || !restaurant.longitude) return;
      const distance = getDistance(latitude, longitude, restaurant.latitude, restaurant.longitude);
      if (distance > radius) return;
      
      // Search in menuItems or MenuItem
      const items = restaurant.menuItems || restaurant.MenuItem || [];
      if (items && Array.isArray(items)) {
        items.forEach((item: any) => {
          if (item && item.label && item.label.toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push({
              ...item,
              Restaurant: restaurant // Include parent restaurant info
            });
          }
        });
      }
    });
    
    return results;
  } catch (error) {
    console.error("Error in searchMenuItems:", error);
    return [];
  }
};

// Add this helper function to your Supabase utilities
export const getNearbyRestaurants = async (
  userLat: number,
  userLon: number,
  radius: number
): Promise<Restaurant[]> => {
  try {
    const allRestaurants = await getRestaurants(); // Now using API call
    
    const filteredData = allRestaurants.filter((restaurant: any) => {
      if (!restaurant.latitude || !restaurant.longitude) return false;
      return getDistance(userLat, userLon, restaurant.latitude, restaurant.longitude) <= radius;
    });
    return filteredData as Restaurant[];
  } catch (error) {
    console.error("Error in getNearbyRestaurants:", error);
    return [];
  }
};

import { getRestaurantsFromAPI, getRestaurantByIdFromAPI, getMenuItemAddonsFromAPI } from "./api";

// ... existing code ...

/**
 * Get addons for a menu item
 * REFACTORED (Hybrid): Now uses the Vercel structure + direct Supabase Options merger.
 */
export const getMenuItemAddons = async (menuItemId: string, restaurantId: string): Promise<AddonGroup[]> => {
  try {

    return await getMenuItemAddonsFromAPI(restaurantId, menuItemId);
  } catch (error) {
    console.error('Error in getMenuItemAddons wrapper:', error);
    return [];
  }
};