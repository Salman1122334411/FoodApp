import React, { useCallback, useEffect, useState, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
  TextInput,
  StyleProp,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Restaurant {
  id: string;
  name: string;
}

export interface Order {
  id: string;
  userId: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PREPARING"
    | "READY"
    | "DELIVERED"
    | "CANCELLED";
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
}

// ----------------------
// SearchBar Component
// ----------------------
const SearchBar = memo(
  ({
    searchQuery,
    onChangeText,
  }: {
    searchQuery: string;
    onChangeText: (text: string) => void;
  }) => {
    return (
      <View style={searchBarStyles.container}>
        <Ionicons name="search" size={24} color="#6B7280" style={searchBarStyles.searchIcon} />
        <TextInput
          style={searchBarStyles.input}
          placeholder="Search orders by item name"
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={onChangeText}
          returnKeyType="search"
        />
      </View>
    );
  }
);

const searchBarStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgb(255,255,255)",
    borderRadius: 12,
    paddingHorizontal: 12,
    // Removed extra marginBottom so it fits well within the header.
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
});

// ----------------------
// Debounce Hook
// ----------------------
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ----------------------
// OrdersScreen Component
// ----------------------
export function OrdersScreen({ navigation }: { navigation: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const scrollY = new Animated.Value(0);

  // ----------------------
  // Fetch Orders
  // ----------------------
  const fetchOrders = useCallback(
    async (searchTerm: string = "") => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        } else {
          setIsSearching(true);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");

        let query;
        if (searchTerm) {
          query = supabase
            .from("Order")
            .select(
              `
              id,
              "userId",
              status,
              "totalAmount",
              "deliveryAddress",
              "driverId",
              "assignedAt",
              "pickedUpAt",
              "deliveredAt",
              "estimatedTime",
              "actualTime",
              "driverRating",
              "createdAt",
              "updatedAt",
              orderItems:OrderItem!inner(
                 id,
                 "orderId",
                 "menuItemId",
                 quantity,
                 options,
                 price,
                 name,
                 "createdAt",
                 "updatedAt"
              ),
              restaurant:Restaurant(
                 id,
                 name
              )
            `
            )
            .eq("userId", user.id)
            .ilike("orderItems.name", `%${searchTerm}%`)
            .order("createdAt", { ascending: false });
        } else {
          query = supabase
            .from("Order")
            .select(
              `
              id,
              "userId",
              status,
              "totalAmount",
              "deliveryAddress",
              "driverId",
              "assignedAt",
              "pickedUpAt",
              "deliveredAt",
              "estimatedTime",
              "actualTime",
              "driverRating",
              "createdAt",
              "updatedAt",
              orderItems:OrderItem(
                 id,
                 "orderId",
                 "menuItemId",
                 quantity,
                 options,
                 price,
                 name,
                 "createdAt",
                 "updatedAt"
              ),
              restaurant:Restaurant(
                 id,
                 name
              )
            `
            )
            .eq("userId", user.id)
            .order("createdAt", { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;

        // Ensure orderItems is an array for each order.
        const formattedOrders = data.map((order: any) => ({
          ...order,
          orderItems: Array.isArray(order.orderItems) ? order.orderItems : [],
        }));

        setOrders(formattedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        Alert.alert("Error", "Failed to load orders");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setIsSearching(false);
        setIsInitialLoad(false);
      }
    },
    [isInitialLoad]
  );

  // Fetch orders when the debounced search term changes.
  useEffect(() => {
    fetchOrders(debouncedSearchTerm);
  }, [debouncedSearchTerm, fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(debouncedSearchTerm);
  }, [debouncedSearchTerm, fetchOrders]);

  // ----------------------
  // Helpers for Order Card
  // ----------------------
  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "PENDING":
        return "#FCD34D";
      case "CONFIRMED":
        return "#60A5FA";
      case "PREPARING":
        return "#818CF8";
      case "READY":
        return "#34D399";
      case "DELIVERED":
        return "#10B981";
      case "CANCELLED":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "PENDING":
        return "time-outline";
      case "CONFIRMED":
        return "checkmark-circle-outline";
      case "PREPARING":
        return "restaurant-outline";
      case "READY":
        return "bicycle-outline";
      case "DELIVERED":
        return "checkmark-done-circle-outline";
      case "CANCELLED":
        return "close-circle-outline";
      default:
        return "help-circle-outline";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate("OrderDetails", { order: item })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.restaurantName}>
            {item.restaurant ? item.restaurant.name : "Restaurant"}
          </Text>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons name={getStatusIcon(item.status)} size={16} color="#fff" />
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()}
          </Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {(item.orderItems || []).slice(0, 2).map((orderItem, index) => (
          <Text key={index} style={styles.orderItemText}>
            {orderItem.quantity}x {orderItem.name}
          </Text>
        ))}
        {item.orderItems.length > 2 && (
          <Text style={styles.orderItemText}>
            +{item.orderItems.length - 2} more items
          </Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalItems}>
          {item.orderItems.reduce((sum, orderItem) => sum + orderItem.quantity, 0)} items
        </Text>
        <Text style={styles.totalAmount}>${item.totalAmount.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  // ----------------------
  // (Optional) Animated header height interpolation
  // ----------------------
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 160],
    extrapolate: "clamp",
  });

  // ----------------------
  // Render
  // ----------------------
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with gradient and blur matching the SearchScreen */}
      <Animated.View style={[styles.header, { height: 200 }]}>
        <LinearGradient
          colors={["#FF6B6B", "#FF8E53"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <Text style={styles.title}>My Orders</Text>
        <SearchBar searchQuery={searchQuery} onChangeText={setSearchQuery} />
      </Animated.View>

      {/* Orders list */}
      <Animated.FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF6B6B"]}
            tintColor="#FF6B6B"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {isSearching ? (
              <ActivityIndicator size="large" color="#FF6B6B" />
            ) : (
              <>
                <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyText}>No orders found</Text>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => navigation.navigate("Restaurants")}
                >
                  <Text style={styles.browseButtonText}>Browse Restaurants</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            {isSearching && !refreshing && (
              <ActivityIndicator size="small" color="#FF6B6B" />
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ----------------------
// Styles
// ----------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // Matches the SearchScreen background
    paddingTop: -35,

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
  listContainer: {
    padding: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  orderDate: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItemText: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  totalItems: {
    fontSize: 14,
    color: "#6B7280",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF4B2B",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#4B5563",
    marginTop: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#FF4B2B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default OrdersScreen;
