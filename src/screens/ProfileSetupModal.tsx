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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import cuid from 'cuid';
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
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) =>
    (1900 + i).toString()
  );
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const [selectedDay, setSelectedDay] = useState("1");
  const [selectedMonth, setSelectedMonth] = useState("1");
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  // Address fields (for default address)
  const [addressLabel, setAddressLabel] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [addressPhoneNumber, setAddressPhoneNumber] = useState("");

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

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

  // Validate all fields. Returns true if valid; otherwise, sets errors.
  const validateFields = (): boolean => {
    const errors: ValidationErrors = {};
    // Profile validations
    if (!name.trim()) {
      errors.name = "Name is required.";
    }
    if (!phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required.";
    }
    // Validate DOB by creating a date
    const dobDate = new Date(
      Number(selectedYear),
      Number(selectedMonth) - 1,
      Number(selectedDay)
    );
    if (isNaN(dobDate.getTime())) {
      errors.dob = "Please select a valid date of birth.";
    }
    // Address validations
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
    } else if (!/^\d{11}$/.test(addressPhoneNumber.trim())) {
      errors.addressPhoneNumber =
        "Address phone number must be exactly 11 digits.";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      // Validation errors exist. Do not continue.
      return;
    }
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Combine day, month, and year into a date.
      const dobDate = new Date(
        Number(selectedYear),
        Number(selectedMonth) - 1,
        Number(selectedDay)
      );

      // Upsert the user profile.
      const { error: userError } = await supabase.from("User").upsert({
        id: user.id,
        email: email,
        name: name,
        phoneNumber: phoneNumber,
        dob: dobDate.toISOString(),
        updatedAt: new Date().toISOString(),
      });
      if (userError) throw userError;

      // Insert the default address.
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile & Address Setup</Text>

      {/* Profile Section */}
      <Text style={styles.sectionTitle}>Profile Information</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} editable={false} />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
        />
        {validationErrors.name && (
          <Text style={styles.errorText}>{validationErrors.name}</Text>
        )}
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />
        {validationErrors.phoneNumber && (
          <Text style={styles.errorText}>{validationErrors.phoneNumber}</Text>
        )}
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date of Birth</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedDay}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedDay(itemValue)}
          >
            {days.map((day) => (
              <Picker.Item key={day} label={day} value={day} />
            ))}
          </Picker>
          <Picker
            selectedValue={selectedMonth}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedMonth(itemValue)}
          >
            {months.map((month) => (
              <Picker.Item key={month} label={month} value={month} />
            ))}
          </Picker>
          <Picker
            selectedValue={selectedYear}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedYear(itemValue)}
          >
            {years.map((year) => (
              <Picker.Item key={year} label={year} value={year} />
            ))}
          </Picker>
        </View>
        {validationErrors.dob && (
          <Text style={styles.errorText}>{validationErrors.dob}</Text>
        )}
      </View>

      {/* Address Section */}
      <Text style={styles.sectionTitle}>Default Address</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Label</Text>
        <TextInput
          style={styles.input}
          value={addressLabel}
          onChangeText={setAddressLabel}
          placeholder="e.g., Home"
        />
        {validationErrors.addressLabel && (
          <Text style={styles.errorText}>{validationErrors.addressLabel}</Text>
        )}
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Street Address</Text>
        <TextInput
          style={styles.input}
          value={streetAddress}
          onChangeText={setStreetAddress}
          placeholder="Enter street address"
        />
        {validationErrors.streetAddress && (
          <Text style={styles.errorText}>{validationErrors.streetAddress}</Text>
        )}
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>City</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="Enter city"
        />
        {validationErrors.city && (
          <Text style={styles.errorText}>{validationErrors.city}</Text>
        )}
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>State</Text>
        <TextInput
          style={styles.input}
          value={stateField}
          onChangeText={setStateField}
          placeholder="Enter state"
        />
        {validationErrors.state && (
          <Text style={styles.errorText}>{validationErrors.state}</Text>
        )}
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Zip Code</Text>
        <TextInput
          style={styles.input}
          value={zipCode}
          onChangeText={setZipCode}
          placeholder="Enter zip code"
          keyboardType="numeric"
        />
        {validationErrors.zipCode && (
          <Text style={styles.errorText}>{validationErrors.zipCode}</Text>
        )}
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Address Phone Number</Text>
        <TextInput
          style={styles.input}
          value={addressPhoneNumber}
          onChangeText={setAddressPhoneNumber}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
        {validationErrors.addressPhoneNumber && (
          <Text style={styles.errorText}>
            {validationErrors.addressPhoneNumber}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginVertical: 10,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  pickerContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  saveButton: {
    backgroundColor: "#FF4B2B",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    marginTop: 5,
    fontSize: 14,
  },
});

export default ProfileSetupModal;
