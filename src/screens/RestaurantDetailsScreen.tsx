import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Animated,
} from 'react-native';
import { styles } from './RestaurantDetailsScreen.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase, MenuItem, AddonOption, getRestaurantById } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useCart, calculateItemSubtotal, getCartItemKey } from "../hooks/useCart";
import { formatPrice } from '../utils/currency';
import { useTranslation } from 'react-i18next';
import { Colors as BrandColors } from '../constants/Colors';
import Preloader from '../components/Preloader';
import QuantitySelector from '../components/QuantitySelector';
import ProductDetailModal from '../components/ProductDetailModal';

const getRestaurantStatus = (operatingHours: any, t: any) => {
  if (!operatingHours || typeof operatingHours !== 'object' || Object.keys(operatingHours).length === 0) {
    return {
      isOpen: true,
      openText: t('restaurant.open', 'Open Now'),
      closesText: `${t('restaurant.closes_at', 'Closes at')} ${t('common.late_night', 'Late Night')}`,
      statusColor: '#10B981'
    };
  }

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const currentDay = days[now.getUTCDay()];
  
  const todayHours = operatingHours[currentDay];
  
  if (!todayHours || !todayHours.open || !todayHours.close) {
    return {
      isOpen: false,
      openText: t('restaurant.closed', 'Closed'),
      closesText: '',
      statusColor: '#EF4444' // Red
    };
  }

  const currentTotalMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const parseTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const openMinutes = parseTime(todayHours.open);
  const closeMinutes = parseTime(todayHours.close);

  let isOpen = false;
  if (closeMinutes <= openMinutes) {
    // Crosses midnight
    isOpen = currentTotalMinutes >= openMinutes || currentTotalMinutes < closeMinutes;
  } else {
    // Normal hours
    isOpen = currentTotalMinutes >= openMinutes && currentTotalMinutes < closeMinutes;
  }

  const formatLocalTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setUTCHours(h, m, 0, 0);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  if (isOpen) {
    return {
      isOpen: true,
      openText: t('restaurant.open', 'Open Now'),
      closesText: `${t('restaurant.closes_at', 'Closes at')} ${formatLocalTime(todayHours.close)}`,
      statusColor: '#10B981'
    };
  } else {
    return {
      isOpen: false,
      openText: t('restaurant.closed', 'Closed'),
      closesText: `${t('restaurant.opens_at', 'Opens at')} ${formatLocalTime(todayHours.open)}`,
      statusColor: '#EF4444'
    };
  }
};

const RestaurantHeader = React.memo(({ restaurant, searchQuery, setSearchQuery, formatPrice, navigation, t }: any) => {
  const insets = useSafeAreaInsets();
  const status = getRestaurantStatus(restaurant.operatingHours, t);

  return (
    <>
      <View style={styles.headerContainer}>
        <Image
          source={{ uri: restaurant.coverImage }}
          style={styles.restaurantImage}
          resizeMode="cover"
        />
        {/* Floating Back Button over cover image */}
        <TouchableOpacity
          style={[
            {
              position: 'absolute',
              top: insets.top + 12,
              left: 20,
              backgroundColor: '#FFFFFF',
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
            }
          ]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>

        {/* Floating Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          
          <View style={styles.deliveryTimeBadge}>
            <Text style={styles.deliveryTimeText}>
              {t('restaurant.delivery_time')}: {restaurant.deliveryTime || '30-40'} {t('common.min')}
            </Text>
          </View>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={18} color="#F59E0B" />
            <Text style={styles.ratingText}>{restaurant.rating || "4.5"}</Text>
            <Text style={styles.reviewsText}>({t('restaurant.reviews_fallback')})</Text>
          </View>

          <View style={styles.detailsRow}>
            <Ionicons name="cube-outline" size={18} color="#6B7280" />
            <Text style={styles.detailsText}>
              {t('restaurant.delivery')}: {formatPrice(restaurant.deliveryCharges || 0, restaurant.currency)}
            </Text>
          </View>

          <View style={styles.detailsRow}>
            <Ionicons name="location-outline" size={18} color="#6B7280" />
            <Text style={[styles.detailsText, { flex: 1 }]}>
              {restaurant.address || t('restaurant.location_fallback')}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Ionicons name="time-outline" size={18} color={status.statusColor} />
            <Text style={[styles.statusText, { color: status.statusColor }]}>{status.openText}</Text>
            {status.closesText ? (
              <>
                <Text style={styles.dot}> • </Text>
                <Text style={[styles.closesText, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{status.closesText}</Text>
              </>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`${t('restaurants.search_placeholder')}`}
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearSearchButton}
          >
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </>
  );
});

export const RestaurantDetailsScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { t } = useTranslation();
  const { restaurant: initialRestaurant, selectedMenuItem } = route.params;
  const [restaurant, setRestaurant] = useState(initialRestaurant);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { cartItems, addToCart, removeFromCart, getTotal } = useCart();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);

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

  useEffect(() => {
    fetchRestaurantDetails();
    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMenuItems(menuItems);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = menuItems
        .filter(item =>
          item.label.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
        )
        .sort((a, b) => {
          const aIndex = a.label.toLowerCase().indexOf(query);
          const bIndex = b.label.toLowerCase().indexOf(query);

          // Priority 1: Label matches (smaller index first)
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;

          // Priority 2: Description matches (fall back to original order)
          return 0;
        });
      setFilteredMenuItems(filtered);
    }
  }, [searchQuery, menuItems]);

  useEffect(() => {
    if (selectedMenuItem && filteredMenuItems.length > 0) {
      const index = filteredMenuItems.findIndex(item => item.id === selectedMenuItem.id);
      if (index !== -1) {
        // Auto-open modal for the selected product
        setSelectedProduct(selectedMenuItem);
        setIsModalVisible(true);

        // Small delay to ensure FlatList is rendered and items are measured
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0 // Scroll to the absolute top
          });
        }, 300);
      }
    }
  }, [filteredMenuItems, selectedMenuItem]);

  const fetchRestaurantDetails = async () => {
    try {
      console.log(`Fetching details for restaurant ${initialRestaurant.id} via Web API...`);
      const data = await getRestaurantById(initialRestaurant.id);
      
      if (data) {
        setRestaurant(data);
        // The API response also includes menuItems
        if (data.menuItems) {
          setMenuItems(data.menuItems);
        }
      } else {
        console.warn('No restaurant details returned from API');
      }
    } catch (e) {
      console.error('Exception fetching restaurant details via API:', e);
    } finally {
      // If we got menu items, stop the loader.
      // Otherwise, the standalone fetchMenuItems will handle it (if still used).
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    // If the main fetchRestaurantDetails already provided menuItems, we're done.
    if (menuItems.length > 0) {
      setLoading(false);
      return;
    }

    try {
      console.log(`Fetching items for restaurant ${initialRestaurant.id} directly via fallback...`);
      const { data, error } = await supabase
        .from('MenuItem')
        .select('*')
        .eq('restaurantId', initialRestaurant.id)
        .order('category');

      if (error) {
        console.error('Error fetching menu items via fallback:', error.message);
        setError(t('restaurants.load_error'));
        return;
      }

      if (data) {
        setMenuItems(data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('common.error');
      setError(t('common.error') + ': ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (menuItem: MenuItem) => {
    addToCart({
      id: menuItem.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantCurrency: restaurant.currency,
      name: menuItem.label,
      price: menuItem.price,
      quantity: 1,
      image: menuItem.image,
      deliveryCharges: restaurant.deliveryCharges ?? restaurant.deliveryTimeCharges ?? Number(t('common.delivery_fee_default')),
    });
  };

  const handleRemoveFromCart = (menuItem: MenuItem) => {
    // Find the item in the cart that matches this menuItem.id
    // Since this is the simple increment/decrement from the list, we assume it's the version with NO options.
    // If multiple versions exist, this simple logic will decrement the one with no options.
    const cartItem = cartItems.find(item => item.id === menuItem.id && (!item.selectedOptions || item.selectedOptions.length === 0));
    
    // If we can't find a version with no options, but there are other versions, we might want to decrement the last one.
    // But for the simple list view, we usually only have one version OR we expect the user to use the modal for specific ones.
    removeFromCart(menuItem.id, cartItem?.selectedOptions || []);
  };

  const handleModalAddToCart = (menuItem: MenuItem, quantity: number, selectedOptions: AddonOption[]) => {
    addToCart({
      id: menuItem.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantCurrency: restaurant.currency,
      name: menuItem.label,
      price: menuItem.price,
      quantity: quantity,
      image: menuItem.image,
      deliveryCharges: restaurant.deliveryCharges ?? Number(t('common.delivery_fee_default')),
      selectedOptions: selectedOptions
    });

    setIsModalVisible(false);
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    const totalQuantity = cartItems
      .filter((i) => i.id === item.id)
      .reduce((sum, i) => sum + i.quantity, 0);
      
    const itemInCart = cartItems.find((i) => i.id === item.id);

    // Group items by ID to check total quantity
    const allGroupedItems = cartItems.reduce((acc: Record<string, any[]>, item) => {
      acc[item.id] = acc[item.id] || [];
      acc[item.id].push(item);
      return acc;
    }, {});

    return (
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setSelectedProduct(item);
          setIsModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.label}</Text>
          <Text style={styles.menuItemDescription}>{item.description}</Text>
          <Text style={styles.menuItemPrice}>{formatPrice(item.price, restaurant.currency)}</Text>
        </View>
        <View style={styles.menuItemImageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.menuItemImage}
            defaultSource={require('../../assets/placeholder.png')}
          />
          <QuantitySelector
            initialQuantity={totalQuantity}
            onUpdate={(newQty) => {
              const currentQty = totalQuantity;
              
              if (newQty > currentQty) {
                // If it's the first time adding OR it has addons, open the modal for configuration
                const totalQtyInCart = allGroupedItems[item.id] 
                  ? (allGroupedItems[item.id] as any[]).reduce((acc: number, i: any) => acc + i.quantity, 0) 
                  : 0;
                const hasAddons = item.addonGroups && item.addonGroups.length > 0;
                
                if (totalQtyInCart === 0 || hasAddons) {
                  // For items with addons, we ALWAYS open the modal on "+" 
                  // to let the user choose/confirm the configuration.
                  setSelectedProduct(item);
                  setIsModalVisible(true);
                  return;
                }
                handleAddToCart(item);
              } else if (newQty < currentQty) {
                // If removing and there are multiple configurations, we remove the FIRST one we find.
                if (itemInCart) {
                  removeFromCart(itemInCart.id, itemInCart.selectedOptions || []);
                }
              }
            }}
            containerStyle={styles.menuItemQuantitySelector}
            size="small"
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <Preloader fullScreen={true} />
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <FlatList
        ref={flatListRef}
        data={filteredMenuItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        getItemLayout={(data, index) => (
          { length: 150, offset: 150 * index, index } 
        )}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          });
        }}
        ListHeaderComponent={
          <RestaurantHeader
            restaurant={restaurant}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            formatPrice={formatPrice}
            navigation={navigation}
            t={t}
          />
        }
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.noItemsContainer}>
            <Text style={styles.noItemsText}>
              {searchQuery.trim() ? t('search.fresh_start') : t('home.no_popular_dishes')}
            </Text>
          </View>
        }
      />

      {cartItems.length > 0 && (
        <Animated.View style={{ 
          transform: [{ scale: cartBounceAnim }],
          position: 'absolute',
          bottom: Math.max(insets.bottom, 20),
          left: 20,
          right: 20,
          zIndex: 100,
        }}>
          <TouchableOpacity
            style={styles.viewCartButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <View style={styles.cartInfo}>
              <Ionicons name="cart" size={24} color="#fff" />
              <Text style={styles.cartCount}>
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)} {t('restaurants.items_count')}
              </Text>
            </View>
            <Text style={styles.cartTotal}>
              {formatPrice(getTotal(), restaurant.currency)}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      <ProductDetailModal
        isVisible={isModalVisible}
        product={selectedProduct}
        restaurant={restaurant}
        onClose={() => setIsModalVisible(false)}
        onAddToCart={handleModalAddToCart}
        initialQuantity={cartItems.find(i => i.id === selectedProduct?.id)?.quantity || 0}
        initialSelectedOptions={cartItems.find(i => i.id === selectedProduct?.id)?.selectedOptions || []}
      />
    </View>
  );
};
