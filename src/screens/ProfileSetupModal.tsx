import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { supabase } from "../lib/supabase";
import { Calendar, ChevronDown, MapPin, Phone, User } from "lucide-react-native";
import cuid from "cuid";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocation } from "../hooks/useLocation"; // Added location hook

interface ProfileSetupModalProps {
  onProfileSetupSuccess: () => void;
}

interface ValidationErrors {
  name?: string;
  phoneNumber?: string;
  dob?: string;
  addressLabel?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  addressPhoneNumber?: string;
}

const ProfileSetupModal = ({ onProfileSetupSuccess }: ProfileSetupModalProps) => {
  // Profile fields
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Date of Birth fields
  const [dob, setDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Address fields (for default address)
  const [addressLabel, setAddressLabel] = useState("");
  // The location details will be auto-fetched but can be edited manually if needed.
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [addressPhoneNumber, setAddressPhoneNumber] = useState("");
  // To store coordinates from useLocation
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);

  // Flag to toggle manual entry if auto-location fails/is not working.
  const [manualMode, setManualMode] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [activeSection, setActiveSection] = useState<"profile" | "address">("profile");

  // useLocation hook for fetching current location
  const { fetchLocation, currentLocation, coords } = useLocation();

  useEffect(() => {
    fetchUserEmail();
  }, []);

  const fetchUserEmail = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email || "");
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dob;
    setShowDatePicker(Platform.OS === "ios");
    setDob(currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Validate profile section
  const validateProfileSection = (): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!name.trim()) {
      errors.name = "Name is required.";
    }
    if (!phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required.";
    } else if (!/^\d{10,11}$/.test(phoneNumber.trim())) {
      errors.phoneNumber = "Phone number must be 10-11 digits.";
    }
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    if (age < -1) {
      errors.dob = "You must be at least 13 years old.";
    }
    return errors;
  };

  // Validate address section (both for auto-fetched and manual mode)
  const validateAddressSection = (): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!addressLabel.trim()) {
      errors.addressLabel = "Address label is required.";
    }
    if (!streetAddress.trim()) {
      errors.streetAddress = "Street address is required.";
    }
    if (!city.trim()) {
      errors.city = "City is required.";
    }
    if (!stateField.trim()) {
      errors.state = "State is required.";
    } else if (!/^[A-Za-z\s]+$/.test(stateField.trim())) {
      errors.state = "State must contain only letters and spaces.";
    }
    if (!zipCode.trim()) {
      errors.zipCode = "Zip Code is required.";
    } else if (!/^\d{5}(-\d{4})?$/.test(zipCode.trim())) {
      errors.zipCode = "Invalid zip code format.";
    }
    if (!addressPhoneNumber.trim()) {
      errors.addressPhoneNumber = "Address phone number is required.";
    } else if (!/^\d{10,11}$/.test(addressPhoneNumber.trim())) {
      errors.addressPhoneNumber = "Address phone number must be 10-11 digits.";
    }
    return errors;
  };

  // When the address tab is active and auto mode is enabled, fetch current location.
  useEffect(() => {
    if (activeSection === "address" && !manualMode) {
      setLoadingLocation(true);
      fetchLocation()
        .catch((error) => {
          console.error("Location fetch error:", error);
          Alert.alert("Error", "Failed to fetch current location");
        })
        .finally(() => {
          setLoadingLocation(false);
        });
    }
  }, [activeSection, manualMode, fetchLocation]);

  // Update auto location fields when currentLocation and coords update.
  useEffect(() => {
    if (
      activeSection === "address" &&
      !manualMode &&
      currentLocation &&
      coords &&
      !currentLocation.includes("Error") &&
      currentLocation !== "Fetching current location..."
    ) {
      const parts = currentLocation.split(",");
      setStreetAddress(parts[0] ? parts[0].trim() : "");
      setCity(parts[1] ? parts[1].trim() : "");
      setStateField(parts[2] ? parts[2].trim() : "");
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
    }
  }, [currentLocation, coords, activeSection, manualMode]);

  const handleSave = async () => {
    if (activeSection === "profile") {
      // Validate only profile fields
      const profileErrors = validateProfileSection();
      if (Object.keys(profileErrors).length > 0) {
        setValidationErrors(profileErrors);
        return; // Stay on profile tab if errors exist
      } else {
        setValidationErrors({});
        setActiveSection("address");
        return;
      }
    } else if (activeSection === "address") {
      // Validate both profile and address fields
      const profileErrors = validateProfileSection();
      const addressErrors = validateAddressSection();
      const combinedErrors = { ...profileErrors, ...addressErrors };
      if (Object.keys(combinedErrors).length > 0) {
        setValidationErrors(combinedErrors);
        if (Object.keys(profileErrors).length > 0) {
          setActiveSection("profile");
        }
        return;
      }
    }

    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Upsert the user profile.
      const { error: userError } = await supabase.from("User").upsert({
        id: user.id,
        email: email,
        name: name,
        phoneNumber: phoneNumber,
        dob: dob.toISOString(),
        updatedAt: new Date().toISOString(),
      });
      if (userError) throw userError;

      // Insert the default address.
      // When in manual mode, lat & long are stored as 0.
      const { error: addressError } = await supabase.from("Address").insert({
        id: cuid(),
        userId: user.id,
        label: addressLabel,
        streetAddress: streetAddress,
        city: city,
        state: stateField,
        zipCode: zipCode,
        phoneNumber: addressPhoneNumber,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        latitude: manualMode ? 1 : latitude,
        longitude: manualMode ? 1 : longitude,
      });
      if (addressError) throw addressError;

      Alert.alert("Success", "Profile and address updated successfully");
      onProfileSetupSuccess();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (

    
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.title}>Complete Your Profile</Text>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeSection === "profile" && styles.activeTab]}
            onPress={() => setActiveSection("profile")}
          >
            <User size={18} color={activeSection === "profile" ? "#FF4B2B" : "#666"} />
            <Text style={[styles.tabText, activeSection === "profile" && styles.activeTabText]}>
              Profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeSection === "address" && styles.activeTab]}
            onPress={() => setActiveSection("address")}
          >
            <MapPin size={18} color={activeSection === "address" ? "#FF4B2B" : "#666"} />
            <Text style={[styles.tabText, activeSection === "address" && styles.activeTabText]}>
              Address
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {activeSection === "profile" ? (
            <>
              {/* Profile Section */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <TextInput style={styles.input} value={email} editable={false} />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                  />
                </View>
                {validationErrors.name && <Text style={styles.errorText}>{validationErrors.name}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={18} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIcon}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                  />
                </View>
                {validationErrors.phoneNumber && (
                  <Text style={styles.errorText}>{validationErrors.phoneNumber}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity style={styles.datePickerButton} onPress={showDatepicker}>
                  <Calendar size={18} color="#666" style={styles.inputIcon} />
                  <Text style={styles.dateText}>{formatDate(dob)}</Text>
                  <ChevronDown size={18} color="#666" />
                </TouchableOpacity>
                {validationErrors.dob && <Text style={styles.errorText}>{validationErrors.dob}</Text>}
              </View>

              {showDatePicker && (
                <Modal transparent={true} visible={showDatePicker} animationType="fade">
                  <Pressable style={styles.datePickerModalOverlay} onPress={() => setShowDatePicker(false)}>
                    <View style={styles.datePickerContainer}>
                      <View style={styles.datePickerHeader}>
                        <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                          <Text style={styles.datePickerDoneBtn}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        testID="dateTimePicker"
                        value={dob}
                        mode="date"
                        display="spinner"
                        onChange={onDateChange}
                        style={styles.datePicker}
                        maximumDate={new Date()}
                      />
                    </View>
                  </Pressable>
                </Modal>
              )}
            </>
          ) : (
            <>
              {/* Address Section */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Address Label</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={addressLabel}
                    onChangeText={setAddressLabel}
                    placeholder="e.g., Home, Work"
                  />
                </View>
                {validationErrors.addressLabel && (
                  <Text style={styles.errorText}>{validationErrors.addressLabel}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Zip Code</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={zipCode}
                    onChangeText={setZipCode}
                    placeholder="Enter zip code"
                    keyboardType="numeric"
                  />
                </View>
                {validationErrors.zipCode && <Text style={styles.errorText}>{validationErrors.zipCode}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Address Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={18} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIcon}
                    value={addressPhoneNumber}
                    onChangeText={setAddressPhoneNumber}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />
                </View>
                {validationErrors.addressPhoneNumber && (
                  <Text style={styles.errorText}>{validationErrors.addressPhoneNumber}</Text>
                )}
              </View>

              {!manualMode ? (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Current Location</Text>
                  {loadingLocation ? (
                    <ActivityIndicator color="#FF4B2B" />
                  ) : (
                    <Text style={styles.locationText}>
                      {streetAddress
                        ? `${streetAddress}, ${city}, ${stateField}`
                        : "Unable to fetch location"}
                    </Text>
                  )}
                </View>
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Street Address</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={streetAddress}
                        onChangeText={setStreetAddress}
                        placeholder="Enter street address"
                      />
                    </View>
                    {validationErrors.streetAddress && (
                      <Text style={styles.errorText}>{validationErrors.streetAddress}</Text>
                    )}
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>City</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="Enter city"
                      />
                    </View>
                    {validationErrors.city && <Text style={styles.errorText}>{validationErrors.city}</Text>}
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>State</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={stateField}
                        onChangeText={setStateField}
                        placeholder="Enter state"
                      />
                    </View>
                    {validationErrors.state && <Text style={styles.errorText}>{validationErrors.state}</Text>}
                  </View>
                </>
              )}

              <TouchableOpacity
                onPress={() => setManualMode(!manualMode)}
                style={styles.manualToggleButton}
              >
                <Text style={styles.manualToggleButtonText}>
                  {manualMode ? "Use current location" : "Can't fetch location? Enter manually"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {activeSection === "profile" ? "Continue to Address" : "Complete Setup"}
            </Text>
          )}
        </TouchableOpacity>

        {activeSection === "profile" && (
          <TouchableOpacity style={styles.skipButton} onPress={() => setActiveSection("address")}>
            <Text style={styles.skipButtonText}>Skip to Address</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 500,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: "90%",
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    padding: 5,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "#FF4B2B",
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: "#333",
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  inputIcon: {
    marginLeft: 12,
  },
  inputWithIcon: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#333",
    paddingLeft: 8,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 8,
  },
  datePickerModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 20,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  datePickerDoneBtn: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF4B2B",
  },
  datePicker: {
    width: "100%",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: "#FF4B2B",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    padding: 15,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#666",
    fontSize: 14,
  },
  errorText: {
    color: "#FF3B30",
    marginTop: 5,
    fontSize: 12,
    fontWeight: "500",
  },
  manualToggleButton: {
    marginTop: 10,
    alignItems: "center",
  },
  manualToggleButtonText: {
    color: "#FF4B2B",
    textDecorationLine: "underline",
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    marginTop: 5,
  },
});

export default ProfileSetupModal;