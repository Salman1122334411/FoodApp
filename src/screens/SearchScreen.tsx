import { useState, useEffect, useRef, useMemo } from "react";
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
import { Colors as BrandColors } from "../constants/Colors";
import { styles } from "./SearchScreen.styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatPrice } from "../utils/currency";
import {
  searchRestaurants,
  searchMenuItems,
  getRestaurants,
  getRestaurantsByFilters,
} from "../lib/supabase";
import { useSettings } from "../hooks/useSettings";
import { useCart, getCartItemKey } from "../hooks/useCart";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { useLocation } from "../hooks/useLocation";
import { getDistance } from "../utils/geo";
import { supabase } from "../lib/supabase";
import { useDebounce } from "../hooks/useDebounce";
import { useTranslation } from "react-i18next";
import QuantitySelector from "../components/QuantitySelector";
import ProductDetailModal from "../components/ProductDetailModal";
import Preloader from "../components/Preloader";

const { width } = Dimensions.get("window");

export const SearchScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms debounce
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { cartItems, addToCart, removeFromCart, findLatestItemByProductId } = useCart();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const searchInputRef = useRef<TextInput>(null);

  // Auto-focus search input when navigated from HomeScreen
  useEffect(() => {
    if (route?.params?.fromHome) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 350);
      navigation.setParams({ fromHome: undefined });
    }
  }, [route?.params?.fromHome]);

  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);
  const [cuisineTypesLoading, setCuisineTypesLoading] = useState(false);
  const [cuisineItemsMap, setCuisineItemsMap] = useState<{ [key: string]: any[] }>({});
  const [cuisineLoading, setCuisineLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const [popularProductsLoading, setPopularProductsLoading] = useState(false);

  const scrollY = new Animated.Value(0);

  // --- Location & Default Address State ---
  const { currentLocation, fetchLocation, coords } = useLocation();
  const { deliveryRadius } = useSettings();
  const [defaultAddressCoords, setDefaultAddressCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const effectiveCoords = useMemo(() => coords || defaultAddressCoords, [coords, defaultAddressCoords]);
  //---------------------------------------------

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        fetchDefaultAddress(data.session.user.id);
      }
    });
  }, []);

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

  const addToRecentSearches = (term: string) => {
    if (term.trim()) {
      setRecentSearches((prev) => {
        const updatedSearches = [term, ...prev.filter((item) => item !== term)];
        return updatedSearches.slice(0, 5);
      });
    }
  };


  const handleModalAddToCart = (menuItem: any, quantity: number, selectedOptions: any[]) => {
    // We already have restaurant details from the product object in Search.
    const restaurant = menuItem.Restaurant || { 
      id: menuItem.restaurantId,
      name: menuItem.restaurantName || t('restaurant.restaurant_fallback'),
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

    setIsModalVisible(false);
    // Removed auto-navigation to Cart as per user request to stay on the page
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
      if (debouncedSearchQuery.trim().length >= 1) {
        setLoading(true);
        try {
          if (effectiveCoords) {
            const effectiveRadius = deliveryRadius || 50;
            const [restaurantResults, menuItemResults] = await Promise.all([
              searchRestaurants(
                debouncedSearchQuery,
                effectiveCoords.latitude,
                effectiveCoords.longitude,
                effectiveRadius
              ),
              searchMenuItems(
                debouncedSearchQuery,
                effectiveCoords.latitude,
                effectiveCoords.longitude,
                effectiveRadius
              ),
            ]);
            if (isActive) {
              setRestaurants(restaurantResults);
              setMenuItems(menuItemResults);
            }
          } else {
            // No coordinates yet — search without location filter
            const [restaurantResults, menuItemResults] = await Promise.all([
              searchRestaurants(debouncedSearchQuery, 0, 0, 99999),
              searchMenuItems(debouncedSearchQuery, 0, 0, 99999),
            ]);
            if (isActive) {
              setRestaurants(restaurantResults);
              setMenuItems(menuItemResults);
            }
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
  }, [debouncedSearchQuery, effectiveCoords?.latitude, effectiveCoords?.longitude, deliveryRadius]);

  // Fetch popular cuisines — runs with or without location, falls back to all restaurants
  useEffect(() => {
    if (!effectiveCoords) return; // Wait for effectiveCoords to be available
    const fetchCuisineTypes = async () => {
      setCuisineTypesLoading(true);
      setCuisineLoading(true);
      try {
        const allRestaurants = await getRestaurants();
        let effectiveRestaurants = allRestaurants;

        if (effectiveCoords) {
          const effectiveRadius = deliveryRadius || 50;
          const filteredRestaurants = allRestaurants.filter((r: any) => {
            try {
              const distance = getDistance(
                effectiveCoords.latitude,
                effectiveCoords.longitude,
                r.latitude,
                r.longitude
              );
              return distance <= effectiveRadius;
            } catch { return false; }
          });
          effectiveRestaurants = filteredRestaurants.length > 0 ? filteredRestaurants : allRestaurants;
        }

        const cuisines = Array.from(
          new Set(effectiveRestaurants.map((r: any) => r.cuisineType))
        ).filter(c => !!c && typeof c === 'string' && c.trim().length > 0);
        setCuisineTypes(cuisines);

        // Fetch menu items for each cuisine
        const itemsMap: { [key: string]: any[] } = {};
        for (const cuisine of cuisines) {
          const restaurants = effectiveRestaurants.filter(r => r.cuisineType === cuisine);
          let allItems: any[] = [];
          
          restaurants.forEach(r => {
            const items = r.MenuItem || r.menuItems;
            if (items) {
              const itemsWithRestaurant = items.map((item: any) => ({
                ...item,
                Restaurant: {
                  id: r.id,
                  name: r.name,
                  currency: r.currency || t('common.currency_default'),
                  deliveryCharges: r.deliveryCharges ?? Number(t('common.delivery_fee_default'))
                }
              }));
              allItems = [...allItems, ...itemsWithRestaurant];
            }
          });

          // Filter items whose label or category actually matches the cuisine
          const cuisineLower = cuisine.toLowerCase();
          const relevantItems = allItems.filter((item: any) => {
            const label = (item.label || '').toLowerCase();
            const category = (item.category || '').toLowerCase();
            return label.includes(cuisineLower) || category.includes(cuisineLower) || cuisineLower.includes(label.split(' ').pop() || '');
          });

          // Use relevant items if found, otherwise fall back to all items from cuisine restaurants
          const sourceItems = relevantItems.length > 0 ? relevantItems : allItems;
          const shuffled = sourceItems.sort(() => 0.5 - Math.random()).slice(0, 8);
          itemsMap[cuisine] = shuffled;
        }
        setCuisineItemsMap(itemsMap);

        // EXTRA: Collect some popular products from across all nearby restaurants for the "Initial Load"
        const topProducts = effectiveRestaurants.flatMap(r => {
          const items = r.MenuItem || r.menuItems || [];
          return items.slice(0, 2).map((item: any) => ({
            ...item,
            Restaurant: {
              id: r.id,
              name: r.name,
              currency: r.currency || t('common.currency_default'),
              deliveryCharges: r.deliveryCharges ?? Number(t('common.delivery_fee_default'))
            }
          }));
        }).sort(() => 0.5 - Math.random()).slice(0, 10);
        
        setPopularProducts(topProducts);

      } catch (error) {
        console.error("Error fetching cuisines: ", error);
      } finally {
        setCuisineTypesLoading(false);
        setCuisineLoading(false);
        setPopularProductsLoading(false);
      }
    };
    fetchCuisineTypes();
  }, [effectiveCoords?.latitude, effectiveCoords?.longitude, deliveryRadius]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { height: 210 + insets.top, paddingTop: insets.top + 25 }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: BrandColors.primary }]} />
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.brandHeaderContent}>
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandGreeting}>{t('greeting.morning')} 👋</Text>
            <Text style={styles.title}>{t('search.title')}</Text>
          </View>
          <View style={styles.brandIconContainer}>
            <Ionicons name="storefront" size={26} color="#FFF" style={{ opacity: 0.95 }}/>
          </View>
        </View>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={22}
            color="#9CA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder={t('search.placeholder')}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            underlineColorAndroid="transparent"
            autoFocus={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIcon}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
      >
        {loading ? (
          <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
            <Preloader fullScreen={false} size={80} />
          </View>
        ) : (
          <>
            <View style={[styles.section, recentSearches.length === 0 && styles.sectionEmpty]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <View style={styles.sectionAccent} />
                  <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
                    {t('search.recent_searches')}
                  </Text>
                </View>
              </View>
              {recentSearches.length > 0 ? (
                <View style={styles.recentSearches}>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.recentSearchItem}
                      onPress={() => setSearchQuery(search)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="time-outline" size={16} color="#6B7280" style={{ marginRight: 4 }} />
                      <Text style={styles.recentSearchText}>{search}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noRecentSearches}>
                  {t('search.fresh_start')}
                </Text>
              )}
            </View>

            {/* Search Results Mode */}
            {searchQuery.length > 0 ? (
              <>
                {restaurants.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionTitleContainer}>
                        <View style={styles.sectionAccent} />
                        <Text style={styles.sectionTitle}>{t('search.restaurants')}</Text>
                      </View>
                    </View>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.cuisineItemsScroll}
                    >
                      {restaurants.map((restaurant: any) => (
                        <RestaurantCard
                          key={`${restaurant.id}-search`}
                          restaurant={restaurant}
                          onPress={() => {
                            addToRecentSearches(restaurant.name);
                            navigation.navigate("RestaurantDetails", { restaurant });
                          }}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {menuItems.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionTitleContainer}>
                        <View style={styles.sectionAccent} />
                        <Text style={styles.sectionTitle}>{t('search.menu_items')}</Text>
                      </View>
                    </View>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.cuisineItemsScroll}
                    >
                      {menuItems.map((item: any) => (
                        <MenuItemCard
                          key={`${item.id}-search`}
                          item={item}
                          onPress={() => {
                            addToRecentSearches(item.label);
                            setSelectedProduct(item);
                            setIsModalVisible(true);
                          }}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {restaurants.length === 0 && menuItems.length === 0 && !loading && (
                  <View style={styles.searchEmptyContainer}>
                    <Ionicons name="search-outline" size={64} color="#E5E7EB" />
                    <Text style={styles.searchEmptyText}>{t('search.no_results')}</Text>
                  </View>
                )}
              </>
            ) : (
              /* Discovery Mode (Empty Search State) */
              <>
                {/* Recommended Products Section */}
                {popularProducts.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionTitleContainer}>
                        <View style={styles.sectionAccent} />
                        <Text style={styles.sectionTitle}>{t('search.recommended_for_you')}</Text>
                      </View>
                    </View>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.cuisineItemsScroll}
                    >
                      {popularProducts.map((item: any) => (
                        <MenuItemCard
                          key={`${item.id}-recommended`}
                          item={item}
                          onPress={() => {
                            setSelectedProduct(item);
                            setIsModalVisible(true);
                          }}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Popular Cuisines Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleContainer}>
                      <View style={styles.sectionAccent} />
                      <Text style={styles.sectionTitle}>{t('search.popular_cuisines')}</Text>
                    </View>
                  </View>
                  {!effectiveCoords || cuisineTypesLoading ? (
                    <View style={{ height: 150, justifyContent: 'center', alignItems: 'center' }}>
                      <Preloader fullScreen={false} size={60} />
                    </View>
                  ) : cuisineTypes.length === 0 ? (
                    <Text style={styles.noCuisinesText}>{t('search.no_cuisines')}</Text>
                  ) : (
                    cuisineTypes.map((cuisine: string) => (
                      <View key={cuisine} style={styles.cuisineSection}>
                        <Text style={styles.cuisineName}>{cuisine}</Text>
                        {cuisineLoading ? (
                          <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
                            <Preloader fullScreen={false} size={50} />
                          </View>
                        ) : (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.cuisineItemsScroll}
                        >
                          {cuisineItemsMap[cuisine]?.map((item: any) => (
                            <MenuItemCard
                              key={`${item.id}-${item.restaurantId}`}
                              item={item}
                              onPress={() => {
                                setSelectedProduct(item);
                                setIsModalVisible(true);
                              }}
                            />
                          ))}
                        </ScrollView>
                        )}
                      </View>
                    ))
                  )}
                </View>
              </>
            )}
          </>
        )}
      </Animated.ScrollView>

      <ProductDetailModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
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
    </View>
  );
};

const RestaurantCard = ({
  restaurant,
  onPress,
}: {
  restaurant: any;
  onPress: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity style={styles.modernRestaurantCard} onPress={onPress} activeOpacity={0.9}>
      <Image
        source={{
          uri: restaurant.coverImage || "https://via.placeholder.com/600",
        }}
        style={styles.modernRestaurantImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.cardGradient}
      />
      <View style={styles.modernCardContent}>
        <View style={styles.cardTopRow}>
          <Text style={styles.modernRestaurantName} numberOfLines={1}>
            {restaurant.name || ""}
          </Text>
          <View style={styles.modernRatingBadge}>
            <Ionicons name="star" size={14} color="#FFF" />
            <Text style={styles.modernRatingText}>
              {restaurant.rating ? restaurant.rating.toFixed(1) : "5.0"}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardBottomRow}>
          <Text style={styles.modernRestaurantCuisine} numberOfLines={1}>
            {restaurant.cuisineType || t('restaurant.default_cuisine')}
          </Text>
          <View style={styles.modernDeliveryInfo}>
            <Ionicons name="time-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.modernDeliveryText}>
              {restaurant.deliveryTime ? `${restaurant.deliveryTime} ${t('common.min')}` : `${t('common.delivery_time_range_default')} ${t('common.min')}`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MenuItemCard = ({
  item,
  onPress,
}: {
  item: any;
  onPress: () => void;
}) => {
  const { t } = useTranslation();
  const { cartItems, addToCart, removeFromCart, findLatestItemByProductId } = useCart();
  const totalQuantity = cartItems.filter(i => i.id === item.id).reduce((sum, i) => sum + i.quantity, 0);

  return (
    <TouchableOpacity style={styles.menuItemCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image || "https://via.placeholder.com/150" }}
          style={styles.menuItemImage}
          resizeMode="cover"
        />
        <QuantitySelector
          initialQuantity={totalQuantity}
          onUpdate={(newQty) => {
            const hasAddons = item.addonGroups && item.addonGroups.length > 0;
            const requiresSelection = hasAddons && item.addonGroups.some((g: any) => g.isRequired && !g.options.some((o: any) => o.isDefault));

            if (newQty > totalQuantity) {
              if (requiresSelection || hasAddons) {
                // Open modal if mandatory addons are missing defaults OR if it has addons at all
                onPress();
                return;
              }

              addToCart({
                id: item.id,
                restaurantId: item.restaurantId,
                restaurantName: item.Restaurant?.name || '',
                restaurantCurrency: item.Restaurant?.currency,
                name: item.label,
                price: item.price,
                quantity: 1,
                image: item.image,
                deliveryCharges: item.Restaurant?.deliveryCharges ?? Number(t('common.delivery_fee_default'))
              });
            } else if (newQty < totalQuantity) {
              removeFromCart(item.id);
            }
          }}
          containerStyle={styles.menuItemQuantitySelector}
          size="small"
        />
      </View>
      <View style={styles.menuItemInfo}>
        <Text style={styles.menuItemName} numberOfLines={2} ellipsizeMode="tail">
          {item.label || ""}
        </Text>
        <Text style={styles.menuItemPrice}>
          {item.price ? formatPrice(item.price, item.Restaurant?.currency) : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default SearchScreen;
