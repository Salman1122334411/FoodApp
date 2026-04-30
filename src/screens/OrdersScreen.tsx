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
  TextInput,
  StyleProp,
  ViewStyle,
} from "react-native";
import { styles, searchBarStyles } from "./OrdersScreen.styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import { formatPrice } from "../utils/currency";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useCart } from "../hooks/useCart";
import { useTranslation } from "react-i18next";
import Preloader from "../components/Preloader";
import { Colors as BrandColors } from "../constants/Colors";
import { getUserOrders } from "../lib/api";


interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  menuItem?: {
    image: string | null;
  };
}

interface Restaurant {
  id: string;
  name: string;
  deliveryCharges?: number;
  currency?: string;
  coverImage?: string;
}

export interface Order {
  id: string;
  userId: string;
  status:
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKUP_CONFIRMED"
  | "OUT_FOR_DELIVERY"
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
    const { t } = useTranslation();
    return (
      <View style={searchBarStyles.container}>
        <Ionicons
          name="search"
          size={24}
          color="#6B7280"
          style={searchBarStyles.searchIcon}
        />
        <TextInput
          style={searchBarStyles.input}
          placeholder={t('orders.search_placeholder')}
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={onChangeText}
          underlineColorAndroid="transparent"
          returnKeyType="search"
        />
      </View>
    );
  }
);


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
  const insets = useSafeAreaInsets();

  // Hook from useCart
  const addToCart = useCart((state) => state.addToCart);
  const { t, i18n } = useTranslation();

  const handleReorder = (order: Order) => {
    order.orderItems.forEach((item) => {
      addToCart({
        id: (item as any).menuItemId || item.id,
        restaurantId: order.restaurant?.id || "",
        restaurantName: order.restaurant?.name || t('orders.ref_prefix') + order.id,
        restaurantCurrency: order.restaurant?.currency,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.menuItem?.image || undefined
      });
    });
    navigation.navigate("Cart");
  };


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

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");

        console.log("DEBUG: Fetching orders through Vercel API for user ID:", user.id);
        
        // Use the centralized Vercel API for order history
        const data = await getUserOrders(user.id);
        
        // Ensure data is an array
        const allOrders = Array.isArray(data) ? data : (data?.data || []);

        // Apply client-side search filtering if a search term is provided
        let filteredOrders = allOrders;
        if (searchTerm) {
          filteredOrders = allOrders.filter((order: any) => 
            (order.restaurant?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.orderItems?.some((item: any) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }

        // Map data to match local Order interface if necessary
        const formattedOrders = filteredOrders.map((order: any) => ({
          ...order,
          orderItems: Array.isArray(order.orderItems) ? order.orderItems : [],
        }));

        setOrders(formattedOrders);
      } catch (error) {
        console.error("Error fetching orders from API:", error);
        Alert.alert(t('common.error'), t('orders.load_error'));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setIsSearching(false);
        setIsInitialLoad(false);
      }
    },
    [isInitialLoad, t]
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
  // Realtime Subscription for Orders
  // ----------------------
  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;
    async function setupRealtime() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      subscription = supabase
        .channel("orders")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Order",
            filter: `userId=eq.${user.id}`,
          },
          (payload) => {
            console.log("Realtime order update:", payload);
            // Re-fetch orders to reflect realtime updates
            fetchOrders(debouncedSearchTerm);
          }
        )
        .subscribe();
    }
    setupRealtime();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [fetchOrders, debouncedSearchTerm]);

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
      case "READY_FOR_PICKUP":
      case "PICKUP_CONFIRMED":
        return "#818CF8";
      case "OUT_FOR_DELIVERY":
        return "#34D399";
      case "DELIVERED":
        return "#10B981";
      case "CANCELLED":
        return BrandColors.primary;
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
      case "READY_FOR_PICKUP":
      case "PICKUP_CONFIRMED":
        return "restaurant-outline";
      case "OUT_FOR_DELIVERY":
        return "bicycle-outline";
      case "DELIVERED":
        return "checkmark-done-circle-outline";
      case "CANCELLED":
        return "close-circle-outline";
      default:
        return "help-circle-outline";
    }
  };
  const formatStatus = (status: string) => {
    return t(`orders.statuses.${status.toLowerCase()}.label` as any);
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
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
      activeOpacity={0.7}
    >
      {/* Restaurant Header with Icon and Status */}
      <View style={styles.cardHeader}>
        <View style={styles.restaurantIconContainer}>
          {(item.restaurant?.coverImage && item.restaurant.coverImage.trim() !== "") || (item.orderItems?.[0]?.menuItem?.image) ? (
            <Image
              source={{ uri: item.restaurant?.coverImage && item.restaurant.coverImage.trim() !== "" ? item.restaurant.coverImage : item.orderItems[0].menuItem?.image || "" }}
              style={{ width: "100%", height: "100%", borderRadius: 8 }}
              resizeMode="cover"
              onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
            />
          ) : (
            <Ionicons name="restaurant" size={24} color="#fff" />
          )}
        </View>
        <View style={styles.headerContent}>
          <View style={styles.restaurantRow}>
            <Text style={styles.restaurantName} numberOfLines={1} ellipsizeMode="tail">
              {item.restaurant ? item.restaurant.name : t('orders.restaurant_fallback')}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: item.status === "PENDING"
                    ? "#FEF3C7"
                    : item.status === "OUT_FOR_DELIVERY"
                      ? "#DBEAFE"
                      : item.status === "DELIVERED"
                        ? "#D1FAE5"
                        : (item.status === "CONFIRMED" || item.status === "PREPARING" || item.status === "READY_FOR_PICKUP" || item.status === "PICKUP_CONFIRMED")
                          ? "#E0E7FF"
                          : "#FEE2E2"
                },
              ]}
            >
              <Text style={[
                styles.statusText,
                {
                  color: item.status === "PENDING"
                    ? "#92400E"
                    : item.status === "OUT_FOR_DELIVERY"
                      ? "#1E40AF"
                      : item.status === "DELIVERED"
                        ? "#065F46"
                        : (item.status === "CONFIRMED" || item.status === "PREPARING" || item.status === "READY_FOR_PICKUP" || item.status === "PICKUP_CONFIRMED")
                          ? "#3730A3"
                          : "#991B1B"
                }
              ]}>
                {formatStatus(item.status).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.orderMetaRow}>
            <Ionicons name="calendar-outline" size={14} color={BrandColors.primary} />
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.orderMetaRow}>
            <Ionicons name="location-outline" size={14} color={BrandColors.primary} />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.deliveryAddress}
            </Text>
          </View>
          <View style={styles.orderMetaRow}>
            <Ionicons name="cash-outline" size={14} color={BrandColors.primary} />
            <Text style={styles.paymentText}>{t('orders.payment_cod')}</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Order Items Section (Moved up) */}
      <View style={styles.orderItemsSection}>
        <Text style={styles.orderItemsTitle}>{t('orders.order_items')}</Text>
        {(item.orderItems || []).map((orderItem, index) => (
          <View key={`item-${orderItem.id || index}`} style={styles.orderItemContainer}>
            <View style={styles.orderItemRow}>
              <Text style={styles.orderItemName} numberOfLines={1} ellipsizeMode="tail">
                {orderItem.name}
              </Text>
              <Text style={styles.orderItemPrice}>
                {formatPrice(orderItem.price * orderItem.quantity, item.restaurant?.currency)}
              </Text>
            </View>
            <Text style={styles.orderItemQuantity}>
              {t('orders.quantity')}: {orderItem.quantity} x {formatPrice(orderItem.price, item.restaurant?.currency)}
            </Text>
            {/* Debugging Log to check data structure */}
            {/* {console.log(`Order ${item.id} Item ${index}:`, orderItem)} */}
          </View>
        ))}
      </View>

      {/* Total Amount (Moved down) */}
      <View style={styles.totalAmountContainer}>
        <Text style={styles.totalAmount}>{formatPrice(item.totalAmount, item.restaurant?.currency)}</Text>
        <Text style={styles.totalAmountLabel}>{t('orders.total_amount')}</Text>
        {item.restaurant?.deliveryCharges !== undefined && (
          <Text style={[styles.totalAmountLabel, { fontSize: 11, marginTop: 2 }]}>
            {t('orders.incl_delivery', { price: formatPrice(item.restaurant.deliveryCharges, item.restaurant.currency) })}
          </Text>
        )}
      </View>

      {/* Reorder Button */}
      <TouchableOpacity
        style={styles.reorderButton}
        onPress={(e) => {
          e.stopPropagation();
          handleReorder(item);
        }}
      >
        <Ionicons name="refresh-outline" size={16} color={BrandColors.primary} />
        <Text style={styles.reorderButtonText}>{t('orders.reorder_items')}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // ----------------------
  // (Optional) Animated header height interpolation
  // ----------------------
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [160, 130],
    extrapolate: "clamp",
  });

  // ----------------------
  // Render
  // ----------------------
  if (loading) {
    return (
      <Preloader fullScreen={true} />
    );
  }


  return (
    <View style={styles.container}>
      {/* Header with gradient and blur matching the SearchScreen */}
      <Animated.View style={[styles.header, { height: 160, paddingTop: insets.top }]}>
        <LinearGradient
          colors={[BrandColors.primary, BrandColors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <Text style={styles.title}>{t('orders.title')}</Text>
        <SearchBar searchQuery={searchQuery} onChangeText={setSearchQuery} />
      </Animated.View>

      {/* Orders list */}
      <Animated.FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContainer, { paddingBottom: 60 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BrandColors.primary]}
            tintColor={BrandColors.primary}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>{t('orders.no_orders')}</Text>
            <TouchableOpacity
              style={styles.browseButton}
              activeOpacity={1}
              onPress={() => navigation.navigate("Restaurants")}
            >
              <Text style={styles.browseButtonText}>{t('orders.browse_restaurants')}</Text>
            </TouchableOpacity>
          </View>
        }

        ListHeaderComponent={
          <View style={styles.loadingContainer}>
            {isSearching && !refreshing && (
              <ActivityIndicator size="small" color={BrandColors.primary} />
            )}
          </View>
        }
      />
    </View>
  );
}

// ----------------------
// Styles
// ----------------------

export default OrdersScreen;

