import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Keyboard,
  ImageBackground,
} from "react-native";
import { styles } from "./HomeScreen.styles";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase, searchRestaurants, searchMenuItems } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { HomeScreenSkeleton } from "../../components/skeleton";
import { useLocation } from "../hooks/useLocation";
import SaveLocationModal from "./SaveLocationModal";
import { getDistance } from "../utils/geo";
import ProfileSetupModal from "./ProfileSetupModal";
import { formatPrice } from "../utils/currency";
import { useDebounce } from "../hooks/useDebounce";
import { useSettings } from "../hooks/useSettings";
import { useTranslation } from "react-i18next";
import Preloader from "../components/Preloader";
import { useCart, getCartItemKey } from "../hooks/useCart";
import { useAuth } from "../contexts/AuthContext";
import QuantitySelector from "../components/QuantitySelector";
import ProductDetailModal from "../components/ProductDetailModal";
import { Colors as BrandColors } from "../constants/Colors";
import { getRestaurantsFromAPI } from "../lib/api";
import { ShopByCategory } from "../components/ShopByCategory";


interface MenuItem {
  id: string;
  label: string;
  price: number;
  image: string;
  restaurantId: string;
  Restaurant?: any;
  rating?: number;
}

export function HomeScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
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
  const insets = useSafeAreaInsets();
  const { deliveryRadius } = useSettings();
  const { cartItems, addToCart, removeFromCart, findLatestItemByProductId } = useCart();

  // Inline search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [searchRestaurantsResults, setSearchRestaurantsResults] = useState<any[]>([]);
  const [searchMenuResults, setSearchMenuResults] = useState<any[]>([]);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStoreType, setSelectedStoreType] = useState<string | null>(null); // null means "All"
  const searchInputRef = useRef<TextInput>(null);
  const showDropdown = searchQuery.trim().length > 0;

  const OFFERS = [
    {
      id: "1",
      title: t('home.offer_first_order_title'),
      description: t('home.offer_first_order_desc'),
      colors: [BrandColors.primary, BrandColors.secondary] as const,
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning');
    if (hour < 17) return t('greeting.afternoon');
    return t('greeting.evening');
  };

  useEffect(() => {
    // Only fetch location automatically if we don't have any location data yet
    if (!coords && !defaultAddressCoords) {
      fetchLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        supabase
          .from("User")
          .select("*")
          .eq("id", user.id)
          .single()
          .then(({ data, error }) => {
            if (error || !data) {
              setShowProfileModal(true);
            } else {
              setShowProfileModal(false);
            }
          });
      }
    }, [user])
  );

  useEffect(() => {
    if (!user) return;
    const userSubscription = supabase
      .channel("user-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "User",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setUserName(payload.new.name);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userSubscription);
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id);
      fetchDefaultAddress(user.id);
    }
    fetchRestaurants();
  }, [user]);

  const effectiveCoords = useMemo(() => coords || defaultAddressCoords, [coords, defaultAddressCoords]);

  // Inline search
  useEffect(() => {
    let active = true;
    const fetchResults = async () => {
      if (debouncedSearch.trim().length >= 1) {
        setSearchLoading(true);
        try {
          if (effectiveCoords) {
            const [restaurantResults, menuItemResults] = await Promise.all([
              searchRestaurants(debouncedSearch, effectiveCoords.latitude, effectiveCoords.longitude, deliveryRadius || 10),
              searchMenuItems(debouncedSearch, effectiveCoords.latitude, effectiveCoords.longitude, deliveryRadius || 10),
            ]);
            if (active) {
              setSearchRestaurantsResults(restaurantResults);
              setSearchMenuResults(menuItemResults);
            }
          } else {
            if (active) {
              setSearchRestaurantsResults([]);
              setSearchMenuResults([]);
            }
          }
        } catch (error) {
          console.error(error);
        } finally {
          if (active) setSearchLoading(false);
        }
      } else {
        if (active) {
          setSearchRestaurantsResults([]);
          setSearchMenuResults([]);
        }
      }
    };
    fetchResults();
    return () => { active = false; };
  }, [debouncedSearch, effectiveCoords?.latitude, effectiveCoords?.longitude, deliveryRadius]);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("User")
      .select("name")
      .eq("id", userId)
      .maybeSingle();

    if (error) console.error("Error fetching user:", error.message);
    else setUserName(data?.name || "");
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

  const handleModalAddToCart = (menuItem: any, quantity: number, selectedOptions: any[]) => {
    // Treat every configuration (ID + Options) as a unique line item.
    // If it already exists with identical options, useCart will increment quantity automatically.
    
    // We already have restaurant details from the product object in popular dishes.
    const restaurant = menuItem.Restaurant || { 
      id: menuItem.restaurantId,
      name: menuItem.restaurantName || t('orders.restaurant_fallback'),
      currency: menuItem.restaurantCurrency || t('common.currency_default'),
      deliveryCharges: menuItem.Restaurant?.deliveryCharges || Number(t('common.delivery_fee_default'))
    };

    addToCart({
      id: menuItem.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantCurrency: restaurant.currency,
      name: menuItem.label || menuItem.name,
      price: menuItem.price,
      quantity: quantity,
      image: menuItem.image,
      deliveryCharges: restaurant.deliveryCharges,
      selectedOptions: selectedOptions
    });

    setIsProductModalVisible(false);
    
    // Optional: Auto-navigate to Cart to show the addition clearly
    setTimeout(() => {
      navigation.navigate("Cart");
    }, 350);
  };

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Fetching restaurants via Web API...");
      const data = await getRestaurantsFromAPI();
      console.log("Restaurants fetched successfully from Web API. Count:", data?.length || 0);
      setRestaurants(data || []);
    } catch (error: any) {
      console.error("Error fetching restaurants from Web API:", error.message);
      
      // Fallback: If Web API fails, try direct Supabase with more logging
      console.log("Attempting fallback to direct Supabase...");
      const { data: fallbackData, error: fallbackError } = await supabase
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
          deliveryCharges,
          currency,
          menuItems: MenuItem (*)
        `)
        .order("rating", { ascending: false });

      if (fallbackError) {
        console.error("Direct Supabase fallback also failed:", fallbackError.message);
      } else {
        console.log("Direct Supabase fallback succeeded. Count:", fallbackData?.length || 0);
        setRestaurants(fallbackData || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const restaurantSubscription = supabase
      .channel("restaurants")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Restaurant" },
        () => { fetchRestaurants(); }
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
    const radiusValue = deliveryRadius || 50;
    const radius = typeof radiusValue === 'string' ? parseFloat(radiusValue) : radiusValue;
    
    if (restaurants.length > 0) {
      let filtered = restaurants;

      // 1. Filter by Store Type (Multi-Vertical Category)
      if (selectedStoreType) {
        filtered = filtered.filter(item => item.storeType === selectedStoreType);
      }

      // 2. Filter by Distance
      let nearby = [];
      if (effectiveCoords) {
        nearby = filtered.filter((restaurant) => {
          if (!restaurant.latitude || !restaurant.longitude) return false;
          try {
            const distance = getDistance(
              effectiveCoords.latitude,
              effectiveCoords.longitude,
              restaurant.latitude,
              restaurant.longitude
            );
            return distance <= radius;
          } catch (error) {
            return false;
          }
        });
      }

      // 3. Final List Selection
      if (nearby.length === 0) {
        // Fallback: If no nearby found for CATEGORY, show top from that category (or top from All if no category)
        setNearbyRestaurants(filtered.slice(0, 10));
      } else {
        setNearbyRestaurants(nearby);
      }
    } else {
      setNearbyRestaurants([]);
    }
  }, [coords, defaultAddressCoords, restaurants, deliveryRadius, selectedStoreType]);

  useEffect(() => {
    if (nearbyRestaurants.length === 0) {
      setPopularMenuItems([]);
      setPopularLoading(false);
      return;
    }


    setPopularLoading(true);

    // Flatten all menu items from nearby restaurants and sort by restaurant rating
    const allItems: MenuItem[] = nearbyRestaurants.flatMap((restaurant: any) => {
      // Try both common property names from the API and direct Prisma mappings
      const items = restaurant.menuItems || restaurant.MenuItem || restaurant.items || [];
      return items.map((item: any) => ({
        ...item,
        Restaurant: restaurant,
        rating: restaurant.rating // Map restaurant rating to item rating for sorting
      }));
    });



    // Relax the filter significantly to ensure SOMETHING appears
    const popular = allItems
      .filter((item: any) => item && (item.id || item.label))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10);


    setPopularMenuItems(popular);
    setPopularLoading(false);
  }, [nearbyRestaurants]);

  if (loading) {
    return <Preloader fullScreen={true} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Modal visible={showProfileModal} animationType="slide">
        <ProfileSetupModal
          onProfileSetupSuccess={() => {
            setShowProfileModal(false);
            if (user) {
              fetchUserProfile(user.id);
            }
          }}
        />
      </Modal>
      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[BrandColors.primary]}
            tintColor={BrandColors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        stickyHeaderIndices={[1]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header (Non-sticky) */}
        <View style={[styles.topHeader, { paddingTop: 20 }]}>
          {/* Row 1: Greeting + Avatar */}
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.greetingText}>{getGreeting()} 👋</Text>
              <Text style={styles.greetingName}>{userName || ""}</Text>
            </View>
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={() => (navigation as any).navigate("Profile")}
              activeOpacity={0.8}
            >
              <Text style={styles.avatarText}>
                {(userName || "").charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Location pill */}
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="location" size={18} color={BrandColors.primary} />
            <Text style={styles.deliveryAddress} numberOfLines={1}>{currentLocation}</Text>
            <Ionicons name="chevron-down" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Sticky Search Bar Container - Inline Search */}
        <View style={styles.stickySearchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder={t('home.search_placeholder')}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              underlineColorAndroid="transparent"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Inline Search Dropdown */}
          {showDropdown && (
            <View style={styles.searchDropdown}>
              {searchLoading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator color={BrandColors.primary} />
                </View>
              ) : (
                <ScrollView 
                  keyboardShouldPersistTaps="handled" 
                  style={{ maxHeight: 400 }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Store Results */}
                  {searchRestaurantsResults.length > 0 && (
                    <View style={styles.searchSection}>
                      <Text style={styles.searchSectionLabel}>{t('search.restaurants')}</Text>
                      {searchRestaurantsResults.map((store) => (
                        <TouchableOpacity
                          key={store.id}
                          style={styles.searchResultRow}
                          onPress={() => {
                            setSearchQuery('');
                            navigation.navigate('RestaurantDetails', { restaurant: store });
                          }}
                        >
                          <Image source={{ uri: store.coverImage }} style={styles.searchResultImage} />
                          <View style={styles.searchResultInfo}>
                            <Text style={styles.searchResultName}>{store.name}</Text>
                            <Text style={styles.searchResultSub}>{store.cuisineType} • {store.area}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Product Results */}
                  {searchMenuResults.length > 0 && (
                    <View style={styles.searchSection}>
                      {searchRestaurantsResults.length > 0 && <View style={styles.searchDivider} />}
                      <Text style={styles.searchSectionLabel}>{t('search.menu_items')}</Text>
                      {searchMenuResults.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.searchResultRow}
                          onPress={() => {
                            setSearchQuery('');
                            setSelectedProduct(item);
                            setIsProductModalVisible(true);
                          }}
                        >
                          <Image source={{ uri: item.image }} style={styles.searchResultImage} />
                          <View style={styles.searchResultInfo}>
                            <Text style={styles.searchResultName}>{item.label}</Text>
                            <Text style={styles.searchResultSub}>{item.restaurantName} • {formatPrice(item.price, item.restaurantCurrency)}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {searchRestaurantsResults.length === 0 && searchMenuResults.length === 0 && (
                    <View style={styles.searchEmptyContainer}>
                      <Text style={styles.searchEmptyText}>{t('search.no_results')}</Text>
                    </View>
                  )}

                  <TouchableOpacity 
                    style={styles.searchViewAllButton}
                    onPress={() => {
                      const query = searchQuery;
                      setSearchQuery('');
                      navigation.navigate('Search', { initialQuery: query });
                    }}
                  >
                    <Text style={styles.searchViewAllText}>{t('search.view_all_results')}</Text>
                    <Ionicons name="arrow-forward" size={16} color={BrandColors.primary} />
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          )}
        </View>

        {/* Search Backdrop */}
        {showDropdown && (
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.searchBackdrop} 
            onPress={() => {
              setSearchQuery('');
              Keyboard.dismiss();
            }}
          />
        )}
        <ShopByCategory 
          selectedStoreType={selectedStoreType} 
          onSelectCategory={setSelectedStoreType} 
          hideCategories={true}
          onViewAll={() => navigation.navigate("Explore")}
        />
        {/* Offers Carousel */}
        <View style={styles.offersContainer}>
          {OFFERS.map((offer) => (
            <LinearGradient
              key={offer.id}
              colors={offer.colors as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.offerCard}
            >
              <ImageBackground
                source={{ uri: "https://www.transparenttextures.com/patterns/food.png" }}
                style={StyleSheet.absoluteFill}
                imageStyle={{ opacity: 0.1, tintColor: "#fff" }}
              />

              <View style={styles.offerContent}>
                <View style={styles.badgeContainer}>
                  <View style={styles.badge}>
                    <Ionicons name="time" size={14} color="#FBBF24" />
                    <Text style={styles.badgeText}>{t('home.limited_time')}</Text>
                  </View>
                </View>

                <Text style={styles.offerTitle} numberOfLines={2} ellipsizeMode="tail">{offer.title}</Text>
                <Text style={styles.offerDescription} numberOfLines={2} ellipsizeMode="tail">{offer.description}</Text>

                <TouchableOpacity
                  style={styles.orderNowButton}
                  onPress={() => (navigation as any).navigate("Restaurants")}
                  activeOpacity={0.9}
                >
                  <Text style={styles.orderNowText}>{t('home.order_now')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.offerImageWrapper}>
                <Image
                  source={{ uri: offer.image }}
                  style={styles.offerImage}
                  resizeMode="contain"
                />
              </View>
            </LinearGradient>
          ))}
        </View>

        {/* Popular Dishes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
                {t('home.popular_dishes')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => (navigation as any).navigate("Restaurants")} activeOpacity={1}>
              <Text style={styles.seeAllButton}>{t('home.see_all')}</Text>
            </TouchableOpacity>
          </View>
          {popularLoading ? (
            <ActivityIndicator
              size="small"
              color={BrandColors.primary}
              style={{ marginTop: 10 }}
            />
          ) : popularMenuItems.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginRight: 20 }}
                contentContainerStyle={[
                  styles.popularDishes,
                  { flexDirection: i18n.dir() === 'rtl' ? 'row-reverse' : 'row' }
                ]}
              >
              {popularMenuItems
                .filter((dish) => dish && dish.Restaurant)
                .map((dish) => (
                  <TouchableOpacity
                    key={dish.id}
                    style={styles.modernDishCard}
                    onPress={() => {
                      setSelectedProduct(dish);
                      setIsProductModalVisible(true);
                    }}
                    activeOpacity={0.9}
                  >
                    <View style={styles.dishImageBg}>
                        <Image
                          source={{ uri: dish.image || '' }}
                          style={styles.dishImage}
                          resizeMode="contain"
                          defaultSource={require('../../assets/placeholder.png')}
                        />
                        <QuantitySelector
                          initialQuantity={cartItems.filter(item => item.id === dish.id).reduce((sum, item) => sum + item.quantity, 0)}
                          onUpdate={(newQty) => {
                            const totalQty = cartItems.filter(item => item.id === dish.id).reduce((sum, item) => sum + item.quantity, 0);
                            const hasAddons = (dish as any).addonGroups && (dish as any).addonGroups.length > 0;
                            
                            if (newQty > totalQty) {
                              // Force modal for items with addons, otherwise use standard addition
                              if (hasAddons) {
                                setSelectedProduct(dish);
                                setIsProductModalVisible(true);
                                return;
                              }
                              addToCart({
                                id: dish.id,
                                restaurantId: dish.restaurantId,
                                restaurantName: dish.Restaurant?.name || '',
                                restaurantCurrency: dish.Restaurant?.currency,
                                name: dish.label,
                                price: dish.price,
                                quantity: 1,
                                image: dish.image,
                                deliveryCharges: dish.Restaurant?.deliveryCharges ?? dish.Restaurant?.deliveryTimeCharges ?? Number(t('common.delivery_fee_default')),
                              });
                            } else if (newQty < totalQty) {
                              // If there are multiple configurations, decrementing in the home screen
                              // could be ambiguous, so for now we just find a match (any) and decrement.
                              removeFromCart(dish.id);
                            }
                          }}
                          containerStyle={styles.dishQuantitySelector}
                          size="small"
                        />
                      </View>
                    <View style={styles.dishCardInfo}>
                      <Text style={styles.dishName} numberOfLines={1}>{dish.label || t('home.unknown_dish')}</Text>
                      <View style={styles.dishMeta}>
                        <Text style={styles.dishPrice}>
                          {formatPrice(dish.price || 0, dish.Restaurant?.currency)}
                        </Text>
                        <View style={styles.dishRatingBadge}>
                          <Ionicons name="star" size={12} color="#F59E0B" />
                          <Text style={styles.dishRatingText}>5.0</Text>
                        </View>
                      </View>
                      <Text style={styles.dishRestaurantName} numberOfLines={1}>
                        {t('home.by')} {dish.Restaurant?.name || t('orders.restaurant_fallback')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          ) : (
            <Text style={styles.noDataText}>
              {t('home.no_popular_dishes')}
            </Text>
          )}
        </View>

        {/* Nearby Restaurants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
                {t('home.nearby_restaurants')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Restaurants")} activeOpacity={1}>
              <Text style={styles.seeAllButton}>{t('home.see_all')}</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={BrandColors.primary} />
          ) : nearbyRestaurants.length > 0 ? (
            nearbyRestaurants
              .filter((restaurant) => restaurant && restaurant.id)
              .map((restaurant) => (
                <TouchableOpacity
                  key={restaurant.id}
                  style={styles.restaurantCard}
                  onPress={() =>
                    (navigation as any).navigate("RestaurantDetails", { restaurant })
                  }
                  activeOpacity={1}
                >
                  <Image
                    source={{ uri: restaurant.coverImage || '' }}
                    style={styles.restaurantImage}
                    defaultSource={require('../../assets/placeholder.png')}
                  />
                  <View style={styles.restaurantInfo}>
                    <View style={styles.restaurantHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.restaurantName} numberOfLines={1} ellipsizeMode="tail">
                          {restaurant.name}
                        </Text>
                        <Text style={styles.restaurantCuisine} numberOfLines={1} ellipsizeMode="tail">
                          {restaurant.cuisineType} • {restaurant.segment}
                        </Text>
                      </View>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color="#F59E0B" />
                        <Text style={styles.ratingText}>
                          {restaurant.rating}
                        </Text>
                      </View>
                    </View>
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#6B7280"
                        />
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
            <Text style={styles.noDataText}>
              {t('home.no_nearby_restaurants')}
            </Text>
          )}
        </View>
      </ScrollView>


      <SaveLocationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddressAdded={() => {
          if (user?.id) {
            fetchDefaultAddress(user.id);
          }
        }}
      />

      <ProductDetailModal
        isVisible={isProductModalVisible}
        onClose={() => setIsProductModalVisible(false)}
        product={selectedProduct}
        restaurant={selectedProduct?.Restaurant || { 
          id: selectedProduct?.restaurantId,
          name: selectedProduct?.restaurantName,
          currency: selectedProduct?.restaurantCurrency || t('common.currency_default'),
          deliveryTime: t('common.delivery_time_range_default'),
          deliveryCharges: Number(t('common.delivery_fee_default'))
        }}
        onAddToCart={handleModalAddToCart}
        initialQuantity={findLatestItemByProductId(selectedProduct?.id)?.quantity || 0}
        initialSelectedOptions={findLatestItemByProductId(selectedProduct?.id)?.selectedOptions || []}
      />
    </SafeAreaView>
  );
}


