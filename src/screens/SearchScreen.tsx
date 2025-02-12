import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { searchRestaurants, searchMenuItems } from "../lib/supabase";
import { useCart } from "../hooks/useCart"; // Import useCart hook

export const SearchScreen = ({ navigation }: { navigation: any }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]); // State for recent searches
  const { addToCart } = useCart(); // Get addToCart function from useCart

  // Helper: add a term to recent searches
  const addToRecentSearches = (term: string) => {
    if (term.trim()) {
      setRecentSearches((prev) => {
        const updatedSearches = [term, ...prev.filter((item) => item !== term)];
        return updatedSearches.slice(0, 5); // Keep only the last 5 searches
      });
    }
  };

  // Handle search submission from the text input
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      addToRecentSearches(searchQuery);
    }
  };

  // Fetch restaurants and menu items when searchQuery changes
  useEffect(() => {
    let isActive = true; // flag to prevent state update if component unmounts
    const fetchResults = async () => {
      // Enforce a minimum search length if needed (e.g., 3 characters)
      if (searchQuery.trim().length >= 1) {
        try {
          const [restaurantResults, menuItemResults] = await Promise.all([
            searchRestaurants(searchQuery),
            searchMenuItems(searchQuery),
          ]);
          if (isActive) {
            setRestaurants(restaurantResults);
            setMenuItems(menuItemResults);
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        // Clear results when search is empty or too short
        setRestaurants([]);
        setMenuItems([]);
      }
    };

    fetchResults();

    return () => {
      isActive = false;
    };
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for restaurants or dishes"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit} // Add submit handler
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Restaurants Results */}
        {restaurants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Restaurants Available</Text>
            {restaurants.map((restaurant) => (
              <TouchableOpacity
                key={restaurant.id}
                style={styles.cuisineItem}
                onPress={() => {
                  addToRecentSearches(restaurant.name);
                  console.log(restaurant);
                  navigation.navigate("RestaurantDetails", { restaurant });
                }}
              >
                <Text style={styles.cuisineName}>{restaurant.name}</Text>
                <Text style={styles.cuisineCount}>{restaurant.city}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Menu Items */}
        {menuItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Menu Items</Text>
            {menuItems.map((item) => {
              // Use the full restaurant object if available; otherwise, fallback to an object with the id.
              const restaurant = item.Restaurant || {
                id: item.restaurantId || item.restaurant_id,
              };

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.cuisineItem}
                  onPress={() => {
                    addToRecentSearches(item.label);
                    navigation.navigate("RestaurantDetails", {
                      restaurant, // Passing the restaurant object just like in restaurant search.
                      selectedMenuItem: item, // Optionally, pass the menu item so the screen can highlight it.
                    });
                    console.log(restaurant);
                  }}
                 
                >
                  <Text style={styles.cuisineName}>{item.label}</Text>
                  <Text style={styles.cuisineCount}>
                    {restaurant.name || ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Recent Searches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          {recentSearches.length > 0 ? (
            <View style={styles.recentSearches}>
              {recentSearches.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentSearchItem}
                  onPress={() => setSearchQuery(search)} // Populate search query when pressed
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

        {/* Popular Cuisines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Cuisines</Text>
          {[
            { id: "1", name: "Italian", count: "150+ places" },
            { id: "2", name: "Chinese", count: "120+ places" },
            { id: "3", name: "Japanese", count: "90+ places" },
            { id: "4", name: "Mexican", count: "80+ places" },
          ].map((cuisine) => (
            <TouchableOpacity key={cuisine.id} style={styles.cuisineItem}>
              <Text style={styles.cuisineName}>{cuisine.name}</Text>
              <Text style={styles.cuisineCount}>{cuisine.count}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  recentSearches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  recentSearchItem: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recentSearchText: {
    color: "#4B5563",
    fontSize: 14,
  },
  cuisineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  cuisineName: {
    fontSize: 16,
    color: "#1F2937",
  },
  cuisineCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  noRecentSearches: {
    marginTop: 10,
    fontSize: 16,
    color: "gray",
    fontStyle: "italic",
    textAlign: "center",
  },
});
