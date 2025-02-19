import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Restaurant, MenuItem } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../hooks/useCart';

export const RestaurantDetailsScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { restaurant } = route.params;
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { cartItems, addToCart, removeFromCart } = useCart();

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('MenuItem')
        .select('*')
        .eq('restaurantId', restaurant.id)
        .order('category');

      if (error) {
        console.error('Error fetching menu items:', error.message);
        setError('Error fetching menu items: ' + error.message);
        return;
      }

      if (data) {
        setMenuItems(data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError('Unexpected error: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (menuItem: MenuItem) => {
    addToCart({
      id: menuItem.id,
      restaurantId: restaurant.id, 
      restaurantName: restaurant.name,
      name: menuItem.label,
      price: menuItem.price,
      quantity: 1,
    });
  };

  const handleRemoveFromCart = (menuItem: MenuItem) => {
    removeFromCart(menuItem.id);
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    const itemInCart = cartItems.find(cartItem => cartItem.id === item.id);

    return (
      <View style={styles.menuItem}>
        <Image
          source={{ uri: item.image }}
          style={styles.menuItemImage}
          defaultSource={require('../../assets/placeholder.png')}
        />
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.label}</Text>
          <Text style={styles.menuItemDescription}>{item.description}</Text>
          <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
        </View>
        <View style={styles.menuItemActions}>
          {itemInCart ? (
            <View style={styles.quantityControl}>
              <TouchableOpacity
                onPress={() => handleRemoveFromCart(item)}
                style={styles.quantityButton}
              >
                <Ionicons name="remove" size={20} color="#FF4B2B" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{itemInCart.quantity}</Text>
              <TouchableOpacity
                onPress={() => handleAddToCart(item)}
                style={styles.quantityButton}
              >
                <Ionicons name="add" size={20} color="#FF4B2B" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => handleAddToCart(item)}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B2B" />
        <Text style={styles.loadingText}>Loading menu items...</Text>
      </View>
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: restaurant.coverImage }}
          style={styles.restaurantImage}
        />
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.cuisineType}>
            {restaurant.chainName} • {restaurant.cuisineType}
          </Text>
          <View style={styles.restaurantMeta}>
            <Text style={styles.metaText}>⭐ {restaurant.rating}</Text>
            <Text style={styles.metaText}>🕒 {restaurant.deliveryTime}</Text>
            <Text style={styles.metaText}>💰 {restaurant.minimumOrder}</Text>
          </View>
        </View>
      </View>

      {menuItems.length === 0 ? (
  <View style={styles.noItemsContainer}>
    <Text style={styles.noItemsText}>No items available now</Text>
  </View>
) : (
  <FlatList
    data={menuItems}
    renderItem={renderMenuItem}
    keyExtractor={(item) => item.id.toString()}
    contentContainerStyle={styles.menuList}
  />
)}

      {cartItems.length > 0 && (
        <TouchableOpacity
          style={styles.viewCartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <View style={styles.cartInfo}>
            <Ionicons name="cart" size={24} color="#fff" />
            <Text style={styles.cartCount}>
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
            </Text>
          </View>
          <Text style={styles.cartTotal}>
            ${cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  restaurantImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  cuisineType: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#4B5563',
  },
  menuList: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  menuItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4B2B',
  },
  menuItemActions: {
    justifyContent: 'center',
    marginLeft: 12,
  },
  addButton: {
    backgroundColor: '#FF4B2B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  quantityButton: {
    padding: 8,
  },
  quantityText: {
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4B2B',
    textAlign: 'center',
  },
  viewCartButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FF4B2B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartCount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cartTotal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  noItemsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noItemsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  
});
