import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useNavigation } from '@react-navigation/native'; // Add this import

const CATEGORIES = [
  { id: '1', name: 'All', icon: '🍽️' },
  { id: '2', name: 'Pizza', icon: '🍕' },
  { id: '3', name: 'Burger', icon: '🍔' },
  { id: '4', name: 'Sushi', icon: '🍱' },
  { id: '5', name: 'Dessert', icon: '🍰' },
];

export function HomeScreen() {
  const navigation = useNavigation(); // Initialize navigation
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });
    fetchRestaurants();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    if (error) console.error('Error fetching user:', error.message);
    else setUserName(data?.name || 'User');
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Restaurant')
      .select(`
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
        minimumOrder,
        menuItems: MenuItem (*) // Include menuItems via foreign table
      `)
      .order('rating', { ascending: false });

    if (error) console.error('Error fetching restaurants:', error.message);
    else setRestaurants(data || []);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {userName || 'User'}!</Text>
            <Text style={styles.deliveryAddress}>
              Delivery to Current Location
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity key={category.id} style={styles.categoryItem}>
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Restaurants</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#1F2937" />
          ) : restaurants.length > 0 ? (
            restaurants.map((restaurant) => (
              <TouchableOpacity
                key={restaurant.id}
                style={styles.restaurantCard}
                onPress={() => 
                  navigation.navigate('RestaurantDetails', { restaurant }) // Add onPress
                }
              >
                <Image
                  source={{ uri: restaurant.coverImage }}
                  style={styles.restaurantImage}
                />
                <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantName}>{restaurant.name}</Text>
                  <Text style={styles.restaurantCuisine}>
                    {restaurant.cuisineType} • {restaurant.segment}
                  </Text>
                  <View style={styles.restaurantMeta}>
                    <Text style={styles.metaItem}>⭐ {restaurant.rating}</Text>
                    <Text style={styles.metaItem}>🕒 {restaurant.deliveryTime} min</Text>
                    <Text style={styles.metaItem}>💰 {restaurant.minimumOrder}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noDataText}>No restaurants available</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ... (keep the styles unchanged from previous answer)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  deliveryAddress: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  categories: {
    padding: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 24,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#4B5563',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  restaurantInfo: {
    padding: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  restaurantCuisine: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  restaurantMeta: {
    flexDirection: 'row',
    marginTop: 8,
  },
  metaItem: {
    fontSize: 14,
    color: '#4B5563',
    marginRight: 16,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
  },
});