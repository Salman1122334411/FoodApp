import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useCart } from '../hooks/useCart';
import cuid from 'cuid';
import { LinearGradient } from 'expo-linear-gradient';

// Use the same naming convention as in CartScreen
type Address = {
  id: string;
  label: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
};

type RootStackParamList = {
  Orders: undefined;
  CheckoutScreen: {
    deliveryAddress: Address;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CheckoutScreen'>;
type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'CheckoutScreen'>;

export function CheckoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CheckoutScreenRouteProp>();
  const { deliveryAddress } = route.params;
  
  const { cartItems, clearCart, getTotal } = useCart();
  const total = getTotal();
  const deliveryFee = 2.99;
  const finalTotal = total + deliveryFee;

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Group items by restaurant (we assume only one restaurant is in the cart)
      const restaurantGroups = cartItems.reduce((acc, item) => {
        const key = item.restaurantId;
        if (!acc[key]) {
          acc[key] = {
            restaurantId: item.restaurantId,
            restaurantName: item.restaurantName,
            items: [],
            total: 0,
          };
        }
        acc[key].items.push(item);
        acc[key].total += item.price * item.quantity;
        return acc;
      }, {} as Record<string, any>);

      // Create orders and order items for each restaurant group
      for (const restaurantId of Object.keys(restaurantGroups)) {
        const group = restaurantGroups[restaurantId];

        // Generate a unique order ID using cuid
        const orderId = cuid();
        // Get current timestamp in ISO format
        const currentTimestamp = new Date().toISOString();

        // Create the full delivery address string
        const deliveryAddressString = `${deliveryAddress.streetAddress}, ${deliveryAddress.city}, ${deliveryAddress.state}, ${deliveryAddress.zipCode}`;

        // Insert the order record
        const { data: orderData, error: orderError } = await supabase
          .from('Order')
          .insert([{
            id: orderId,
            userId: user.id,
            restaurantId: restaurantId,
            status: 'PENDING',
            totalAmount: finalTotal,
            deliveryAddress: deliveryAddressString,
            paymentMethod: paymentMethod,
            updatedAt: currentTimestamp,
          }])
          .select('id')
          .maybeSingle();          
        if (orderError) throw orderError;
        
        // Prepare order items for insertion
        const orderItems = group.items.map((item: any) => ({
          id: cuid(),
          orderId: orderId,
          menuItemId: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          updatedAt: currentTimestamp,
        }));

        // Insert order items
        const { error: itemsError } = await supabase
          .from('OrderItem')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }
      
      clearCart(); // Clear the cart upon successful order placement
      navigation.navigate('Orders');
      Alert.alert('Success', 'Order placed successfully!');
    } catch (error) {
      console.error('Order placement error:', error);
      Alert.alert('Error', 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B3F" />
        <Text style={styles.loadingText}>Processing your order...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Delivery Address Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="map-marker-outline" size={22} color="#FF6B3F" />
            </View>
            <Text style={styles.cardTitle}>Delivery Address</Text>
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.addressLabel}>{deliveryAddress.label}</Text>
            <Text style={styles.addressText}>{deliveryAddress.streetAddress}</Text>
            <Text style={styles.addressText}>
              {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zipCode}
            </Text>
            <View style={styles.phoneRow}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.phoneText}>{deliveryAddress.phoneNumber}</Text>
            </View>
          </View>
        </View>

        {/* Order Details Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="food-outline" size={22} color="#FF6B3F" />
            </View>
            <Text style={styles.cardTitle}>Order Details</Text>
          </View>
          
          {cartItems.length > 0 && (
            <View style={styles.cardContent}>
              <View style={styles.restaurantRow}>
                <Ionicons name="restaurant-outline" size={18} color="#4B5563" />
                <Text style={styles.restaurantName}>
                  {cartItems[0].restaurantName}
                </Text>
              </View>
              
              <View style={styles.divider} />
              
              {cartItems.map((item, index) => (
                <View key={item.id} style={[
                  styles.orderItem,
                  index === cartItems.length - 1 ? null : styles.orderItemBorder
                ]}>
                  <View style={styles.itemQuantity}>
                    <Text style={styles.quantityText}>{item.quantity}x</Text>
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Payment Method Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="credit-card-outline" size={22} color="#FF6B3F" />
            </View>
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>
          
          <View style={styles.cardContent}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'cod' && styles.selectedPaymentOption,
              ]}
              onPress={() => setPaymentMethod('cod')}
            >
              <View style={styles.paymentIconContainer}>
                <FontAwesome5 name="money-bill-wave" size={18} color={paymentMethod === 'cod' ? '#FF6B3F' : '#6B7280'} />
              </View>
              <View style={styles.paymentTextContainer}>
                <Text style={[
                  styles.paymentOptionText,
                  paymentMethod === 'cod' && styles.selectedPaymentOptionText,
                ]}>
                  Cash on Delivery
                </Text>
                <Text style={styles.paymentDescription}>Pay when your order arrives</Text>
              </View>
              <View style={styles.radioContainer}>
                <View style={[
                  styles.radioOuter,
                  paymentMethod === 'cod' && styles.radioOuterSelected
                ]}>
                  {paymentMethod === 'cod' && <View style={styles.radioInner} />}
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'card' && styles.selectedPaymentOption,
              ]}
              onPress={() => setPaymentMethod('card')}
            >
              <View style={styles.paymentIconContainer}>
                <FontAwesome5 name="credit-card" size={18} color={paymentMethod === 'card' ? '#FF6B3F' : '#6B7280'} />
              </View>
              <View style={styles.paymentTextContainer}>
                <Text style={[
                  styles.paymentOptionText,
                  paymentMethod === 'card' && styles.selectedPaymentOptionText,
                ]}>
                  Credit/Debit Card
                </Text>
                <Text style={styles.paymentDescription}>Add a new card or use existing</Text>
              </View>
              <View style={styles.radioContainer}>
                <View style={[
                  styles.radioOuter,
                  paymentMethod === 'card' && styles.radioOuterSelected
                ]}>
                  {paymentMethod === 'card' && <View style={styles.radioInner} />}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="receipt-outline" size={22} color="#FF6B3F" />
            </View>
            <Text style={styles.cardTitle}>Order Summary</Text>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Subtotal</Text>
              <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>Total</Text>
              <Text style={styles.totalValue}>${finalTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>
        
        {/* Extra space at bottom for scrolling */}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerPriceContainer}>
            <Text style={styles.footerPriceLabel}>Total</Text>
            <Text style={styles.footerPrice}>${finalTotal.toFixed(2)}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.placeOrderButton}
            onPress={handlePlaceOrder}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B3F', '#FF4B2B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.placeOrderButtonText}>Place Order</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardContent: {
    padding: 16,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 2,
    lineHeight: 22,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  phoneText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  orderItem: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  orderItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemQuantity: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B3F',
  },
  itemDetails: {
    flex: 1,
    paddingHorizontal: 10,
  },
  itemName: {
    fontSize: 15,
    color: '#1F2937',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedPaymentOption: {
    borderColor: '#FF6B3F',
    backgroundColor: '#FFF5F2',
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  paymentOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedPaymentOptionText: {
    color: '#FF6B3F',
  },
  paymentDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  radioContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#FF6B3F',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B3F',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 15,
    color: '#4B5563',
  },
  summaryValue: {
    fontSize: 15,
    color: '#1F2937',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B3F',
  },
  bottomSpace: {
    height: 80,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerPriceContainer: {
    flex: 1,
  },
  footerPriceLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeOrderButton: {
    flex: 1.2,
    height: 54,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4B5563',
  },
});