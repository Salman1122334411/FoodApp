import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { styles } from './CheckoutScreen.styles';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useCart, calculateItemSubtotal, getCartItemKey } from '../hooks/useCart';
import cuid from 'cuid';
import { LinearGradient } from 'expo-linear-gradient';
import { formatPrice } from '../utils/currency';
import { useTranslation } from 'react-i18next';
import { Colors as BrandColors } from '../constants/Colors';
import { DeliveryTimingCard } from '../components/Checkout/DeliveryTimingCard';
import { createOrder, getRestaurantByIdFromAPI } from '../lib/api';
import { OrderSuccessModal } from '../components/Checkout/OrderSuccessModal';
import { useEffect } from 'react';

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
    deliveryAddress: any;
    restaurantId?: string;
  };
  MainTabs: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CheckoutScreen'>;
type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'CheckoutScreen'>;

export function CheckoutScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CheckoutScreenRouteProp>();
  const { deliveryAddress } = route.params;

  console.log("CheckoutScreen mounted");
  console.log("Received deliveryAddress:", deliveryAddress);

  const { cartItems, clearCart, getTotal } = useCart();
  const activeRestaurantId = route.params.restaurantId;
  
  // Filter items for the target restaurant
  const filteredItems = activeRestaurantId 
    ? cartItems.filter(item => item.restaurantId === activeRestaurantId)
    : cartItems;

  console.log("Cart items in CheckoutScreen:", cartItems.length, "Filtered items:", filteredItems.length);
  
  // Recalculate totals for the filtered items
  const subtotal = filteredItems.reduce((acc, item) => 
    acc + calculateItemSubtotal(item.price, item.quantity, item.selectedOptions), 0);
    
  const deliveryFee = filteredItems.length > 0 
    ? (filteredItems[0].deliveryCharges ?? Number(t('common.delivery_fee_default'))) 
    : Number(t('common.delivery_fee_default'));
    
  const finalTotal = subtotal + deliveryFee;

  console.log("DEBUG: CheckoutScreen delivery calculation", {
    cartDeliveryCharges: cartItems.length > 0 ? cartItems[0].deliveryCharges : 'no items',
    finalDeliveryFee: deliveryFee
  });

  // Get restaurant currency from filtered items
  const restaurantCurrency = filteredItems.length > 0 ? filteredItems[0].restaurantCurrency : undefined;

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  // Scheduled Order State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledSlot, setScheduledSlot] = useState<string | null>(null);

  // Gift State
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [isRestaurantClosed, setIsRestaurantClosed] = useState(false);
  const [restaurantData, setRestaurantData] = useState<any>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!activeRestaurantId) return;
      try {
        const data = await getRestaurantByIdFromAPI(activeRestaurantId);
        if (data) {
          setRestaurantData(data);
          
          // Validate immediately if it's not a scheduled order
          if (!isScheduled && data.DeliverySlot) {
            checkAvailability(data.DeliverySlot);
          }
        }
      } catch (err) {
        console.error("Error fetching restaurant slots:", err);
      }
    };
    fetchSlots();
  }, [activeRestaurantId]);

  const checkAvailability = (slots: any[]) => {
    const now = new Date();
    const utcDay = now.getUTCDay(); // 0-6
    const utcHours = now.getUTCHours();
    const utcMins = now.getUTCMinutes();
    const totalUtcMins = utcHours * 60 + utcMins;

    const parseTime = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    // Find slots for today
    const todalSlots = slots.filter(s => s.dayOfWeek === utcDay && s.isAvailable);

    if (todalSlots.length === 0) {
      setIsRestaurantClosed(true);
      return;
    }

    const isCurrentlyOpen = todalSlots.some(slot => {
      const start = parseTime(slot.startTime);
      const end = parseTime(slot.endTime);
      
      if (end <= start) {
        // Crosses midnight
        return totalUtcMins >= start || totalUtcMins < end;
      }
      return totalUtcMins >= start && totalUtcMins < end;
    });

    setIsRestaurantClosed(!isCurrentlyOpen);
  };

  useEffect(() => {
    if (restaurantData?.DeliverySlot && !isScheduled) {
      checkAvailability(restaurantData.DeliverySlot);
    } else if (isScheduled) {
      // If scheduled, we assume slots are handled by DeliveryTimingCard selection
      setIsRestaurantClosed(false);
    }
  }, [isScheduled, restaurantData]);

  const insets = useSafeAreaInsets();
  const handlePlaceOrder = async () => {
    console.log("handlePlaceOrder initiated");
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("Place Order failed: No user");
        throw new Error('User not authenticated');
      }
      console.log("User authenticated:", user.id);

      // Group items by restaurant
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
        acc[key].total += calculateItemSubtotal(item.price, item.quantity, item.selectedOptions);
        return acc;
      }, {} as Record<string, any>);

      console.log("Restaurant groups prepared:", Object.keys(restaurantGroups));

      // Create orders via the Vercel API for the specific restaurant
      const restaurantToProcess = activeRestaurantId || Object.keys(restaurantGroups)[0];
      const group = restaurantGroups[restaurantToProcess];

      if (!group) {
        throw new Error('No items found for the selected restaurant');
      }

      // Create the full delivery address string
      const deliveryAddressString = `${deliveryAddress.streetAddress}, ${deliveryAddress.city}, ${deliveryAddress.state}, ${deliveryAddress.zipCode}`;

      console.log("Creating order through Vercel API...", { restaurantId: restaurantToProcess });

      // Prepare the order payload for the Vercel API
      const orderPayload = {
        userId: user.id,
        restaurantId: restaurantToProcess,
        items: group.items.map((item: any) => {
          return {
            menuItemId: item.id,
            quantity: item.quantity,
            price: calculateItemSubtotal(item.price, 1, item.selectedOptions), // Item unit price with addons
            name: item.name,
            options: item.selectedOptions || null,
          };
        }),
        totalAmount: finalTotal,
        selectedAddress: deliveryAddressString,
        paymentMethod: paymentMethod,
        phoneNumber: deliveryAddress.phoneNumber,
        scheduledDate: isScheduled ? scheduledDate?.toISOString() : null,
        scheduledSlot: isScheduled ? scheduledSlot : null,
        recipientName: isGift && recipientName.trim() !== '' ? recipientName : null,
        recipientPhone: isGift && recipientPhone.trim() !== '' ? recipientPhone : null,
        orderVertical: "RESTAURANT", // Explicitly set based on backend schema
      };

      try {
        const createdOrder = await createOrder(orderPayload);
        console.log("Order created successfully through API:", createdOrder.id);
        setLastOrderId(createdOrder.id);
      } catch (apiError: any) {
        console.error("API Order creation failed:", apiError);
        const errorMsg = apiError.message || 'Restaurant is not accepting orders at this time.';
        throw new Error(errorMsg);
      }

      clearCart(); // Clear the cart upon successful order placement
      console.log("Cart cleared");

      // Show Custom Success Modal instead of Alert and Reset
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Order placement error:', error);
      Alert.alert(
        t('common.error'), 
        error.message || t('checkout.error_message')
      );
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
        <Text style={styles.loadingText}>{t('checkout.processing')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header handled by Navigation or custom */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Delivery Address Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('checkout.delivery_address')}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.headerActionText}>{t('checkout.change')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.addressCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={24} color="#C04020" />
          </View>
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>{deliveryAddress.label}</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {deliveryAddress.streetAddress}, {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zipCode}
            </Text>
            <View style={styles.phoneRow}>
              <Ionicons name="call" size={14} color="#6B7280" />
              <Text style={styles.phoneText}>{deliveryAddress.phoneNumber}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Timing Section (MODULAR) */}
        <DeliveryTimingCard 
          restaurantId={activeRestaurantId || (filteredItems.length > 0 ? filteredItems[0].restaurantId : '')}
          onTimingChange={(scheduled, date, slot) => {
            setIsScheduled(scheduled);
            setScheduledDate(date);
            setScheduledSlot(slot);
          }}
          t={t}
        />

        {/* Recipient Details (Gift) */}
        {!isGift ? (
          <TouchableOpacity 
            style={styles.giftToggleCard} 
            onPress={() => setIsGift(true)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="gift-outline" size={22} color={BrandColors.primary} style={{ marginRight: 12 }} />
              <Text style={styles.giftToggleCardText}>{t('checkout.this_is_a_gift')}</Text>
            </View>
            <View style={styles.checkboxOuter} />
          </TouchableOpacity>
        ) : (
          <View style={styles.giftExpandedContainer}>
            <View style={styles.sectionHeaderGift}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="gift" size={24} color={BrandColors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>{t('checkout.recipient_details')}</Text>
              </View>
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center' }} 
                onPress={() => setIsGift(false)}
              >
                <Text style={styles.giftToggleTextActive}>{t('common.cancel')}</Text>
                <View style={[styles.checkboxOuter, styles.checkboxOuterSelected, { marginRight: 0, marginLeft: 8 }]}>
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.giftContainer}>
              <Text style={styles.inputLabel}>{t('checkout.recipient_name_placeholder')}</Text>
              <TextInput
                style={styles.textInputProminent}
                placeholder="e.g. John Doe"
                value={recipientName}
                onChangeText={setRecipientName}
                placeholderTextColor="#9CA3AF"
              />
              
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>{t('checkout.recipient_phone_placeholder')}</Text>
              <TextInput
                style={styles.textInputProminent}
                placeholder="e.g. 03XXXXXXXXX"
                value={recipientPhone}
                onChangeText={setRecipientPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        )}

        {/* Order Details/Summary Section (PROMOTED ABOVE PAYMENT) */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>{t('checkout.order_summary')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartItems.length} {cartItems.length === 1 ? t('checkout.item') : t('checkout.items')}</Text>
            </View>
          </View>
        </View>

        {/* Item List Header Removed - redundant now */}
        {filteredItems.map((item) => (
          <View key={`${item.id}-${getCartItemKey(item.id, item.selectedOptions)}`} style={styles.itemCard}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemContent}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemRestaurant}>{item.restaurantName}</Text>
              <View style={styles.tagContainer}>
                <View style={styles.capsuleTag}>
                  <Text style={styles.tagText}>{t('checkout.qty')}: {item.quantity}</Text>
                </View>
                {item.selectedOptions?.map((opt: any, idx: number) => (
                  <View key={idx} style={styles.capsuleTag}>
                    <Text style={styles.tagText}>
                      {opt.name} {opt.priceAdjustment > 0 ? `(+${formatPrice(opt.priceAdjustment, restaurantCurrency)})` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.itemPriceContainer}>
              <Text style={styles.itemPrice}>
                {formatPrice(
                  calculateItemSubtotal(item.price, item.quantity, item.selectedOptions), 
                  restaurantCurrency
                )}
              </Text>
            </View>
          </View>
        ))}

        {/* Cost Breakdown Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryLabel}>{t('checkout.subtotal')}</Text>
            <Text style={styles.summaryValueText}>{formatPrice(subtotal, restaurantCurrency)}</Text>
          </View>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryLabel}>{t('checkout.delivery_fee')}</Text>
            <Text style={styles.summaryValueText}>{formatPrice(deliveryFee, restaurantCurrency)}</Text>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>{t('checkout.total')}</Text>
            <Text style={styles.totalValueText}>{formatPrice(finalTotal, restaurantCurrency)}</Text>
          </View>
        </View>

        {/* Payment Method Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('checkout.payment_method')}</Text>
        </View>

        <TouchableOpacity
          style={[styles.paymentCard, paymentMethod === 'card' && styles.activePaymentCard]}
          onPress={() => setPaymentMethod('card')}
          activeOpacity={0.9}
        >
          <View style={styles.paymentIconBox}>
            <MaterialCommunityIcons name="credit-card-outline" size={22} color="#1F2937" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentCardLabel}>{t('checkout.credit_debit_card')}</Text>
            <Text style={styles.paymentCardSub}>Visa •••• 4242</Text>
          </View>
          <View style={[styles.radioOuter, paymentMethod === 'card' && styles.radioOuterSelected]}>
            {paymentMethod === 'card' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.paymentCard, paymentMethod === 'cod' && styles.activePaymentCard]}
          onPress={() => setPaymentMethod('cod')}
          activeOpacity={0.9}
        >
          <View style={styles.paymentIconBox}>
            <MaterialCommunityIcons name="cash" size={22} color="#1F2937" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentCardLabel}>{t('checkout.cash_on_delivery')}</Text>
            <Text style={styles.paymentCardSub}>{t('checkout.cod_description')}</Text>
          </View>
          <View style={[styles.radioOuter, paymentMethod === 'cod' && styles.radioOuterSelected]}>
            {paymentMethod === 'cod' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Footer / Place Order Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {isRestaurantClosed && (
          <View style={styles.closedWarningBar}>
            <Ionicons name="warning" size={16} color="#B45309" />
            <Text style={styles.closedWarningText}>
              {t('checkout.restaurant_closed_for_delivery', { defaultValue: 'Restaurant is currently not accepting deliveries' })}
            </Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>{t('checkout.total_to_pay')}</Text>
            <Text style={styles.totalAmount}>{formatPrice(finalTotal, restaurantCurrency)}</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.placeOrderButton,
              (loading || isRestaurantClosed) && styles.disabledButton
            ]} 
            onPress={handlePlaceOrder}
            disabled={loading || isRestaurantClosed}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.placeOrderText}>{t('checkout.place_order')}</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <OrderSuccessModal
        isVisible={showSuccessModal}
        orderId={lastOrderId || undefined}
        onTrack={() => {
          setShowSuccessModal(false);
          // Navigate to tracking and reset stack to ensure "Back" goes to Home
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
          // After reset, navigate to OrderDetails
          if (lastOrderId) {
            // @ts-ignore - navigation typing can be tricky with reset
            navigation.navigate('OrderDetails', { 
              order: { id: lastOrderId, restaurantId: cartItems[0]?.restaurantId } 
            });
          }
        }}
        onHome={() => {
          setShowSuccessModal(false);
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        }}
      />
    </SafeAreaView>
  );
}

export default CheckoutScreen;
