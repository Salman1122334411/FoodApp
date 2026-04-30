import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { styles } from './RestaurantScreen.styles';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Restaurant, MenuItem } from '../lib/supabase';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../utils/currency';
import { useTranslation } from 'react-i18next';
import { Colors as BrandColors } from '../constants/Colors';

type RouteParams = {
  restaurant: Restaurant;
};

export function RestaurantScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurant } = route.params as RouteParams;
  const { addToCart, cartItems, removeFromCart } = useCart();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    restaurant.menuItems?.[0]?.category || ''
  );

  const categories = [...new Set((restaurant.menuItems || []).map(item => item.category))];
  const menuItemsByCategory = (restaurant.menuItems || []).reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const getItemQuantity = (item: MenuItem) => {
    return cartItems.find(cartItem =>
      cartItem.restaurantId === restaurant.id &&
      cartItem.id === item.id
    )?.quantity || 0;
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      id: item.id,
      restaurantId: restaurant.id!,
      restaurantName: restaurant.name,
      name: item.label,
      price: item.price,
      quantity: 1,
      image: item.image,
    });
  };

  const handleRemoveFromCart = (item: MenuItem) => {
    removeFromCart(item.id);
  };

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={styles.container}>
      {/* Header Image */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Image
            source={restaurant.coverImage ? { uri: restaurant.coverImage } : { uri: restaurant.coverImage }}
            style={styles.coverImage}
          />
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 10 }]}
            onPress={() => navigation.goBack()}
            activeOpacity={1}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Restaurant Info */}
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName} numberOfLines={1} ellipsizeMode="tail">{restaurant.name}</Text>
          <Text style={styles.restaurantCuisine}>
            {restaurant.cuisineType}
          </Text>
          <View style={styles.restaurantMeta}>
            <Text style={styles.metaItem}>⭐ {restaurant.rating}</Text>
            <Text style={styles.metaItem}>🕒 {restaurant.deliveryTime} {t('restaurant.min')}</Text>
            <Text style={styles.metaItem}>{t('restaurant.min_order')} {restaurant.minimumOrder}</Text>
          </View>
        </View>

        {/* Menu Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                selectedCategory === category && styles.selectedCategory,
              ]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={1}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.selectedCategoryText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItemsByCategory[selectedCategory]?.map((item) => (
            <View key={item.label} style={styles.menuItem}>
              <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemName} numberOfLines={1} ellipsizeMode="tail">{item.label}</Text>
                <Text style={styles.menuItemDescription} numberOfLines={2} ellipsizeMode="tail">
                  {item.description}
                </Text>
                <Text style={styles.menuItemPrice}>{formatPrice(item.price, restaurant.currency)}</Text>
              </View>
              {item.image && (
                <Image
                  source={{ uri: item.image }}
                  style={styles.menuItemImage}
                />
              )}
              <View style={styles.quantityContainer}>
                {getItemQuantity(item) > 0 && (
                  <>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleRemoveFromCart(item)}
                      activeOpacity={1}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantity}>{getItemQuantity(item)}</Text>
                  </>
                )}
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleAddToCart(item)}
                  activeOpacity={1}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Cart Button */}
      {totalCartItems > 0 && (
        <Pressable
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart' as never)}
        >
          <Text style={styles.cartButtonText}>
            {t('restaurant.view_cart')} ({totalCartItems} {t('restaurant.items')})
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default RestaurantScreen;

