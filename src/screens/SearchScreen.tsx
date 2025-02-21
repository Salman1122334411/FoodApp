import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  searchRestaurants,
  searchMenuItems,
  getRestaurants,
  getRestaurantsByFilters,
} from "../lib/supabase";
import { useCart } from "../hooks/useCart";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
// Import the custom location hook
import { useLocation } from "../hooks/useLocation";
// Import the getDistance utility
import { getDistance } from "../utils/geo";
import { supabase } from "../lib/supabase";

const { width } = Dimensions.get("window");

export const SearchScreen = ({ navigation }: { navigation: any }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { addToCart } = useCart();

  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [cuisineRestaurants, setCuisineRestaurants] = useState<any[]>([]);
  const [cuisineLoading, setCuisineLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const scrollY = new Animated.Value(0);

  // --- Location & Default Address State ---
  const { currentLocation, fetchLocation, coords } = useLocation();
  const [defaultAddressCoords, setDefaultAddressCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  // Effective coordinates: use current location if available, otherwise default address.
  const effectiveCoords = coords || defaultAddressCoords;
  //---------------------------------------------

  // Fetch current location on mount.
  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Fetch the user's default address coordinates.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchDefaultAddress(session.user.id);
      }
    });
  }, []);

  const fetchDefaultAddress = async (userId: string) => {
    const { data, error } = await supabase
      .from("Address")
      .select("latitude, longitude")
      .eq("userId", userId)
      .eq("isDefault", true)
      .single();
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

  const addToRecentSearches = (term: string) => {
    if (term.trim()) {
      setRecentSearches((prev) => {
        const updatedSearches = [term, ...prev.filter((item) => item !== term)];
        return updatedSearches.slice(0, 5);
      });
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      addToRecentSearches(searchQuery);
    }
  };

  // Fetch search results using effective coordinates.
  useEffect(() => {
    let isActive = true;
    const fetchResults = async () => {
      if (searchQuery.trim().length >= 1) {
        setLoading(true);
        try {
          if (effectiveCoords) {
            const [restaurantResults, menuItemResults] = await Promise.all([
              searchRestaurants(
                searchQuery,
                effectiveCoords.latitude,
                effectiveCoords.longitude
              ),
              searchMenuItems(
                searchQuery,
                effectiveCoords.latitude,
                effectiveCoords.longitude
              ),
            ]);
            if (isActive) {
              setRestaurants(restaurantResults);
              setMenuItems(menuItemResults);
            }
          } else {
            setRestaurants([]);
            setMenuItems([]);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setRestaurants([]);
        setMenuItems([]);
      }
    };

    fetchResults();

    return () => {
      isActive = false;
    };
  }, [searchQuery, effectiveCoords]);

  // Fetch popular cuisines only from nearby restaurants.
  useEffect(() => {
    const fetchCuisineTypes = async () => {
      try {
        const allRestaurants = await getRestaurants();
        let filteredRestaurants = allRestaurants;
        if (effectiveCoords) {
          filteredRestaurants = allRestaurants.filter((r: any) => {
            const distance = getDistance(
              effectiveCoords.latitude,
              effectiveCoords.longitude,
              r.latitude,
              r.longitude
            );
            return distance <= 10;
          });
        } else {
          filteredRestaurants = [];
        }
        const cuisines = Array.from(
          new Set(filteredRestaurants.map((r: any) => r.cuisineType))
        );
        setCuisineTypes(cuisines);
      } catch (error) {
        console.error("Error fetching cuisines: ", error);
      }
    };
    fetchCuisineTypes();
  }, [effectiveCoords]);

  // Fetch restaurants for the selected cuisine, then filter by location.
  useEffect(() => {
    if (selectedCuisine && effectiveCoords) {
      setCuisineLoading(true);
      getRestaurantsByFilters({ cuisineType: selectedCuisine })
        .then((filtered) => {
          const nearby = filtered.filter((r: any) => {
            const distance = getDistance(
              effectiveCoords.latitude,
              effectiveCoords.longitude,
              r.latitude,
              r.longitude
            );
            return distance <= 10;
          });
          setCuisineRestaurants(nearby);
          setCuisineLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching restaurants for cuisine: ", error);
          setCuisineLoading(false);
        });
    } else {
      setCuisineRestaurants([]);
    }
  }, [selectedCuisine, effectiveCoords]);

  const handleCuisinePress = (cuisine: string) => {
    if (selectedCuisine === cuisine) {
      setSelectedCuisine(null);
    } else {
      setSelectedCuisine(cuisine);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { height: 200 }]}>
        <LinearGradient
          colors={["#FF6B6B", "#FF8E53"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <Text style={styles.title}>Craving something delicious?</Text>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={24}
            color="#6B7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for restaurants or dishes"
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
          />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#FF6B6B"
            style={styles.loader}
          />
        ) : (
          <>
            {restaurants.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Restaurants</Text>
                {restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onPress={() => {
                      addToRecentSearches(restaurant.name);
                      navigation.navigate("RestaurantDetails", { restaurant });
                    }}
                  />
                ))}
              </View>
            )}

            {menuItems.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Menu Items</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {menuItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onPress={() => {
                        addToRecentSearches(item.label);
                        navigation.navigate("RestaurantDetails", {
                          restaurant: item.Restaurant || { id: item.restaurantId },
                          selectedMenuItem: item,
                        });
                      }}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              {recentSearches.length > 0 ? (
                <View style={styles.recentSearches}>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.recentSearchItem}
                      onPress={() => setSearchQuery(search)}
                    >
                      <Text style={styles.recentSearchText}>{search}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noRecentSearches}>
                  Fresh start. Find something tasty!
                </Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popular Cuisines</Text>
              {cuisineTypes.map((cuisine) => (
                <View key={cuisine}>
                  <TouchableOpacity
                    style={styles.cuisineItem}
                    onPress={() => handleCuisinePress(cuisine)}
                  >
                    <Text style={styles.cuisineName}>{cuisine}</Text>
                    <Ionicons
                      name={selectedCuisine === cuisine ? "chevron-up" : "chevron-down"}
                      size={24}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                  {selectedCuisine === cuisine && (
                    <View style={styles.cuisineDropdown}>
                      {cuisineLoading ? (
                        <ActivityIndicator
                          size="small"
                          color="#FF6B2B"
                          style={styles.loader}
                        />
                      ) : (
                        cuisineRestaurants.map((restaurant) => (
                          <RestaurantCard
                            key={restaurant.id}
                            restaurant={restaurant}
                            onPress={() =>
                              navigation.navigate("RestaurantDetails", { restaurant })
                            }
                          />
                        ))
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const RestaurantCard = ({
  restaurant,
  onPress,
}: {
  restaurant: any;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.restaurantCard} onPress={onPress}>
    <Image
      source={{ uri: restaurant.coverImage || "https://via.placeholder.com/150" }}
      style={styles.restaurantImage}
    />
    <View style={styles.restaurantInfo}>
      <Text style={styles.restaurantName}>{restaurant.name || ""}</Text>
      <Text style={styles.restaurantCuisine}>{restaurant.cuisineType || ""}</Text>
      <View style={styles.restaurantMeta}>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>
            {restaurant.rating ? restaurant.rating.toFixed(1) : ""}
          </Text>
        </View>
        <Text style={styles.deliveryTime}>
          {restaurant.deliveryTime ? `${restaurant.deliveryTime} min` : ""}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const MenuItemCard = ({
  item,
  onPress,
}: {
  item: any;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.menuItemCard} onPress={onPress}>
    <Image
      source={{ uri: item.image || "https://via.placeholder.com/150" }}
      style={styles.menuItemImage}
    />
    <Text style={styles.menuItemName}>{item.label || ""}</Text>
    <Text style={styles.menuItemPrice}>
      {item.price ? `$${item.price.toFixed(2)}` : ""}
    </Text>
  </TouchableOpacity>
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: "hidden",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgb(255, 255, 255)",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  scrollContent: {
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  recentSearches: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
  },
  recentSearchItem: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  recentSearchText: {
    color: "#4B5563",
    fontSize: 14,
  },
  noRecentSearches: {
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#6B7280",
    fontStyle: "italic",
    textAlign: "center",
  },
  cuisineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  cuisineName: {
    fontSize: 18,
    color: "#1F2937",
  },
  cuisineDropdown: {
    backgroundColor: "#F9FAFB",
    paddingVertical: 8,
  },
  restaurantCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  restaurantInfo: {
    flex: 1,
    padding: 12,
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
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#D97706",
  },
  deliveryTime: {
    fontSize: 14,
    color: "#6B7280",
  },
  menuItemCard: {
    width: 150,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginRight: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  loader: {
    marginTop: 20,
  },
})

export default SearchScreen