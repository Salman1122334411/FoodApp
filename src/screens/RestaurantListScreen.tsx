import * as React from 'react';
import { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Animated,
} from 'react-native';
import { styles } from './RestaurantListScreen.styles';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Restaurant, MenuItem } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useCart, getCartItemKey } from '../hooks/useCart';
import { useTranslation } from 'react-i18next';
import { Colors as BrandColors } from '../constants/Colors';
import QuantitySelector from '../components/QuantitySelector';
import { searchRestaurants, searchMenuItems } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
// Import the custom location hook
import { useLocation } from '../hooks/useLocation';
// Import the getDistance utility
import { getDistance } from '../utils/geo';
import { formatPrice } from '../utils/currency';
import { useSettings } from '../hooks/useSettings';
import Preloader from '../components/Preloader';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const RestaurantListScreen = ({ navigation }: { navigation: any }) => {
  const { t } = useTranslation();
  // Store the full fetched list separately
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  // 'restaurants' state holds the nearby (filtered) restaurants
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { cartItems, addToCart, removeFromCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const insets = useSafeAreaInsets();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { deliveryRadius } = useSettings();

  // --- Location & Default Address State ---
  const { currentLocation, fetchLocation, coords } = useLocation();
  const [defaultAddressCoords, setDefaultAddressCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  // Effective coordinates: current device location if available, otherwise the default address.
  const effectiveCoords = useMemo(() => coords || defaultAddressCoords, [coords, defaultAddressCoords]);
  //---------------------------------------------

  // Fetch current location on mount if not already available.
  useEffect(() => {
    if (!coords && !defaultAddressCoords) {
      fetchLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run check on mount

  // --- Animation Hook ---
  const cartBounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (cartItems.length > 0) {
      Animated.sequence([
        Animated.timing(cartBounceAnim, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(cartBounceAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [cartItems.reduce((sum, i) => sum + i.quantity, 0)]);
  // ----------------------

  // Fetch the user's default address coordinates (if any).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        fetchDefaultAddress(data.session.user.id);
      }
    });
  }, []);

  // --- Fetch Default Address Function ---
  const fetchDefaultAddress = async (userId: string) => {
    const { data, error } = await supabase
      .from('Address')
      .select('latitude, longitude')
      .eq('userId', userId)
      .eq('isDefault', true)
      .maybeSingle();
    if (error) {
      console.error('Error fetching default address:', error.message);
      return;
    }
    if (data && data.latitude && data.longitude) {
      setDefaultAddressCoords({ latitude: data.latitude, longitude: data.longitude });
    }
  };
  //-----------------------------------------

  // Fetch all restaurants (unfiltered) from Supabase.
  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Restaurant')
        .select(`
          id,
          name,
          chainName,
          address,
          latitude,
          longitude,
          cuisineType,
          storeType,
          segment,
          city,
          area,
          rating,
          coverImage,
          deliveryTime,
          minimumOrder,
          deliveryCharges,
          currency,
          MenuItem (*)
        `)
        .order('rating', { ascending: false });
      if (error) {
        setError(t('restaurants.load_error'));
        return;
      }
      setAllRestaurants(data || []);
    } catch (err) {
      setError(t('restaurants.load_error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initially fetch all restaurants.
  useEffect(() => {
    fetchRestaurants();
  }, []);

  // Whenever effectiveCoords or the full list changes, calculate distances but show all stores.
  useEffect(() => {
    if (allRestaurants.length === 0) return;

    // We process all restaurants to ensure they have distance metadata if possible,
    // but we ONLY show them if they are within the delivery radius.
    const radius = Number(deliveryRadius) || 50; 

    const nearby = allRestaurants.filter((restaurant: Restaurant) => {
      if (!restaurant.latitude || !restaurant.longitude || !effectiveCoords) {
        return false; 
      }
      try {
        const distance = getDistance(
          effectiveCoords.latitude,
          effectiveCoords.longitude,
          restaurant.latitude,
          restaurant.longitude
        );
        return distance <= radius; // RESTORED: Only nearby stores
      } catch (error) {
        console.error('Error calculating distance:', error);
        return false;
      }
    });

    setRestaurants(nearby);
  }, [effectiveCoords?.latitude, effectiveCoords?.longitude, allRestaurants, deliveryRadius]);

  // Perform search and then filter search results by distance.
  const performSearch = async (term: string) => {
    setLoading(true);
    try {
      // Check if we have valid coordinates before searching
      if (!effectiveCoords || !effectiveCoords.latitude || !effectiveCoords.longitude) {
        setError(t('restaurants.location_required'));
        setLoading(false);
        return;
      }

      const [restaurantResults, menuItemResults] = await Promise.all([
        searchRestaurants(term, effectiveCoords.latitude, effectiveCoords.longitude),
        searchMenuItems(term, effectiveCoords.latitude, effectiveCoords.longitude),
      ]);
      const restaurantIdsFromName = restaurantResults.map(r => r.id);
      const restaurantIdsFromMenu = menuItemResults.map(mi => mi.restaurantId);
      const allRestaurantIds = Array.from(new Set([...restaurantIdsFromName, ...restaurantIdsFromMenu]));

      if (allRestaurantIds.length === 0) {
        setRestaurants([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('Restaurant')
        .select(`
          id,
          name,
          chainName,
          address,
          latitude,
          longitude,
          cuisineType,
          storeType,
          segment,
          city,
          area,
          rating,
          coverImage,
          deliveryTime,
          minimumOrder,
          deliveryCharges,
          currency,
          MenuItem (*)
        `)
        .in('id', allRestaurantIds)
        .order('rating', { ascending: false });
      if (error) throw error;

      let processedRestaurants = data.map((restaurant: any) => {
        if (restaurantIdsFromName.includes(restaurant.id)) {
          return restaurant;
        } else {
          const menuItems = restaurant.MenuItem || restaurant.menuItems || [];
          const filteredMenuItems = menuItems.filter((item: MenuItem) =>
            item.label.toLowerCase().includes(term.toLowerCase())
          );
          return { ...restaurant, MenuItem: filteredMenuItems };
        }
      });

      // RESTORED: Filter search results by location radius.
      const radius = Number(deliveryRadius) || 50;
      if (effectiveCoords) {
        processedRestaurants = processedRestaurants.filter((restaurant: Restaurant) => {
          const distance = getDistance(
            effectiveCoords.latitude,
            effectiveCoords.longitude,
            restaurant.latitude,
            restaurant.longitude
          );
          return distance <= radius;
        });
      }
      setRestaurants(processedRestaurants);
    } catch (error) {
      setError(t('restaurants.search_error'));
    } finally {
      setLoading(false);
    }
  };

  // Re-run search when the debounced search term changes.
  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      performSearch(debouncedSearchTerm.trim());
    } else {
      fetchRestaurants();
    }
  }, [debouncedSearchTerm]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRestaurants();
  };

  const handleMenuItemPress = (restaurant: Restaurant, menuItem: MenuItem) => {
    addToCart({
      id: menuItem.id,
      restaurantId: restaurant.id,
      restaurantCurrency: restaurant.currency,
      name: menuItem.label,
      price: menuItem.price,
      quantity: 1,
      restaurantName: restaurant.name,
      image: menuItem.image,
      deliveryCharges: restaurant.deliveryCharges ?? Number(t('common.delivery_fee_default')),
    });
  };

  const renderMenuItem = (restaurant: Restaurant, menuItem: MenuItem) => {
    const totalQty = cartItems.filter(item => item.id === menuItem.id).reduce((sum, item) => sum + item.quantity, 0);
    return (
      <View style={styles.menuItem} key={menuItem.id}>
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName} numberOfLines={1} ellipsizeMode="tail">{menuItem.label}</Text>
          <Text style={styles.menuItemDescription} numberOfLines={2} ellipsizeMode="tail">{menuItem.description}</Text>
          <Text style={styles.menuItemPrice}>{formatPrice(menuItem.price, restaurant.currency)}</Text>
        </View>
        <View style={styles.menuItemImageContainer}>
          <Image
            source={{ uri: menuItem.image }}
            style={styles.menuItemImage}
            defaultSource={require('../../assets/placeholder.png')}
          />
          <QuantitySelector
            initialQuantity={totalQty}
            onUpdate={(newQty) => {
              const hasAddons = menuItem.addonGroups && menuItem.addonGroups.length > 0;
              const requiresSelection = hasAddons && menuItem.addonGroups?.some((g: any) => g.isRequired && !g.options.some((o: any) => o.isDefault));

              if (newQty > totalQty) {
                if (requiresSelection || hasAddons) {
                  // Direct to restaurant details if selection is needed OR if it just has addons at all
                  navigation.navigate('RestaurantDetails', { restaurant: restaurant, selectedMenuItem: menuItem });
                  return;
                }
                handleMenuItemPress(restaurant, menuItem);
              } else if (newQty < totalQty) {
                removeFromCart(menuItem.id);
              }
            }}
            containerStyle={styles.menuItemQuantitySelector}
            size="small"
          />
        </View>
      </View>
    );
  };

  const renderRestaurantItem = ({ item }: { item: Restaurant }) => (
    <View style={styles.restaurantCard}>
      <Image
        source={{ uri: item.coverImage }}
        style={styles.restaurantImage}
      />
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
        <Text style={styles.cuisineType} numberOfLines={1} ellipsizeMode="tail">
          {item.cuisineType}
        </Text>
        <View style={styles.restaurantMeta}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="star" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
            <Text style={styles.metaText}>{item.rating}</Text>
          </View>
          <Text style={styles.metaText}>🕒 {item.deliveryTime} {t('restaurant.min')}</Text>
          <Text style={styles.metaText}>💰 {t('restaurant.min_order')} {item.minimumOrder}</Text>
        </View>
        <Text style={styles.address} numberOfLines={1} ellipsizeMode="tail">{item.address}</Text>
      </View>
      <View style={styles.menuItemsContainer}>
        <Text style={styles.menuTitle}>{t('restaurants.menu_title')}</Text>
        {((item as any).MenuItem || item.menuItems || [])?.slice(0, 4).map((menuItem: MenuItem) => renderMenuItem(item, menuItem))}
        
        {((item as any).MenuItem || item.menuItems || []).length > 4 && (
          <TouchableOpacity 
            style={styles.viewAllMenu}
            onPress={() => navigation.navigate("RestaurantDetails", { restaurant: item })}
          >
            <Text style={styles.viewAllMenuText}>{t('home.view_all_categories')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            fetchRestaurants();
          }}
          activeOpacity={1}
        >
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !refreshing) {
    return <Preloader fullScreen={true} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={restaurants}
        renderItem={renderRestaurantItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[BrandColors.primary]}
            tintColor={BrandColors.primary}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.searchContainer}>
              <View style={styles.searchWrapper}>
                <Ionicons name="search" size={20} color={BrandColors.primary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('restaurants.search_placeholder')}
                  placeholderTextColor="#999"
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  autoFocus={false}
                  underlineColorAndroid="transparent"
                />
                {searchTerm.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => setSearchTerm('')}
                    style={styles.clearIcon}
                  >
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        }
        keyboardShouldPersistTaps="handled"
      />

      {cartItems.length > 0 && (
        <Animated.View style={{ 
          transform: [{ scale: cartBounceAnim }],
          position: 'absolute',
          bottom: 20 + insets.bottom,
          left: 20,
          right: 20,
          zIndex: 100,
        }}>
          <TouchableOpacity
            style={styles.viewCartButton}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={1}
          >
            <View style={styles.cartInfo}>
              <Ionicons name="cart" size={24} color="#fff" />
              <Text style={styles.cartCount}>
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)} {t('restaurants.items_count')}
              </Text>
            </View>
            <Text style={styles.cartTotal}>
              {(() => {
                const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const currency = cartItems.length > 0 ? cartItems[0].restaurantCurrency : undefined;
                return formatPrice(total, currency);
              })()}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

export default RestaurantListScreen;
