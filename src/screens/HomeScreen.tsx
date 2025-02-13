import { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../lib/supabase"
import type { Session } from "@supabase/supabase-js"
import { useNavigation } from "@react-navigation/native"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width * 0.7
const OFFERS = [
  {
    id: "1",
    title: "50% OFF",
    description: "On your first order",
    image: "https://your-cdn.com/offers/1.jpg",
    color: "#FF5A5F",
  },
  {
    id: "2",
    title: "Free Delivery",
    description: "On orders above $20",
    image: "https://your-cdn.com/offers/2.jpg",
    color: "#00A699",
  },
]


interface MenuItem {
  id: string;
  label: string;
  price: number;
  image: string;
  restaurantId: string;
  Restaurant?: {
    name: string;
  };
}
export function HomeScreen() {
  const navigation = useNavigation()
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [popularMenuItems, setPopularMenuItems] = useState<MenuItem[]>([]);
 // New state for current location string.
 const [currentLocation, setCurrentLocation] = useState("Fetching current location...");

 // Request location permission and get current location.
 useEffect(() => {
  (async () => {
    try {
      // Request foreground permission
      console.log("hello")
      let { status } = await Location.requestForegroundPermissionsAsync();
      console.log("Location permission status:", status);
      if (status !== "granted") {
        setCurrentLocation("Location permission denied");
        return;
      }
      // Get current position
      let loc = await Location.getCurrentPositionAsync({});
      console.log("Location fetched:", loc);
      const { latitude, longitude } = loc.coords;
      setCurrentLocation(`Delivery to: (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
    } catch (error) {
      console.error("Error fetching location:", error);
      setCurrentLocation("Error fetching location");
    }
  })();
}, []);

  useEffect(() => {
    const fetchPopularMenuItems = async () => {
      // Adjust the query as needed—for example, ordering by a popularity field or createdAt
      const { data, error } = await supabase
  .from('MenuItem')
  .select(`
    id,
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
    )
  `)
  .order('createdAt', { ascending: false })
  .limit(10);
      if (error) {
        console.error('Error fetching popular menu items', error);
        return;
      }

      // Filter out items to only show one per restaurant
      const uniqueItems: MenuItem[] = [];
      const seenRestaurants = new Set<string>();
      data?.forEach((item: MenuItem) => {
        if (!seenRestaurants.has(item.restaurantId)) {
          uniqueItems.push(item);
          seenRestaurants.add(item.restaurantId);
        }
      });

      // Limit to at most 5 items
      setPopularMenuItems(uniqueItems.slice(0, 5));
    };

    fetchPopularMenuItems();
  }, []);


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchUserProfile(session.user.id)
    })
    fetchRestaurants()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase.from("User").select("name").eq("id", userId).single()

    if (error) console.error("Error fetching user:", error.message)
    else setUserName(data?.name || "User")
  }

  const fetchRestaurants = async () => {
    setLoading(true)
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
      .order("rating", { ascending: false })

    if (error) console.error("Error fetching restaurants:", error.message)
    else setRestaurants(data || [])
    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {userName || "User"}! 👋</Text>
            <TouchableOpacity style={styles.locationButton}>
              <Ionicons name="location-outline" size={20} color="#FF4B2B" />
              {/* Display the current location state here */}
              <Text style={styles.deliveryAddress}>{currentLocation}</Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {/* (You can add your search bar here) */}

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


        {/* Categories */}

        {/* Popular Dishes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Dishes</Text>
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
                  <Text style={styles.dishRestaurant}>{dish.Restaurant?.name}</Text>
                  <Text style={styles.dishPrice}>${dish.price.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Restaurants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Restaurants</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Restaurants")}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#FF4B2B" />
          ) : restaurants.length > 0 ? (
            restaurants.map((restaurant) => (
              <TouchableOpacity
                key={restaurant.id}
                style={styles.restaurantCard}
                onPress={() => navigation.navigate("RestaurantDetails", { restaurant })}
              >
                <Image source={{ uri: restaurant.coverImage }} style={styles.restaurantImage} />
                <View style={styles.restaurantOverlay}>
                  <View style={styles.deliveryTimeChip}>
                    <Ionicons name="time-outline" size={16} color="#FF4B2B" />
                    <Text style={styles.deliveryTimeText}>{restaurant.deliveryTime}</Text>
                  </View>
                </View>
                <View style={styles.restaurantInfo}>
                  <View style={styles.restaurantHeader}>
                    <View>
                      <Text style={styles.restaurantName}>{restaurant.name}</Text>
                      <Text style={styles.restaurantCuisine}>
                        {restaurant.cuisineType} • {restaurant.segment}
                      </Text>
                    </View>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.ratingText}>{restaurant.rating}</Text>
                    </View>
                  </View>
                  <View style={styles.restaurantMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="bicycle-outline" size={16} color="#6B7280" />
                      <Text style={styles.metaText}>Free Delivery</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="cash-outline" size={16} color="#6B7280" />
                      <Text style={styles.metaText}>{restaurant.minimumOrder}</Text>
                    </View>
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
  },
  deliveryAddress: { marginHorizontal: 8, fontSize: 14, color: "#333" },
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
});


