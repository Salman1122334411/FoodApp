import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

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
  created_at?: string;
  menuItems?: MenuItem[];
};

export const getRestaurants = async (): Promise<Restaurant[]> => {
  const { data, error } = await supabase
    .from('Restaurant')
    .select(`
      *,
      MenuItem (*)
    `)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const getRestaurantById = async (id: string): Promise<Restaurant | null> => {
  const { data, error } = await supabase
    .from('Restaurant')
    .select(`
      *,
      MenuItem (*)
    `)
    .eq('id', id)
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
  let query = supabase
    .from('Restaurant')
    .select(`
      *,
      MenuItem (*)
    `);

  if (cuisineType) query = query.eq('cuisineType', cuisineType);
  if (segment) query = query.eq('segment', segment);
  if (city) query = query.eq('city', city);
  if (area) query = query.eq('area', area);
  if (minRating) query = query.gte('rating', minRating);

  const { data, error } = await query.order('rating', { ascending: false });

  if (error) throw error;
  return data || [];
};

// In your supabase helper file
export const searchRestaurants = async (searchTerm: string) => {
  if (!searchTerm.trim()) return []; // Return empty array if search term is empty
  const { data, error } = await supabase
    .from('Restaurant')
    .select('*')
    .ilike('name', `%${searchTerm}%`);
  if (error) throw error;
  return data || [];
};

export const searchMenuItems = async (searchTerm: string) => {
  if (!searchTerm.trim()) return []; // Return empty array if search term is empty
  const { data, error } = await supabase
    .from('MenuItem')
    .select(`
      id,
      label,
      price,
      restaurantId,
      Restaurant:Restaurant (id, name, city)
    `)
    .or(`label.ilike.%${searchTerm}%`);
  if (error) throw error;
  return data || [];
};




export const getNearbyRestaurants = async (
  latitude: number,
  longitude: number,
  radiusInKm: number = 5
): Promise<Restaurant[]> => {
  // Using Postgres earth distance calculation
  const { data, error } = await supabase
    .from('Restaurant')
    .select(`
      *,
      MenuItem (*),
      earth_distance(
        ll_to_earth(${latitude}, ${longitude}),
        ll_to_earth(latitude, longitude)
      ) as distance
    `)
    .lt('earth_box(ll_to_earth($1, $2), $3)::float', radiusInKm * 1000)
    .order('distance');

  if (error) throw error;
  return data || [];
};
