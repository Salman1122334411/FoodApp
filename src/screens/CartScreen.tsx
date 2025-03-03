import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useCart } from "../hooks/useCart";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import cuid from "cuid";
import { getDistance } from "../utils/geo"; // Make sure this utility is available
interface Address {
  id: string;
  label: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export function CartScreen({ navigation }: { navigation: any }) {
  const { cartItems, removeFromCart, clearCart, addToCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({});
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    streetAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phoneNumber?: string;
  }>({});

  useEffect(() => {
    fetchAddresses();
  }, []);

  const validateAddress = () => {
    const errors: typeof validationErrors = {};

    // Street Address validation
    if (!newAddress.streetAddress?.trim()) {
      errors.streetAddress = "Street address is required";
    }

    // City validation
    if (!newAddress.city?.trim()) {
      errors.city = "City is required";
    }

    // State validation
    if (!newAddress.state?.trim()) {
      errors.state = "State is required";
    } else if (!/^[A-Za-z\s]{2,50}$/.test(newAddress.state.trim())) {
      errors.state = "State must be a valid name (e.g., Pakistan, India)";
    }

    // Zip code validation
    if (!newAddress.zipCode?.trim()) {
      errors.zipCode = "Postal code is required";
    } else if (!/^\d{5}(-\d{4})?$/.test(newAddress.zipCode.trim())) {
      errors.zipCode = "Invalid postal code format";
    }

    if (!newAddress.phoneNumber?.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (!/^\d{11}$/.test(newAddress.phoneNumber.trim())) {
      errors.phoneNumber = "Phone number must be exactly 11 digits long";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchAddresses = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      const { data, error } = await supabase
        .from("Address")
        .select(
          "id, label, streetAddress, city, state, zipCode, phoneNumber, latitude, longitude, isDefault"
        )
        .eq("userId", user.id)
        .order("isDefault", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
      if (data && data.length > 0) {
        const defaultAddress = data.find((addr) => addr.isDefault) || data[0];
        setSelectedAddress(defaultAddress);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      Alert.alert("Error", "Failed to load addresses");
    }
  };

  // Group items by restaurantId
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

  // Check if cart has items from more than one restaurant
  const multipleRestaurants = Object.keys(groupedItems).length > 1;

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    // Prevent checkout if items from multiple restaurants are present
    if (multipleRestaurants) {
      Alert.alert(
        "Order Restriction",
        "You can only order items from one restaurant at a time. Please remove items from other restaurants."
      );
      return;
    }

    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      let deliveryAddress = selectedAddress;

      // Handle new address if enabled
      if (useNewAddress) {
        if (!validateAddress()) {
          Alert.alert(
            "Validation Error",
            "Please correct the address information"
          );
          return;
        }
        const currentTimestamp = new Date().toISOString();
        // Insert new address
        const { data: addressData, error: addressError } = await supabase
          .from("Address")
          .insert([
            {
              id: cuid(),
              userId: user.id,
              label: newAddress.label || "Home",
              streetAddress: newAddress.streetAddress,
              city: newAddress.city,
              state: newAddress.state,
              zipCode: newAddress.zipCode,
              phoneNumber: newAddress.phoneNumber,
              latitude: newAddress.latitude || null,
              longitude: newAddress.longitude || null,
              isDefault: newAddress.isDefault || false,
              updatedAt: currentTimestamp,
            },
          ])
          .select()
          .single();

        if (addressError) throw addressError;
        deliveryAddress = addressData;
      }

      if (!deliveryAddress) {
        Alert.alert("Error", "Please select or add a delivery address");
        return;
      }
      const restaurantId = Object.keys(groupedItems)[0];
      // Fetch restaurant details (including its location)
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("Restaurant")
        .select("id, latitude, longitude")
        .eq("id", restaurantId)
        .single();

      if (restaurantError || !restaurantData) {
        throw new Error("Failed to fetch restaurant data");
      }
      // Ensure both the address and restaurant have valid coordinates.
      if (
        !deliveryAddress.latitude ||
        !deliveryAddress.longitude ||
        !restaurantData.latitude ||
        !restaurantData.longitude
      ) {
        Alert.alert(
          "Invalid Address Error",
          "Missing location information for the address or restaurant."
        );
        return;
      }

      // Calculate the distance using the utility function.
      const distance = getDistance(
        deliveryAddress.latitude,
        deliveryAddress.longitude,
        restaurantData.latitude,
        restaurantData.longitude
      );

      // If the address is too far (e.g., more than 10 km), show a modal alert.
      if (distance > 10) {
        Alert.alert(
          "Address Out of Range",
          "The current location selected does not have that restaurant available in its area. Please choose a different address."
        );
        return;
      }
      // Proceed to checkout if only one restaurant's items are in the cart
      navigation.navigate("CheckoutScreen", {
        deliveryAddress, // Pass the selected address info
      });
    } catch (error) {
      console.error("Checkout preparation error:", error);
      Alert.alert("Error", "Failed to proceed to checkout");
    } finally {
      setLoading(false);
    }
  };

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
        {/* Restaurant Items Section */}
        {Object.entries(groupedItems).map(([restaurantId, { name, items }]) => (
          <View key={restaurantId} style={styles.restaurantSection}>
            <Text style={styles.restaurantName}>{name}</Text>
            {items.map((item) => (
              <View key={item.name} style={styles.cartItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
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

        {/* If items are from multiple restaurants, show an error message */}
        {multipleRestaurants && (
          <Text style={styles.restrictionText}>
            You can only order items from one restaurant at a time. Please
            remove items from other restaurants.
          </Text>
        )}

        {/* Address Section */}
        <View style={styles.addressSection}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>

          <TouchableOpacity
            style={styles.addressOption}
            onPress={() => {
              setUseNewAddress(false);
            }}
          >
            <Ionicons name="location-outline" size={24} color="#FF4B2B" />
            <Text style={styles.addressOptionText}>Manage Saved Addresses</Text>
          </TouchableOpacity>
          {addresses.length === 0 && !useNewAddress && (
              <Text style={styles.noAddressMessage}>
                No saved addresses available.
              </Text>
            )}
          {addresses.length > 0 && !useNewAddress && (
            <View style={styles.savedAddresses}>
              {addresses.map((address) => (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressCard,
                    selectedAddress?.id === address.id &&
                      styles.selectedAddress,
                  ]}
                  onPress={() => {
                    setSelectedAddress(address);
                    setUseNewAddress(false);
                  }}
                >
                  <Text style={styles.addressText}>
                    {address.label}: {address.streetAddress}
                  </Text>
                  <Text style={styles.addressText}>
                    {address.city}, {address.state} {address.zipCode}
                  </Text>
                  <Text style={styles.addressText}>
                    Phone: {address.phoneNumber}
                  </Text>
                  {address.isDefault && (
                    <Text style={styles.defaultBadge}>Default</Text>
                  )}
                </TouchableOpacity>
              ))}
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
            onPress={() => {
              if (multipleRestaurants) {
                Alert.alert(
                  "Order Restriction",
                  "You can only order items from one restaurant at a time. Please remove items from other restaurants."
                );
              } else {
                handleCheckout();
              }
            }}
            disabled={loading || (!selectedAddress && !useNewAddress)}
          >
            <Text style={styles.checkoutButtonText}>
              {loading ? "Processing..." : "Place Order"}
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
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  restaurantSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: "#1F2937",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF4B2B",
    marginTop: 4,
  },
  noAddressMessage: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    overflow: "hidden",
  },
  quantityButton: {
    padding: 8,
    width: 36,
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: 18,
    color: "#FF4B2B",
    fontWeight: "bold",
  },
  quantity: {
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  addressSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  addressOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: "#FEE2E2",
  },
  addressOptionText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#1F2937",
  },
  savedAddresses: {
    marginVertical: 12,
  },
  addressCard: {
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedAddress: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FF4B2B",
    borderWidth: 1,
  },
  addressText: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 4,
  },
  defaultBadge: {
    color: "#FF4B2B",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  form: {
    gap: 12,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalText: {
    fontSize: 18,
    color: "#1F2937",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF4B2B",
  },
  checkoutButton: {
    backgroundColor: "#FF4B2B",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  inputError: {
    borderColor: "red",
    borderWidth: 1,
  },
  restrictionText: {
    fontSize: 16,
    color: "#FF4B2B",
    textAlign: "center",
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 5,
  },
});
