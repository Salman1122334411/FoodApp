

import React, { useCallback, useEffect, useState } from "react";
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
  StyleSheet as RNStyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase, searchOrders } from "../lib/supabase";
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
}

export function OrdersScreen({ navigation }: { navigation: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollY = new Animated.Value(0);

  // Fetch all orders for the current user
  const fetchOrders = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("Order")
        .select(`
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
          orderItems:OrderItem (
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
          restaurant:Restaurant (
             id,
             name
          )
        `)
        .eq("userId", user.id)
        .order("createdAt", { ascending: false });

      if (error) throw error;

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
    }
  }, []);

  // When the screen mounts or search query is empty, load all orders
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      fetchOrders();
    }
  }, [searchQuery, fetchOrders]);

  // When search query is non-empty, use the searchOrders function from supabase.ts
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const search = async () => {
        try {
          setLoading(true);
          const result = await searchOrders(searchQuery);
          setOrders(result);
        } catch (error) {
          console.error("Error searching orders:", error);
          Alert.alert("Error", "Failed to search orders");
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      };
      search();
    }
  }, [searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (searchQuery.trim().length === 0) {
      fetchOrders();
    } else {
      const search = async () => {
        try {
          const result = await searchOrders(searchQuery);
          setOrders(result);
        } catch (error) {
          console.error("Error refreshing search orders:", error);
        } finally {
          setRefreshing(false);
        }
      };
      search();
    }
  }, [fetchOrders, searchQuery]);

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

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [200, 120],
    extrapolate: "clamp",
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={["#FF6B6B", "#FF8E53"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={RNStyleSheet.absoluteFill}
        />
        <BlurView intensity={20} style={RNStyleSheet.absoluteFill} />
        <Animated.Text
          style={[
            styles.title,
            {
              fontSize: headerHeight.interpolate({
                inputRange: [120, 200],
                outputRange: [24, 32],
                extrapolate: "clamp",
              }),
            },
          ]}
        >
          Your Orders
        </Animated.Text>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={24} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders"
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </Animated.View>
      <Animated.FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No orders found</Text>
            <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate("Home")}>
              <Text style={styles.browseButtonText}>Browse Restaurants</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  header: {
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: "hidden",
  },
  title: {
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
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
})

