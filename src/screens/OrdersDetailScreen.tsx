import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  deliveryAddress: string;
  driverId: string | null;
  assignedDriver: string | null;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  estimatedTime: number | null;
  actualTime: number | null;
  driverRating: number | null;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  restaurant: string;
}

export function OrderDetailsScreen({ route }: { route: { params: { order: Order } } }) {
  const { order } = route.params;

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'PENDING': return '#FCD34D';
      case 'CONFIRMED': return '#60A5FA';
      case 'PREPARING': return '#818CF8';
      case 'READY': return '#34D399';
      case 'DELIVERED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusSteps = () => {
    const steps = [
      { status: 'PENDING', label: 'Order Placed', icon: 'receipt-outline' },
      { status: 'CONFIRMED', label: 'Order Confirmed', icon: 'checkmark-circle-outline' },
      { status: 'PREPARING', label: 'Preparing', icon: 'restaurant-outline' },
      { status: 'READY', label: 'Ready for Delivery', icon: 'bicycle-outline' },
      { status: 'DELIVERED', label: 'Delivered', icon: 'checkmark-done-circle-outline' },
    ];

    const currentStepIndex = steps.findIndex(step => step.status === order.status);
    return steps.map((step, index) => ({
      ...step,
      isCompleted: index <= currentStepIndex && order.status !== 'CANCELLED',
      isCurrent: index === currentStepIndex,
    }));
  };

  const handleSupport = () => {
    Linking.openURL('tel:+1234567890');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Order Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      {/* Order Progress */}
      {order.status !== 'CANCELLED' && (
        <View style={styles.progressContainer}>
          {getStatusSteps().map((step, index) => (
            <View key={step.status} style={styles.stepContainer}>
              <View style={styles.stepIconContainer}>
                <View
                  style={[
                    styles.stepLine,
                    index === 0 ? styles.stepLineHidden : null,
                    step.isCompleted ? styles.stepLineCompleted : null,
                  ]}
                />
                <View
                  style={[
                    styles.stepIcon,
                    step.isCompleted ? styles.stepIconCompleted : null,
                    step.isCurrent ? styles.stepIconCurrent : null,
                  ]}
                >
                  <Ionicons
                    name={step.icon as any}
                    size={20}
                    color={step.isCompleted || step.isCurrent ? '#fff' : '#9CA3AF'}
                  />
                </View>
                <View
                  style={[
                    styles.stepLine,
                    index === getStatusSteps().length - 1 ? styles.stepLineHidden : null,
                    step.isCompleted ? styles.stepLineCompleted : null,
                  ]}
                />
              </View>
              <Text style={[styles.stepLabel, step.isCurrent ? styles.stepLabelCurrent : null]}>
                {step.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Restaurant Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Restaurant</Text>
        <View style={styles.restaurantInfo}>
          <Ionicons name="restaurant-outline" size={24} color="#4B5563" />
          <Text style={styles.restaurantName}>{order.restaurant}</Text>
        </View>
      </View>

<View style={styles.section}>
  <Text style={styles.sectionTitle}>Delivery Address</Text>
  <View style={styles.addressContainer}>
    <Ionicons name="location-outline" size={24} color="#4B5563" />
    <Text style={styles.address}>
      {/* Parse the JSON string */}
      {order.deliveryAddress
        ? (() => {
            const address = JSON.parse(order.deliveryAddress);
            return `${address.label} - ${address.street_address}, ${address.city}, ${address.state} `;
          })()
        : 'No address provided'}
    </Text>
  </View>
</View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.orderItems.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <View style={styles.orderItemInfo}>
              <Text style={styles.orderItemQuantity}>{item.quantity}x</Text>
              <Text style={styles.orderItemName}>{item.name}</Text>
            </View>
            <Text style={styles.orderItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>${order.totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      {/* Support Button */}
      <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
        <Ionicons name="call-outline" size={24} color="#FF4B2B" />
        <Text style={styles.supportButtonText}>Contact Support</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  orderDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  stepNumberWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepNumberCompleted: {
    backgroundColor: '#10B981',
  },
  stepNumberCurrent: {
    backgroundColor: '#FF4B2B',
  },
  stepNumberText: {
    fontSize: 18,
    color: '#6B7280',
  },
  stepNumberTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: -4,
  },
  stepLineCompleted: {
    backgroundColor: '#10B981',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 4,
    width: '100%',
  },
  stepLabelCurrent: {
    color: '#FF4B2B',
    fontWeight: '600',
  },
  stepLabelCompleted: {
    color: '#10B981',
    fontWeight: '500',
  },
  stepContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  stepIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  stepLineHidden: {
    backgroundColor: 'transparent',
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  stepIconCompleted: {
    backgroundColor: '#10B981',
  },
  stepIconCurrent: {
    backgroundColor: '#FF4B2B',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 16,
    color: '#4B5563',
    marginLeft: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  address: {
    flex: 1,
    fontSize: 16,
    color: '#4B5563',
    marginLeft: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderItemQuantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4B2B',
    marginRight: 8,
  },
  orderItemName: {
    fontSize: 16,
    color: '#4B5563',
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4B2B',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 24,
    backgroundColor: '#FFF1F0',
    borderRadius: 12,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4B2B',
    marginLeft: 8,
  },
});