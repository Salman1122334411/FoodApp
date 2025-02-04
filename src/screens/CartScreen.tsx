import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useCart } from '../hooks/useCart';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
interface Address {
  id: string;
  label: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
}

export function CartScreen({ navigation }: { navigation: any }) {
  const { cartItems, removeFromCart, clearCart, addToCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({});
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      const { data, error } = await supabase
      .from('Addresses')
      .select('id, label, street_address, city, state, zip_code, phone_number, latitude, longitude, is_default')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });
    

      if (error) throw error;
      setAddresses(data || []);
      if (data && data.length > 0) {
        const defaultAddress = data.find(addr => addr.is_default) || data[0];
        setSelectedAddress(defaultAddress);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      Alert.alert('Error', 'Failed to load addresses');
    }
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      let deliveryAddress = selectedAddress;
      if (useNewAddress) {
        const { data: addressData, error: addressError } = await supabase
        .from('Addresses')
        .insert([{ 
          user_id: user.id,
          label: newAddress.label || 'Home',
          street_address: newAddress.street_address,
          city: newAddress.city,
          state: newAddress.state,
          zip_code: newAddress.zip_code,
          phone_number: newAddress.phone_number,
          latitude: newAddress.latitude || null,
          longitude: newAddress.longitude || null,
          is_default: newAddress.is_default || false
        }])
        .select()
        .single();
      

        if (addressError) throw addressError;
        deliveryAddress = addressData;
      }

      if (!deliveryAddress) {
        Alert.alert('Error', 'Please select or add a delivery address');
        return;
      }

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
  
      // Create orders and order items
      for (const restaurantId of Object.keys(restaurantGroups)) {
        const group = restaurantGroups[restaurantId];
        
        // Create order
        const { data: orderData, error: orderError } = await supabase
          .from('Order')
          .insert([{
            userId: user.id,
            restaurantId: restaurantId,
            status: 'PENDING',
            totalAmount: group.total,
            deliveryAddress: deliveryAddress,
          }])
          .select('id')
          .single();
  
        if (orderError) throw orderError;
  
        // Create order items
        const orderItems = group.items.map((item: any) => ({
          orderid: orderData.id,
          menuitemid: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
        }));
  
        const { error: itemsError } = await supabase
          .from('OrderItem')
          .insert(orderItems);
  
        if (itemsError) throw itemsError;
      }
  
      clearCart();
      navigation.navigate('Orders');
      Alert.alert('Success', 'Order placed successfully!');
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const groupedItems = cartItems.reduce((acc, item) => {
    if (!acc[item.restaurantId]) {
      acc[item.restaurantId] = {
        name: item.restaurantName,
        items: [],
      };
    }
    acc[item.restaurantId].items.push(item);
    return acc;
  }, {} as Record<string, { name: string; items: typeof cartItems }>);

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B2B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {Object.entries(groupedItems).map(([restaurantId, { name, items }]) => (
          <View key={restaurantId} style={styles.restaurantSection}>
            <Text style={styles.restaurantName}>{name}</Text>
            {items.map((item) => (
              <View key={item.name} style={styles.cartItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.quantityContainer}>
                <TouchableOpacity
  style={styles.quantityButton}
  onPress={() => removeFromCart(item.id)}
>
  <Text style={styles.quantityButtonText}>-</Text>
</TouchableOpacity>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => {
                      const newItem = { ...item, quantity: 1 };
                      addToCart(newItem);
                    }}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.addressSection}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          
          <TouchableOpacity
            style={styles.addressOption}
            onPress={() => {
              setUseNewAddress(false);
              navigation.navigate('Address');
            }}
          >
            <Ionicons name="location-outline" size={24} color="#FF4B2B" />
            <Text style={styles.addressOptionText}>Manage Saved Addresses</Text>
          </TouchableOpacity>

          {addresses.length > 0 && !useNewAddress && (
            <View style={styles.savedAddresses}>
              {addresses.map((address) => (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressCard,
                    selectedAddress?.id === address.id && styles.selectedAddress,
                  ]}
                  onPress={() => {
                    setSelectedAddress(address);
                    setUseNewAddress(false);
                  }}
                >
<Text style={styles.addressText}>
  {address.label}: {address.street_address}
</Text>
<Text style={styles.addressText}>
  {address.city}, {address.state} {address.zip_code}
</Text>
<Text style={styles.addressText}>
  Phone: {address.phone_number}
</Text>

                  <Text style={styles.addressText}>
                    {address.city}, {address.state} {address.zip_code}
                  </Text>
                  {address.is_default && (
                    <Text style={styles.defaultBadge}>Default</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.addressOption, useNewAddress && styles.selectedOption]}
            onPress={() => setUseNewAddress(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#FF4B2B" />
            <Text style={styles.addressOptionText}>Add New Address</Text>
          </TouchableOpacity>

          {useNewAddress && (
            <View style={styles.form}>
<TextInput
  style={styles.input}
  value={newAddress.street_address}
  onChangeText={(text) => setNewAddress({ ...newAddress, street_address: text })}
  placeholder="Street Address"
/>
<TextInput
  style={styles.input}
  value={newAddress.phone_number}
  onChangeText={(text) => setNewAddress({ ...newAddress, phone_number: text })}
  placeholder="Phone Number"
  keyboardType="phone-pad"
/>

              <TextInput
                style={styles.input}
                value={newAddress.city}
                onChangeText={(text) => setNewAddress({ ...newAddress, city: text })}
                placeholder="City"
              />
              <TextInput
                style={styles.input}
                value={newAddress.state}
                onChangeText={(text) => setNewAddress({ ...newAddress, state: text })}
                placeholder="State"
              />
              <TextInput
                style={styles.input}
                value={newAddress.zip_code}
                onChangeText={(text) => setNewAddress({ ...newAddress, zip_code: text })}
                placeholder="Postal Code"
                keyboardType="numeric"
              />
            </View>
          )}
        </View>
      </ScrollView>

      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total:</Text>
            <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
            disabled={loading || (!selectedAddress && !useNewAddress)}
          >
            <Text style={styles.checkoutButtonText}>
              {loading ? 'Processing...' : 'Place Order'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#1F2937',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4B2B',
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  quantityButton: {
    padding: 8,
    width: 36,
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    color: '#FF4B2B',
    fontWeight: 'bold',
  },
  quantity: {
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  addressSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#FEE2E2',
  },
  addressOptionText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  savedAddresses: {
    marginVertical: 12,
  },
  addressCard: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedAddress: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FF4B2B',
    borderWidth: 1,
  },
  addressText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  defaultBadge: {
    color: '#FF4B2B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  form: {
    gap: 12,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalText: {
    fontSize: 18,
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4B2B',
  },
  checkoutButton: {
    backgroundColor: '#FF4B2B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
