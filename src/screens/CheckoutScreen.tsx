import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase'; // Import Supabase client

type RootStackParamList = {
  Orders: undefined;
  // Add other screens here as needed
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CheckoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const handlePlaceOrder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const orderDetails = {
        user_id: user.id,
        address_id: address, // Assuming address is the ID of the address being used
        total_amount: 23.96, // Replace with actual total amount calculation
        status: 'PENDING',
      };

      const { error } = await supabase
        .from('orders')
        .insert([orderDetails]);

      if (error) throw error;

      navigation.navigate('Orders');
    } catch (error) {
      console.error('Error placing order:', error);
      // Handle error (e.g., show an alert)
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}


      <ScrollView style={styles.content}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your delivery address"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'card' && styles.selectedPaymentOption,
              ]}
              onPress={() => setPaymentMethod('card')}
            >
              <Ionicons
                name="card-outline"
                size={24}
                color={paymentMethod === 'card' ? '#FF4B2B' : '#6B7280'}
              />
              <Text
                style={[
                  styles.paymentOptionText,
                  paymentMethod === 'card' && styles.selectedPaymentOptionText,
                ]}
              >
                Credit/Debit Card
              </Text>
            </TouchableOpacity>

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

        {/* Card Details */}
        {paymentMethod === 'card' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Card Details</Text>
            <TextInput
              style={styles.input}
              value={cardNumber}
              onChangeText={setCardNumber}
              placeholder="Card Number"
              keyboardType="numeric"
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                value={expiryDate}
                onChangeText={setExpiryDate}
                placeholder="MM/YY"
              />
              <TextInput
                style={[styles.input, { flex: 1, marginLeft: 8 }]}
                value={cvv}
                onChangeText={setCvv}
                placeholder="CVV"
                keyboardType="numeric"
                secureTextEntry
              />
            </View>
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Subtotal</Text>
            <Text style={styles.summaryValue}>$20.97</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>$2.99</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalValue}>$23.96</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
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
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
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
  row: {
    flexDirection: 'row',
    marginTop: 12,
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
