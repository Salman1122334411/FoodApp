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
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useCart } from "../hooks/useCart";
import { Colors as BrandColors } from "../constants/Colors";
import { getRestaurantsFromAPI } from "../lib/api";
import { ShopByCategory } from "../components/ShopByCategory";
import { formatPrice } from "../utils/currency";
import Preloader from "../components/Preloader";
import QuantitySelector from "../components/QuantitySelector";
import ProductDetailModal from "../components/ProductDetailModal";
import { styles } from "./HomeScreen.styles"; // Reusing HomeScreen styles for exact parity
import { useLocation } from "../hooks/useLocation";
import { getDistance } from "../utils/geo";
import { useSettings } from "../hooks/useSettings";

export function ExploreScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [popularMenuItems, setPopularMenuItems] = useState<any[]>([]);
  const [popularLoading, setPopularLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStoreType, setSelectedStoreType] = useState<string | null>(null);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { coords } = useLocation();
  const { deliveryRadius } = useSettings();
  const { cartItems, addToCart, removeFromCart } = useCart();
  const insets = useSafeAreaInsets();

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRestaurantsFromAPI();
      setRestaurants(data || []);
    } catch (error: any) {
      console.log("Attempting fallback to direct Supabase...");
      const { data: fallbackData } = await supabase
        .from("Restaurant")
        .select(`id, name, chainName, address, latitude, longitude, cuisineType, segment, city, area, rating, coverImage, deliveryTime, minimumOrder, deliveryCharges, currency, menuItems: MenuItem (*)`)
        .order("rating", { ascending: false });
        
      setRestaurants(fallbackData || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
    const sub = supabase.channel("restaurants").on("postgres_changes", { event: "*", schema: "public", table: "Restaurant" }, () => fetchRestaurants()).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchRestaurants]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRestaurants();
    setRefreshing(false);
  }, [fetchRestaurants]);

  useEffect(() => {
    const effectiveCoords = coords;
    const radius = typeof deliveryRadius === 'string' ? parseFloat(deliveryRadius) : (deliveryRadius || 50);
    
    if (restaurants.length > 0) {
      let filtered = restaurants;
      if (selectedStoreType) {
        filtered = filtered.filter(item => item.storeType === selectedStoreType);
      }
      
      let nearby = [];
      if (effectiveCoords) {
        nearby = filtered.filter((restaurant) => {
          if (!restaurant.latitude || !restaurant.longitude) return false;
          try {
            return getDistance(effectiveCoords.latitude, effectiveCoords.longitude, restaurant.latitude, restaurant.longitude) <= radius;
          } catch (error) {
            return false;
          }
        });
      }

      setNearbyRestaurants(nearby.length === 0 ? filtered.slice(0, 10) : nearby);
    } else {
      setNearbyRestaurants([]);
    }
  }, [coords, restaurants, deliveryRadius, selectedStoreType]);

  useEffect(() => {
    if (nearbyRestaurants.length === 0) {
      setPopularMenuItems([]);
      setPopularLoading(false);
      return;
    }
    setPopularLoading(true);
    const allItems = nearbyRestaurants.flatMap((restaurant: any) => {
      const items = restaurant.menuItems || restaurant.MenuItem || restaurant.items || [];
      return items.map((item: any) => ({ ...item, Restaurant: restaurant, rating: restaurant.rating }));
    });
    setPopularMenuItems(allItems.filter((item: any) => item && (item.id || item.label)).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10));
    setPopularLoading(false);
  }, [nearbyRestaurants]);

  const handleModalAddToCart = (menuItem: any, quantity: number) => {
    const existingQty = cartItems.find(i => i.id === menuItem.id)?.quantity || 0;
    if (quantity > existingQty) {
      for (let i = 0; i < (quantity - existingQty); i++) {
        const restaurant = menuItem.Restaurant || { id: menuItem.restaurantId, name: menuItem.restaurantName, currency: menuItem.restaurantCurrency || t('common.currency_default') };
        addToCart({
          id: menuItem.id, restaurantId: restaurant.id, restaurantName: restaurant.name || t('orders.restaurant_fallback'),
          restaurantCurrency: restaurant.currency, name: menuItem.label || menuItem.name, price: menuItem.price, quantity: 1,
          image: menuItem.image, deliveryCharges: restaurant.deliveryCharges || Number(t('common.delivery_fee_default')),
        });
      }
    } else if (quantity < existingQty) {
      for (let i = 0; i < (existingQty - quantity); i++) {
        removeFromCart(menuItem.id);
      }
    }
    setIsProductModalVisible(false);
    setTimeout(() => { navigation.navigate("Cart"); }, 300);
  };

  if (loading) return <Preloader fullScreen={true} />;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BrandColors.primary]} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        stickyHeaderIndices={[0]}
      >
        {/* Sticky Search Bar */}
        <View style={styles.stickySearchContainer}>
          <TouchableOpacity 
            style={styles.searchBar}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Search', params: { fromHome: true } })}
          >
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <Text style={[styles.searchInput, { color: '#9CA3AF' }]}>{t('home.search_placeholder')}</Text>
          </TouchableOpacity>
        </View>

        {/* Explore Categories */}
        <ShopByCategory 
          selectedStoreType={selectedStoreType} 
          onSelectCategory={setSelectedStoreType} 
          hideCategories={false}
          showViewAll={false}
        />

        {/* Popular Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle} numberOfLines={1}>{t('home.popular_dishes')}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Restaurants")}>
              <Text style={styles.seeAllButton}>{t('home.see_all')}</Text>
            </TouchableOpacity>
          </View>

          {popularLoading ? (
            <ActivityIndicator size="small" color={BrandColors.primary} style={{ marginTop: 10 }} />
          ) : popularMenuItems.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.popularDishes, { flexDirection: i18n.dir() === 'rtl' ? 'row-reverse' : 'row' }]}>
              {popularMenuItems.map((dish) => (
                  <TouchableOpacity key={dish.id} style={styles.modernDishCard} onPress={() => { setSelectedProduct(dish); setIsProductModalVisible(true); }}>
                    <View style={styles.dishImageBg}>
                        <Image source={{ uri: dish.image || '' }} style={styles.dishImage} resizeMode="contain" />
                        <QuantitySelector
                          initialQuantity={cartItems.find(item => item.id === dish.id)?.quantity || 0}
                          onUpdate={(newQty) => handleModalAddToCart(dish, newQty)}
                          containerStyle={styles.dishQuantitySelector}
                          size="small"
                        />
                      </View>
                    <View style={styles.dishCardInfo}>
                      <Text style={styles.dishName} numberOfLines={1}>{dish.label || t('home.unknown_dish')}</Text>
                      <View style={styles.dishMeta}>
                        <Text style={styles.dishPrice}>{formatPrice(dish.price || 0, dish.Restaurant?.currency)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          ) : (
            <Text style={styles.noDataText}>{t('home.no_popular_dishes')}</Text>
          )}
        </View>

        {/* Nearby Restaurants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle} numberOfLines={1}>{t('home.nearby_restaurants')}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Restaurants")}>
              <Text style={styles.seeAllButton}>{t('home.see_all')}</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color={BrandColors.primary} />
          ) : nearbyRestaurants.length > 0 ? (
            nearbyRestaurants.map((restaurant) => (
              <TouchableOpacity key={restaurant.id} style={styles.restaurantCard} onPress={() => navigation.navigate("RestaurantDetails", { restaurant })} activeOpacity={1}>
                <Image source={{ uri: restaurant.coverImage || '' }} style={styles.restaurantImage} defaultSource={require('../../assets/placeholder.png')} />
                <View style={styles.restaurantInfo}>
                  <View style={styles.restaurantHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.restaurantName} numberOfLines={1}>{restaurant.name}</Text>
                      <Text style={styles.restaurantCuisine} numberOfLines={1}>{restaurant.cuisineType} • {restaurant.segment}</Text>
                    </View>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.ratingText}>{restaurant.rating}</Text>
                    </View>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text style={styles.metaText}>
                      {t('restaurant.delivery_time')}: {restaurant.deliveryTime || t('common.delivery_time_range_default')} {t('common.min')}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="cash-outline" size={16} color="#6B7280" />
                    <Text style={styles.metaText}>
                      {t('restaurant.min_order')}: {formatPrice(restaurant.minimumOrder || 0, restaurant.currency)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
             <Text style={styles.noDataText}>{t('home.no_nearby_restaurants')}</Text>
          )}
        </View>
      </ScrollView>

      <ProductDetailModal
        isVisible={isProductModalVisible}
        onClose={() => setIsProductModalVisible(false)}
        product={selectedProduct}
        restaurant={selectedProduct?.Restaurant || { 
          id: selectedProduct?.restaurantId, name: selectedProduct?.restaurantName, currency: selectedProduct?.restaurantCurrency || t('common.currency_default'), deliveryTime: t('common.delivery_time_range_default'), deliveryCharges: Number(t('common.delivery_fee_default'))
        }}
        onAddToCart={handleModalAddToCart}
        initialQuantity={cartItems.find(i => i.id === selectedProduct?.id)?.quantity || 0}
      />
    </SafeAreaView>
  );
}
