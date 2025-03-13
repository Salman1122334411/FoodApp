import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { HomeScreenSkeleton } from "../../components/skeleton";
import { useLocation } from "../hooks/useLocation";
import SaveLocationModal from "./SaveLocationModal";
import { getDistance } from "../utils/geo";
import ProfileSetupModal from "./ProfileSetupModal";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.7;

const OFFERS = [
  {
    id: "1",
    title: "50% OFF",
    description: "On your first order",
    color: "#FF5A5F",
  },
  {
    id: "2",
    title: "Free Delivery",
    description: "On orders above $20",
    color: "#00A699",
  },
];

interface MenuItem {
  id: string;
  label: string;
  price: number;
  image: string;
  restaurantId: string;
  Restaurant?: {
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
  };
}

export function HomeScreen() {
  const navigation = useNavigation();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [popularMenuItems, setPopularMenuItems] = useState<MenuItem[]>([]);
  const [popularLoading, setPopularLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [defaultAddressCoords, setDefaultAddressCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { currentLocation, fetchLocation, coords } = useLocation();
  console.log("currentLocation:", currentLocation);

  useEffect(() => {
    fetchLocation();
}, [fetchLocation]);

  // Check the user's profile on screen focus.
  useFocusEffect(
    useCallback(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          supabase
            .from("User")
            .select("*")
            .eq("id", session.user.id)
            .single()
            .then(({ data, error }) => {
              if (error || !data) {
                // Profile doesn't exist: show the modal.
                setShowProfileModal(true);
              } else {
                setShowProfileModal(false);
              }
            });
        }
      });
    }, [])
  );

  useEffect(() => {
    if (!session) return;
    const userSubscription = supabase
      .channel("user-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "User",
          filter: `id=eq.${session.user.id}`,
        },
        (payload) => {
          setUserName(payload.new.name);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userSubscription);
    };
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
        fetchDefaultAddress(session.user.id);
      }
    });
    fetchRestaurants();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
        fetchDefaultAddress(session.user.id);
      }
    });
    fetchRestaurants();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("User")
      .select("name")
      .eq("id", userId)
      .maybeSingle();

    if (error) console.error("Error fetching user:", error.message);
    else setUserName(data?.name || "User");
  };

  const fetchDefaultAddress = async (userId: string) => {
    const { data, error } = await supabase
      .from("Address")
      .select("latitude, longitude")
      .eq("userId", userId)
      .eq("isDefault", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching default address:", error.message);
      return;
    }
    if (data && data.latitude && data.longitude) {
      setDefaultAddressCoords({
        latitude: data.latitude,
        longitude: data.longitude,
      });
    }
  };

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("Restaurant")
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
        menuItems: MenuItem (*)
      `)
      .order("rating", { ascending: false });

    if (error) console.error("Error fetching restaurants:", error.message);
    else setRestaurants(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const restaurantSubscription = supabase
      .channel("restaurants")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Restaurant" },
        (payload) => {
          console.log("Realtime restaurant update:", payload);
          fetchRestaurants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(restaurantSubscription);
    };
  }, [fetchRestaurants]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRestaurants();
    setRefreshing(false);
  }, [fetchRestaurants]);

  useEffect(() => {
    const effectiveCoords = coords || defaultAddressCoords;
    if (effectiveCoords && restaurants.length > 0) {
      const filtered = restaurants.filter((restaurant) => {
        const distance = getDistance(
          effectiveCoords.latitude,
          effectiveCoords.longitude,
          restaurant.latitude,
          restaurant.longitude
        );
        return distance <= 10;
      });
      setNearbyRestaurants(filtered);
    }
  }, [coords, defaultAddressCoords, restaurants]);

  // Fetch popular menu items with a loader for popular dishes
  useEffect(() => {
    if (nearbyRestaurants.length === 0) {
      setPopularMenuItems([]);
      setPopularLoading(false);
      return;
    }
  
    const fetchPopularMenuItems = async () => {
      setPopularLoading(true);
      // Get IDs of restaurants that are nearby.
      const restaurantIds = nearbyRestaurants.map((r) => r.id);
  
      const { data, error } = await supabase
        .from("MenuItem")
        .select(
          `id,
          label,
          price,
          image,
          restaurantId,
          Restaurant:Restaurant (
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
          )`
        )
        .in("restaurantId", restaurantIds)
        .order("createdAt", { ascending: true });
  
      if (error) {
        console.error("Error fetching popular menu items", error);
        setPopularLoading(false);
        return;
      }
  
      // Pick one dish per restaurant.
      const uniqueItems: MenuItem[] = [];
      const seenRestaurants = new Set<string>();
      data?.forEach((item: MenuItem) => {
        if (!seenRestaurants.has(item.restaurantId)) {
          uniqueItems.push(item);
          seenRestaurants.add(item.restaurantId);
        }
      });
  
      // Set a maximum of 5 popular items.
      setPopularMenuItems(uniqueItems.slice(0, 5));
      setPopularLoading(false);
    };
  
    fetchPopularMenuItems();
  }, [nearbyRestaurants]);

  if (loading) {
    return <HomeScreenSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={showProfileModal} animationType="slide">
        <ProfileSetupModal
          onProfileSetupSuccess={() => {
            setShowProfileModal(false);
            if (session) {
              fetchUserProfile(session.user.id);
            }
          }}
        />
      </Modal>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {userName}! 👋</Text>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="location-outline" size={20} color="#FF4B2B" />
              <Text style={styles.deliveryAddress}>{currentLocation}</Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Offers Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersContainer}
        >
          {OFFERS.map((offer) => (
            <View
              key={offer.id}
              style={[styles.offerCard, { backgroundColor: offer.color }]}
            >
              <View style={styles.offerContent}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text style={styles.offerDescription}>{offer.description}</Text>
                <TouchableOpacity
                  style={styles.orderNowButton}
                  onPress={() => navigation.navigate("Restaurants")}
                >
                  <Text style={styles.orderNowText}>Order Now</Text>
                </TouchableOpacity>
              </View>
              <Image source={{ uri: offer.image }} style={styles.offerImage} />
            </View>
          ))}
        </ScrollView>

        {/* Popular Dishes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Dishes</Text>
          {popularLoading ? (
            <ActivityIndicator
              size="small"
              color="#FF4B2B"
              style={{ marginTop: 10 }}
            />
          ) : popularMenuItems.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularDishes}
            >
              {popularMenuItems.map((dish) => (
                <TouchableOpacity
                  key={dish.id}
                  style={styles.dishCard}
                  onPress={() => {
                    navigation.navigate("RestaurantDetails", {
                      restaurant: dish.Restaurant,
                      menuItem: dish,
                    });
                  }}
                >
                  <Image source={{ uri: dish.image }} style={styles.dishImage} />
                  <View style={styles.dishInfo}>
                    <Text style={styles.dishName}>{dish.label}</Text>
                    <Text style={styles.dishRestaurant}>
                      {dish.Restaurant?.name}
                    </Text>
                    <Text style={styles.dishPrice}>
                      ${dish.price.toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noDataText}>
              No popular dishes available
            </Text>
          )}
        </View>

        {/* Nearby Restaurants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Restaurants</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Restaurants")}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#FF4B2B" />
          ) : nearbyRestaurants.length > 0 ? (
            nearbyRestaurants.map((restaurant) => (
              <TouchableOpacity
                key={restaurant.id}
                style={styles.restaurantCard}
                onPress={() =>
                  navigation.navigate("RestaurantDetails", { restaurant })
                }
              >
                <Image
                  source={{ uri: restaurant.coverImage }}
                  style={styles.restaurantImage}
                />
                <View style={styles.restaurantOverlay}>
                  <View style={styles.deliveryTimeChip}>
                    <Ionicons name="time-outline" size={16} color="#FF4B2B" />
                    <Text style={styles.deliveryTimeText}>
                      {restaurant.deliveryTime}
                    </Text>
                  </View>
                </View>
                <View style={styles.restaurantInfo}>
                  <View style={styles.restaurantHeader}>
                    <View>
                      <Text style={styles.restaurantName}>
                        {restaurant.name}
                      </Text>
                      <Text style={styles.restaurantCuisine}>
                        {restaurant.cuisineType} • {restaurant.segment}
                      </Text>
                    </View>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.ratingText}>
                        {restaurant.rating}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.restaurantMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="bicycle-outline"
                        size={16}
                        color="#6B7280"
                      />
                      <Text style={styles.metaText}>Free Delivery</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="cash-outline" size={16} color="#6B7280" />
                      <Text style={styles.metaText}>
                        {restaurant.minimumOrder}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noDataText}>
              No nearby restaurants available
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Floating Cart Button */}
      <TouchableOpacity
        style={styles.floatingCartButton}
        onPress={() => navigation.navigate("Cart")}
      >
        <Ionicons name="cart" size={24} color="#fff" />
      </TouchableOpacity>

      <SaveLocationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddressAdded={() => {
          // Optionally refresh addresses or show a toast message
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    padding: 8,
    borderRadius: 20,
    maxWidth: "100%", // Ensures the button doesn't extend beyond the screen
  },
  deliveryAddress: {
    marginHorizontal: 8,
    fontSize: 14,
    flexShrink: 1, // Allows the text to shrink if it's too long
    // Alternatively, you can use flexWrap if you prefer multiline text:
    // flexWrap: "wrap",
  },
  // Cart button in header
  cartButton: {
    backgroundColor: "#FF4B2B",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  // Floating cart button at bottom right
  floatingCartButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#FF4B2B",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  offersContainer: {
    padding: 16,
  },
  offerCard: {
    width: CARD_WIDTH,
    height: 160,
    marginRight: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    overflow: "hidden",
  },
  offerContent: {
    flex: 1,
    justifyContent: "center",
  },
  offerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  offerDescription: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 16,
  },
  orderNowButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  orderNowText: {
    color: "#FF4B2B",
    fontWeight: "600",
  },
  offerImage: {
    width: 120,
    height: 120,
    position: "absolute",
    right: -20,
    bottom: -20,
  },

  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  seeAllButton: {
    fontSize: 14,
    color: "#FF4B2B",
    fontWeight: "600",
  },
  // Added bottom margin to popular dishes to separate from featured restaurants
  popularDishes: {
    paddingTop: 8,
    marginBottom: 24,
  },
  dishCard: {
    width: 200,
    marginRight: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dishImage: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  dishInfo: {
    padding: 12,
  },
  dishName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  dishRestaurant: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  dishPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF4B2B",
  },
  restaurantCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  restaurantOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  deliveryTimeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  deliveryTimeText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#FF4B2B",
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  restaurantCuisine: {
    fontSize: 14,
    color: "#6B7280",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#D97706",
  },
  restaurantMeta: {
    flexDirection: "row",
    marginTop: 8,
  },
  noDataText: {
    textAlign: "center",
    marginTop: 10,
    color: "#6B7280",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  metaText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#6B7280",
  },
  noDataText: {
    textAlign: "center",
    fontSize: 16,
    color: "#6B7280",
    marginTop: 24,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});