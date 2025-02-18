import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type MenuItem = {
  id: string;
  restaurantId: string;
  label: string;
  description: string;
  price: number;
  image: string;
  category: string;
  created_at?: string;
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
  createdAt?: string;
  menuItems?: MenuItem[];
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
  const { data, error } = await supabase
    .from("Restaurant")
    .select(
      `
      *,
      MenuItem (*)
    `
    )
    .order("name");

  if (error) throw error;
  return data || [];
};

export const getRestaurantById = async (
  id: string
): Promise<Restaurant | null> => {
  const { data, error } = await supabase
    .from("Restaurant")
    .select(
      `
      *,
      MenuItem (*)
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
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
  let query = supabase.from("Restaurant").select(`
      *,
      MenuItem (*)
    `);

  if (cuisineType) query = query.eq("cuisineType", cuisineType);
  if (segment) query = query.eq("segment", segment);
  if (city) query = query.eq("city", city);
  if (area) query = query.eq("area", area);
  if (minRating) query = query.gte("rating", minRating);

  const { data, error } = await query.order("rating", { ascending: false });

  if (error) throw error;
  return data || [];
};

// In your supabase helper file
export const searchRestaurants = async (searchTerm: string) => {
  if (!searchTerm.trim()) return []; // Return empty array if search term is empty
  const { data, error } = await supabase
    .from("Restaurant")
    .select("*")
    .ilike("name", `%${searchTerm}%`);
  if (error) throw error;
  return data || [];
};

export const searchMenuItems = async (searchTerm: string) => {
  if (!searchTerm.trim()) return []; // Return empty array if search term is empty

  const { data, error } = await supabase
    .from("MenuItem")
    .select(`
      *,
      Restaurant:restaurantId (
            id,
            name,
            chainName,
            address,
            latitude,
            longitude,
            cuisineType,
            segment,
            city,
            area,
            rating,
            coverImage,
            deliveryTime,
            minimumOrder
      )
    `)
    .or(`label.ilike.%${searchTerm}%`);

  if (error) throw error;
  return data || [];
};

// Add this helper function to your Supabase utilities
export const getNearbyRestaurants = async (
  userLat: number,
  userLon: number,
  radius: number
): Promise<Restaurant[]> => {
  const { data, error } = await supabase
    .from('Restaurant')
    .select('*')
    .lt('distance', radius)
    .order('distance', { ascending: true })
    .rpc('nearby_restaurants_rpc', { 
      user_lat: userLat,
      user_lon: userLon,
      max_distance: radius
    });

  if (error) throw error;
  return data as Restaurant[];
};