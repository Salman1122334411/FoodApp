import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase'; // Import Supabase client
import { useCart } from '../hooks/useCart';

type Address = {
  id: string;
  label: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  // add additional fields as needed
};

type RootStackParamList = {
  Orders: undefined;
  CheckoutScreen: {
    cartItems: any[];
    total: number;
    deliveryAddress: Address;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CheckoutScreen'>;
type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'CheckoutScreen'>;

export function CheckoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CheckoutScreenRouteProp>();
  const { cartItems, total, deliveryAddress } = route.params;
  const { clearCart } = useCart(); // Access clearCart from cart hook
  const [paymentMethod, setPaymentMethod] = useState('cod'); // Default to Cash on Delivery
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Group items by restaurant
      const restaurantGroups = cartItems.reduce((acc, item) => {
        const key = item.restaurantId;
        if (!acc[key]) {
          acc[key] = {
            restaurantId: item.restaurantId,
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

        // Create order record
        const { data: orderData, error: orderError } = await supabase
        
          .from('Order') // Adjust table name if needed (e.g., 'orders')
          .insert([{
            userId: user.id,
            restaurantId: restaurantId,
            status: 'PENDING',
            totalAmount: group.total,
            deliveryAddress: deliveryAddress, // Storing the entire address object or just a formatted string as required
            payment_method: paymentMethod,
          }])
          .select('id')
          .single();
          console.log("Order Payload:", orderData);
        if (orderError) throw orderError;

        // Map order items for the order
        const orderItems = group.items.map((item: any) => ({
          orderid: orderData.id,
          menuitemid: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
        }));

        // Insert order items
        const { error: itemsError } = await supabase
          .from('OrderItem') // Adjust table name if needed (e.g., 'order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }
      
      clearCart(); // Clear cart after success
      navigation.navigate('Orders');
      Alert.alert('Success', 'Order placed successfully!');
    } catch (error) {
      console.error('Order placement error:', error);
      Alert.alert('Error', 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  // Show a loading indicator if the order is being placed
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B2B" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Delivery Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.addressText}>{deliveryAddress.label}</Text>
          <Text style={styles.addressText}>{deliveryAddress.street_address}</Text>
          <Text style={styles.addressText}>
            {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zip_code}
          </Text>
          <Text style={styles.addressText}>{deliveryAddress.phone_number}</Text>
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'cod' && styles.selectedPaymentOption,
              ]}
              onPress={() => setPaymentMethod('cod')}
            >
              <Ionicons
                name="cash-outline"
                size={24}
                color={paymentMethod === 'cod' ? '#FF4B2B' : '#6B7280'}
              />
              <Text
                style={[
                  styles.paymentOptionText,
                  paymentMethod === 'cod' && styles.selectedPaymentOptionText,
                ]}
              >
                Cash on Delivery
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Subtotal</Text>
            <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>$2.99</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalValue}>${(total + 2.99).toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.placeOrderButton}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.placeOrderButtonText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  addressText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 4,
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedPaymentOption: {
    borderColor: '#FF4B2B',
    backgroundColor: '#FFF5F5',
  },
  paymentOptionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  selectedPaymentOptionText: {
    color: '#FF4B2B',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4B2B',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  placeOrderButton: {
    backgroundColor: '#FF4B2B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
