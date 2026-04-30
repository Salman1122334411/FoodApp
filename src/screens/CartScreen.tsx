import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { styles } from "./CartScreen.styles";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCart, calculateItemSubtotal } from "../hooks/useCart";
import { formatPrice } from "../utils/currency";
import { useTranslation } from "react-i18next";
import { Colors as BrandColors } from "../constants/Colors";
import { useSettings } from "../hooks/useSettings";
import { getRestaurantById } from "../lib/supabase";
import { getDistance } from "../utils/geo";
import { CustomConfirmModal } from "../components/CustomConfirmModal";
import { useAddress } from "../hooks/useAddress";

export const CartScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { deliveryRadius } = useSettings();
  const { cartItems, removeFromCart, clearCart } = useCart();
  const { selectedAddress, fetchAddresses } = useAddress();

  const [loading, setLoading] = useState(false);
  const [expandedRestId, setExpandedRestId] = useState<string | null>(null);
  const [restaurantDeliveryTimes, setRestaurantDeliveryTimes] = useState<Record<string, string>>({});
  const [isClearModalVisible, setIsClearModalVisible] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    const fetchDeliveryTimes = async () => {
      const times: Record<string, string> = {};
      const uniqueRestaurantIds = [...new Set(cartItems.map(i => i.restaurantId))];
      await Promise.all(uniqueRestaurantIds.map(async (id) => {
        try {
          const restaurantData = await getRestaurantById(id);
          if (restaurantData && restaurantData.deliveryTime) {
            times[id] = restaurantData.deliveryTime;
          }
        } catch (e) {
          console.error("Error fetching delivery time for", id, e);
        }
      }));
      setRestaurantDeliveryTimes(times);
    };

    if (cartItems.length > 0) {
      fetchDeliveryTimes();
    }
  }, [cartItems]);

  const groupedItems = cartItems.reduce((acc, item) => {
    if (!acc[item.restaurantId]) {
      acc[item.restaurantId] = {
        name: item.restaurantName,
        items: [],
        restaurantCurrency: item.restaurantCurrency,
      };
    }
    acc[item.restaurantId].items.push(item);
    return acc;
  }, {} as Record<string, { name: string; items: any[]; restaurantCurrency: string }>);

  const handleCheckout = async (restaurantId: string) => {
    try {
      setLoading(true);
      
      if (!selectedAddress) {
        Alert.alert(t('common.error'), t('cart.no_address_message'));
        return;
      }

      const restaurantData = await getRestaurantById(restaurantId);
      if (!restaurantData) throw new Error("Failed to fetch restaurant data");

      if (!restaurantData.latitude || !restaurantData.longitude) {
        Alert.alert(t('common.error'), t('cart.location_missing'));
        return;
      }

      let distance = 0;
      if (selectedAddress.latitude && selectedAddress.longitude) {
        distance = getDistance(
          selectedAddress.latitude,
          selectedAddress.longitude,
          restaurantData.latitude,
          restaurantData.longitude
        );
      }

      const maxRadius = deliveryRadius > 0 ? deliveryRadius : 10;
      if (distance > maxRadius) {
        Alert.alert(
          t('cart.out_of_range_title'),
          t('cart.out_of_range_message', { distance: distance.toFixed(1), maxRadius })
        );
        return;
      }

      navigation.navigate("CheckoutScreen", {
        deliveryAddress: selectedAddress,
        restaurantId: restaurantId,
      });
    } catch (error) {
      console.error("Checkout prep error:", error);
      Alert.alert(t('common.error'), t('cart.checkout_error'));
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.emptyCartContainer}>
            <Ionicons name="cart-outline" size={100} color="#E5E7EB" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyCartText}>{t('cart.empty', 'Your cart is empty.')}</Text>
          </View>

          <View style={styles.promoCard}>
            <View style={styles.promoIconContainer}>
              <Ionicons name="restaurant" size={32} color="#FF5221" />
            </View>
            <Text style={styles.promoTitle}>{t('cart.hungry_for_more', 'Hungry for more?')}</Text>
            <Text style={styles.promoSubtitle}>
              {t('cart.explore_new_flavors', 'Explore new flavors from top-rated restaurants near you.')}
            </Text>
            <TouchableOpacity style={styles.promoButton} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.promoButtonText}>{t('cart.start_new_cart', 'Start a New Cart')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.subHeader}>
        <Text style={styles.activeOrdersLabel}>{t('cart.active_orders', 'Active Orders')}</Text>
        <View style={styles.headerTopRow}>
          <Text style={styles.activeOrdersCount}>
            {t('cart.active_orders_count', { count: Object.keys(groupedItems).length })}
          </Text>
          <TouchableOpacity onPress={() => setIsClearModalVisible(true)} style={styles.clearCartButton}>
            <Text style={styles.clearCartText}>{t('common.clear', 'Clear')}</Text>
            <Ionicons name="trash-outline" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollViewContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(groupedItems).map(([restaurantId, group]) => {
          const { name, items } = group;
          const isExpanded = expandedRestId === restaurantId;
          const subtotal = items.reduce((sum, item) => 
            sum + calculateItemSubtotal(item.price, item.quantity, item.selectedOptions), 0
          );

          return (
            <View key={restaurantId} style={styles.summaryCard}>
              <View style={styles.cardTopRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.badgePill}>
                    <Text style={styles.badgeText}>{t('cart.hot_and_fresh', 'HOT & FRESH')}</Text>
                  </View>
                  <Text style={styles.restaurantName} numberOfLines={1}>{name}</Text>
                  <Text style={styles.itemCountText}>
                    {t('cart.items_waiting_count', { count: items.length })}
                  </Text>
                </View>
                
                <View style={styles.subtotalContainer}>
                  <Text style={styles.subtotalValue}>
                    {formatPrice(subtotal, items[0].restaurantCurrency)}
                  </Text>
                  <Text style={styles.subtotalLabel}>{t('cart.subtotal', 'Subtotal')}</Text>
                  {restaurantDeliveryTimes[restaurantId] && (
                    <View style={styles.deliveryTimeContainer}>
                      <Ionicons name="time-outline" size={16} color="#6B7280" />
                      <Text style={styles.deliveryTimeTextInline}>
                        {restaurantDeliveryTimes[restaurantId]} {t('common.min', 'min')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.itemPreviewList}>
                {items.slice(0, 4).map((item, idx) => (
                  <Image key={idx} source={{ uri: item.image }} style={styles.itemPreviewImage} />
                ))}
              </View>

              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => handleCheckout(restaurantId)}
                activeOpacity={0.9}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.primaryButtonText}>{t('cart.continue_to_checkout', 'Continue to Checkout')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => setExpandedRestId(isExpanded ? null : restaurantId)}
                activeOpacity={0.8}
              >
                <View style={styles.secondaryButtonContent}>
                  <Text style={styles.secondaryButtonText}>
                    {isExpanded ? t('cart.hide_details', 'Hide Details') : t('cart.view_details', 'View Details')}
                  </Text>
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-forward"} size={20} color="#111827" />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.detailsContainer}>
                  {items.map((item, idx) => (
                    <View key={idx} style={styles.detailItem}>
                      <Text style={styles.detailItemName}>
                        {item.quantity}x {item.name}
                      </Text>
                      <Text style={styles.detailItemPrice}>
                        {formatPrice(calculateItemSubtotal(item.price, item.quantity, item.selectedOptions), item.restaurantCurrency)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <CustomConfirmModal
        isVisible={isClearModalVisible}
        title={t('cart.clear_cart_confirm_title', 'Clear Cart?')}
        message={t('cart.clear_cart_confirm_message', 'Are you sure you want to remove all items from your cart?')}
        onConfirm={() => {
          clearCart();
          setIsClearModalVisible(false);
        }}
        onCancel={() => setIsClearModalVisible(false)}
        confirmText={t('common.clear', 'Clear')}
        confirmColor="#FF5221"
      />
    </SafeAreaView>
  );
};
