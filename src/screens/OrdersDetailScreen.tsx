import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  ActivityIndicator,
} from "react-native";
import { styles } from "./OrdersDetailScreen.styles";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useTranslation } from "react-i18next";
import { formatPrice } from "../utils/currency";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getOrderById, getRestaurantByIdFromAPI } from "../lib/api";
import { LinearGradient } from "expo-linear-gradient";
import { Colors as BrandColors } from "../constants/Colors";
import { sendLocalNotification } from "../lib/notifications";
import { useRef } from "react";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  options?: string; // JSON string of AddonOption[]
}

interface RestaurantDetails {
  id: string;
  name: string;
  currency?: string;
  coverImage?: string;
  cuisineType?: string;
  rating?: number;
  latitude?: number;
  longitude?: number;
  deliveryTime?: string;
  preparationTime?: number;
  deliveryCharges?: number;
  taxRate?: number;
  isTaxIncluded?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PREPARING"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED";
  totalAmount: number;
  deliveryAddress: string;
  driverId: string | null;
  assignedDriver: string | null;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  estimatedTime: number | null;
  actualTime: number | null;
  driverRating: number | null;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderItem[];
  restaurant?: RestaurantDetails;
  posOrder?: {
    discountAmount: number;
    taxAmount: number;
    serviceCharge: number;
  };
}

type RootStackParamList = {
  OrderDetails: { order: Order };
};

type Props = NativeStackScreenProps<RootStackParamList, "OrderDetails">;

export function OrderDetailsScreen({ route, navigation }: Props) {
  const { order } = route.params;
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const [currentOrder, setCurrentOrder] = useState<Order>(() => ({
    ...order,
    restaurant: order.restaurant || { id: "", name: t('orders.restaurant_fallback') },
    orderItems: order.orderItems || [],
  }));

  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails | null>(null);

  // Calculate Arrival Time
  const arrivalTimeString = useMemo(() => {
    const createdAtDate = new Date(currentOrder.createdAt);
    const estimatedMinutes = currentOrder.estimatedTime || 30;
    const arrivalDate = new Date(createdAtDate.getTime() + estimatedMinutes * 60000);
    
    return arrivalDate.toLocaleTimeString(i18n.language, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, [currentOrder.createdAt, currentOrder.estimatedTime, i18n.language]);

  // Status mapping for the vertical timeline
  const trackingSteps = [
    { 
      status: "PENDING", 
      title: t('orders.statuses.pending.label'), 
      desc: t('orders.statuses.pending.bottom_subtitle'),
      icon: "checkmark-circle" 
    },
    { 
      status: "CONFIRMED", 
      title: t('orders.statuses.confirmed.label'), 
      desc: t('orders.statuses.confirmed.bottom_subtitle'),
      icon: "thumbs-up" 
    },
    { 
      status: "PREPARING", 
      title: t('orders.statuses.preparing.label'), 
      desc: t('orders.statuses.preparing.bottom_subtitle'),
      icon: "restaurant" 
    },
    { 
      status: "OUT_FOR_DELIVERY", 
      title: t('orders.statuses.out_for_delivery.label'), 
      desc: t('orders.statuses.out_for_delivery.bottom_subtitle'),
      icon: "bicycle" 
    },
    { 
      status: "DELIVERED", 
      title: t('orders.statuses.delivered.label'), 
      desc: t('orders.statuses.delivered.bottom_subtitle'),
      icon: "home" 
    },
  ];

  const currentStepIndex = trackingSteps.findIndex(
    (step) => step.status === currentOrder.status
  );

  const getStatusIllustration = (status: Order["status"]) => {
    switch (status) {
      case "PENDING": return "receipt-outline";
      case "CONFIRMED": return "checkmark-circle-outline";
      case "PREPARING": return "restaurant-outline";
      case "OUT_FOR_DELIVERY": return "bicycle-outline";
      case "DELIVERED": return "home-outline";
      case "CANCELLED": return "close-circle-outline";
      default: return "help-circle-outline";
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderData, restData] = await Promise.all([
        getOrderById(order.id),
        getRestaurantByIdFromAPI(currentOrder.restaurantId)
      ]);

      if (orderData) {
        setCurrentOrder(prev => ({
          ...prev,
          ...(orderData as any),
          orderItems: (orderData.orderItems as any) || prev.orderItems || [],
        }));
      }
      
      if (restData) {
        setRestaurantDetails(restData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [order.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`order-details-${order.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "Order", filter: `id=eq.${order.id}` },
        (payload) => {
          setCurrentOrder((prev) => ({
            ...prev,
            ...((payload.new as Order) || {}),
            orderItems: (payload.new as Order)?.orderItems || prev.orderItems || [],
          }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [order.id]);

  // Trigger notification on status change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (currentOrder?.status) {
      sendLocalNotification({
        title: t(`orders.statuses.${currentOrder.status.toLowerCase()}.header_title`, { defaultValue: 'Order Update' }),
        body: t(`orders.statuses.${currentOrder.status.toLowerCase()}.header_desc`, { defaultValue: 'Your order status has changed.' }),
      });
    }
  }, [currentOrder?.status]);

  const handleSupport = () => {
    Linking.openURL("tel:+1234567890");
  };

  if (loading && !currentOrder.id) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </View>
    );
  }

  const parsedAddress = (() => {
    try {
      const addr = JSON.parse(currentOrder.deliveryAddress);
      return {
        main: addr.street_address || addr.street || t('orders.details.no_address'),
        sub: `${addr.city}, ${addr.state} ${addr.zipCode || addr.postal_code || ''}`.trim()
      };
    } catch {
      return { main: currentOrder.deliveryAddress, sub: "" };
    }
  })();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Custom Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('orders.details.title')} #{currentOrder.id.slice(-5).toUpperCase()}</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Illustration Card */}
        <View style={styles.statusSummaryCard}>
          <View style={styles.statusIconCircle}>
            <Ionicons name={getStatusIllustration(currentOrder?.status || "PENDING") as any} size={48} color={BrandColors.primary} />
          </View>
          <Text style={styles.statusMainTitle}>{t(`orders.statuses.${(currentOrder?.status || "PENDING").toLowerCase()}.header_title` as any)}</Text>
          <Text style={styles.statusSubtitle}>{t(`orders.statuses.${(currentOrder?.status || "PENDING").toLowerCase()}.header_desc` as any)}</Text>
        </View>

        {/* Arrival Card */}
        <TouchableOpacity 
          activeOpacity={0.9} 
          style={styles.arrivalCard}
          onPress={() => setShowReceipt(!showReceipt)}
        >
          <LinearGradient
            colors={[BrandColors.primary, BrandColors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.arrivalGradient}
          >
            <Text style={styles.arrivalLabel}>{t('orders.details.estimated_delivery')}</Text>
            <Text style={styles.arrivalTime}>
              {restaurantDetails?.deliveryTime || currentOrder.estimatedTime || 30} {t('common.min')}
            </Text>
            <View style={styles.viewReceiptButton}>
              <Text style={styles.viewReceiptText}>{showReceipt ? t('orders.details.hide_details') : t('orders.details.view_order_details')}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Receipt Details (Collapsible) */}
        {showReceipt && (
          <View style={styles.receiptSection}>
            {(currentOrder.orderItems || []).map((item, idx) => (
              <View key={idx} style={styles.receiptItem}>
                <Text style={styles.receiptItemName}>{item.quantity}x {item.name}</Text>
                <Text style={styles.receiptItemPrice}>{formatPrice(item.price * item.quantity, currentOrder.restaurant?.currency)}</Text>
              </View>
            ))}
            
            <View style={styles.receiptDivider} />

            {/* Preparation Time */}
            {!!restaurantDetails?.preparationTime && (
              <View style={styles.receiptItem}>
                <Text style={styles.receiptItemName}>{t('orders.details.prep_time', { defaultValue: 'Preparation Time' })}</Text>
                <Text style={styles.receiptItemPrice}>{restaurantDetails.preparationTime} {t('common.min')}</Text>
              </View>
            )}

            {/* Delivery Fee */}
            <View style={styles.receiptItem}>
              <Text style={styles.receiptItemName}>{t('orders.details.delivery_fee', { defaultValue: 'Delivery Fee' })}</Text>
              <Text style={styles.receiptItemPrice}>
                {formatPrice(restaurantDetails?.deliveryCharges || 0, currentOrder.restaurant?.currency)}
              </Text>
            </View>

            {/* Tax */}
            {!!(currentOrder.posOrder?.taxAmount || (restaurantDetails?.taxRate && restaurantDetails.taxRate > 0)) && (
              <View style={styles.receiptItem}>
                <Text style={styles.receiptItemName}>
                  {t('orders.details.tax', { defaultValue: 'Tax' })}
                  {restaurantDetails?.isTaxIncluded ? ` (${t('orders.details.included', { defaultValue: 'Included' })})` : ''}
                </Text>
                <Text style={styles.receiptItemPrice}>
                  {formatPrice(currentOrder.posOrder?.taxAmount || 0, currentOrder.restaurant?.currency)}
                </Text>
              </View>
            )}

            {/* Discount */}
            {!!(currentOrder.posOrder?.discountAmount && currentOrder.posOrder.discountAmount > 0) && (
              <View style={styles.receiptItem}>
                <Text style={[styles.receiptItemName, { color: '#10B981' }]}>{t('orders.details.discount', { defaultValue: 'Discount' })}</Text>
                <Text style={[styles.receiptItemPrice, { color: '#10B981' }]}>
                  -{formatPrice(currentOrder.posOrder.discountAmount, currentOrder.restaurant?.currency)}
                </Text>
              </View>
            )}

            <View style={styles.receiptDivider} />
            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalLabel}>{t('orders.details.total_amount')}</Text>
              <Text style={styles.receiptTotalValue}>{formatPrice(currentOrder.totalAmount, currentOrder.restaurant?.currency)}</Text>
            </View>
          </View>
        )}

        {/* Restaurant Details */}
        <View style={styles.entityCard}>
          <Image 
            source={{ uri: restaurantDetails?.coverImage || 'https://via.placeholder.com/150' }} 
            style={styles.restaurantImage} 
          />
          <View style={styles.entityInfo}>
            <Text style={styles.entityName}>{currentOrder.restaurant?.name}</Text>
            <Text style={styles.entitySub}>{restaurantDetails?.cuisineType || t('orders.restaurant_fallback')} • {restaurantDetails?.rating || '5.0'} ★</Text>
          </View>
          <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL('tel:123')}>
            <Ionicons name="call" size={20} color={BrandColors.primary} />
          </TouchableOpacity>
        </View>

        {/* Delivery Address */}
        <View style={styles.entityCard}>
          <View style={styles.addressIconBox}>
            <Ionicons name="location" size={20} color="#D97706" />
          </View>
          <View style={styles.entityInfo}>
            <Text style={styles.entityLabel}>{t('orders.details.delivery_address')}</Text>
            <Text style={styles.entityName}>{parsedAddress.main}</Text>
            {parsedAddress.sub ? <Text style={styles.entitySub}>{parsedAddress.sub}</Text> : null}
          </View>
        </View>

        {/* Live Tracking Timeline */}
        <View style={styles.trackingCard}>
          <Text style={styles.trackingTitle}>{t('orders.statuses.out_for_delivery.bottom_subtitle').split('.')[0]}</Text>
          
          {trackingSteps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isLast = index === trackingSteps.length - 1;

            return (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineIconCircle,
                    isCompleted && styles.timelineIconCircleActive
                  ]}>
                    <Ionicons 
                      name={step.icon as any} 
                      size={18} 
                      color={isCompleted ? "#fff" : "#9CA3AF"} 
                    />
                  </View>
                  {!isLast && (
                    <View style={[
                      styles.timelineLine,
                      isCompleted && index < currentStepIndex && styles.timelineLineActive
                    ]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.timelineStatusName,
                    isCompleted && styles.timelineStatusNameActive
                  ]}>
                    {step.title}
                  </Text>
                  {isCurrent && (
                    <Text style={styles.timelineStatusDesc}>{step.desc}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.helpButton} onPress={handleSupport}>
            <Ionicons name="headset-outline" size={20} color="#1F2937" />
            <Text style={styles.helpButtonText}>{t('orders.details.contact_support')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

export default OrderDetailsScreen;