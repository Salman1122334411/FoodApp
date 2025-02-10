import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CircularProgress } from "../../components/CircularProgress";

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
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PREPARING"
    | "READY"
    | "DELIVERED"
    | "CANCELLED";
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

export function OrderDetailsScreen({
  route,
}: {
  route: { params: { order: Order } };
}) {
  const { order } = route.params;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Define the steps for order progress
  const steps = [
    { status: "PENDING", label: "Order Placed", icon: "receipt-outline" },
    { status: "CONFIRMED", label: "Order Confirmed", icon: "checkmark-circle-outline" },
    { status: "PREPARING", label: "Preparing", icon: "restaurant-outline" },
    { status: "READY", label: "Ready for Delivery", icon: "bicycle-outline" },
    { status: "DELIVERED", label: "Delivered", icon: "checkmark-done-circle-outline" },
  ];

  // Compute which step is current based on order.status
  const currentStepIndex = steps.findIndex((step) => step.status === order.status);

  // If the order is CONFIRMED, we want to show 0% progress (and red), otherwise compute normally.
  const computedProgress =
    order.status === "CANCELLED"
      ? 0
      : currentStepIndex !== -1
      ? Math.round((currentStepIndex / (steps.length - 1)) * 100)
      : 0;

  // Choose progress color: red if CONFIRMED, otherwise blue.
  const progressColor = order.status === "CONFIRMED" ? "#FF0000" : "#4A90E2";

  const getStatusSteps = () => {
    return steps.map((step, index) => ({
      ...step,
      isCompleted: index < currentStepIndex,
      isCurrent: index === currentStepIndex,
    }));
  };

  const handleSupport = () => {
    Linking.openURL("tel:+1234567890");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <CircularProgress
          progress={computedProgress}
          size={120}
          strokeWidth={10}
          color={progressColor}
        />
        <Text style={styles.statusLabel}>{order.status}</Text>
      </View>

      <View style={styles.timeline}>
        {getStatusSteps().map((step, index) => (
          <View key={step.status} style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View
                style={[
                  styles.timelineDot,
                  step.isCurrent && styles.timelineDotActive,
                  step.isCompleted && styles.timelineDotCompleted,
                ]}
              >
                <Ionicons
                  name={step.icon as any}
                  size={16}
                  color={step.isCurrent ? "#fff" : "#9CA3AF"}
                />
              </View>
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.timelineLine,
                    step.isCompleted && styles.timelineLineCompleted,
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                styles.timelineLabel,
                step.isCurrent && styles.timelineLabelActive,
              ]}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Additional Order Details Below (Restaurant, Delivery Address, Order Items, etc.) */}
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
            {order.deliveryAddress
              ? (() => {
                  const address = JSON.parse(order.deliveryAddress);
                  return `${address.label} - ${address.street_address}, ${address.city}, ${address.state}`;
                })()
              : "No address provided"}
          </Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.orderItems.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <View style={styles.orderItemInfo}>
              <Text style={styles.orderItemQuantity}>{item.quantity}x</Text>
              <Text style={styles.orderItemName}>{item.name}</Text>
            </View>
            <Text style={styles.orderItemPrice}>
              ${(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>
            ${order.totalAmount.toFixed(2)}
          </Text>
        </View>
      </View>

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
    backgroundColor: "#fff",
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  orderDate: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FCD34D",
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  progressSection: {
    padding: 24,
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4A90E2",
    marginTop: 12,
    textTransform: "uppercase",
  },
  timeline: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  timelineLeft: {
    alignItems: "center",
    marginRight: 16,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  timelineDotActive: {
    backgroundColor: "#FF4B2B",
  },
  timelineDotCompleted: {
    backgroundColor: "#10B981",
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: "#EAEAEA",
  },
  timelineLineCompleted: {
    backgroundColor: "#10B981",
  },
  timelineLabel: {
    fontSize: 14,
    color: "#666666",
    marginTop: 6,
  },
  timelineLabelActive: {
    color: "#1A1A1A",
    fontWeight: "500",
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