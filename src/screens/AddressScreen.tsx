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
import { useAddress } from '../hooks/useAddress';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../hooks/useLocation'; // Import your useLocation hook

interface Address {
  id: string;
  userId: string;
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

export function AddressScreen() {
  const {
    addresses,
    loading,
    fetchAddresses,
    addAddress,
    setDefaultAddress,
    deleteAddress,
  } = useAddress();
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // State for "Save Current Location as Address"
  const [savingCurrentLocation, setSavingCurrentLocation] = useState(false);
  const [currentLocationAddress, setCurrentLocationAddress] = useState<Partial<Address>>({});

  // Get current location from useLocation hook
  const { location, fetchLocation } = useLocation();

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Validation function for manual address entry (all fields required)
  const validateAddress = () => {
    let errors: Record<string, string> = {};

    if (!newAddress.label?.trim()) {
      errors.label = 'Label is required';
    }
    if (!newAddress.streetAddress?.trim()) {
      errors.streetAddress = 'Street address is required';
    }
    if (!newAddress.city?.trim()) {
      errors.city = 'City is required';
    }
    if (!newAddress.state?.trim()) {
      errors.state = 'State is required';
    } else if (!/^[A-Za-z\s]+$/.test(newAddress.state.trim())) {
      errors.state = 'State must be a valid country name';
    }
    if (!newAddress.zipCode?.trim()) {
      errors.zipCode = 'Postal code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(newAddress.zipCode.trim())) {
      errors.zipCode = 'Invalid postal code format';
    }
    if (!newAddress.phoneNumber?.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{11}$/.test(newAddress.phoneNumber.trim())) {
      errors.phoneNumber = 'Phone number must be exactly 11 digits';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validation for current location address form (only label, zip code and phone required)
  const validateCurrentLocationAddress = () => {
    let errors: Record<string, string> = {};

    if (!currentLocationAddress.label?.trim()) {
      errors.label = 'Label is required';
    }
    if (!currentLocationAddress.zipCode?.trim()) {
      errors.zipCode = 'Postal code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(currentLocationAddress.zipCode.trim())) {
      errors.zipCode = 'Invalid postal code format';
    }
    if (!currentLocationAddress.phoneNumber?.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{11}$/.test(currentLocationAddress.phoneNumber.trim())) {
      errors.phoneNumber = 'Phone number must be exactly 11 digits';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAddress = async () => {
    if (!validateAddress()) return;

    try {
      await addAddress(newAddress);
      setAddingAddress(false);
      setNewAddress({});
      setValidationErrors({});
      Alert.alert('Success', 'Address added successfully');
    } catch (error) {
      console.error('Error adding address:', error);
      Alert.alert('Error', 'Failed to add address');
    }
  };

  // Called when user taps "Save Current Location as Address"
  const handleSaveCurrentLocation = async () => {
    try {
      await fetchLocation(); // trigger fetching of location
      // Wait a short time for the store to update (e.g. 500ms)
      setTimeout(() => {
        // Read the latest location from the store
        const loc = useLocation.getState().currentLocation;
        // Ensure loc is a valid formatted address
        if (
          loc &&
          !loc.includes('Error') &&
          !loc.includes('denied') &&
          loc !== 'Fetching current location...'
        ) {
          // Parse the formatted address string into parts
          const parts = loc.split(',');
          const street = parts[0] ? parts[0].trim() : '';
          const city = parts[1] ? parts[1].trim() : ''; // Use second part as city (or default)
          const state = parts[2] ? parts[2].trim() : ''; // Use third part as state (or default)
          setCurrentLocationAddress({
            ...currentLocationAddress,
            streetAddress: street,
            city: city,
            state: state,
          });
          setSavingCurrentLocation(true);
        } else {
          Alert.alert('Error', 'Failed to fetch current location');
        }
      }, 500);
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Error', 'Failed to fetch current location');
    }
  };

  const handleAddCurrentLocationAddress = async () => {
    if (!validateCurrentLocationAddress()) return;

    try {
      // Add the current location address (it may include blank values for non-required fields)
      // Ensure city and state are not null by providing empty strings if missing
      const finalAddress = {
        ...currentLocationAddress,
        city: currentLocationAddress.city || '',
        state: currentLocationAddress.state || '',
      };
      await addAddress(finalAddress);
      setSavingCurrentLocation(false);
      setCurrentLocationAddress({});
      setValidationErrors({});
      Alert.alert('Success', 'Current location saved successfully');
    } catch (error) {
      console.error('Error adding current location address:', error);
      Alert.alert('Error', 'Failed to add current location');
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Addresses</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setAddingAddress(!addingAddress)}>
            <Ionicons name="add-circle-outline" size={24} color="#FF4B2B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSaveCurrentLocation}>
            <Ionicons name="locate-outline" size={24} color="#FF4B2B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Form for manually adding an address */}
      {addingAddress && (
        <View style={styles.form}>
          <TextInput
            style={[styles.input, validationErrors.label && styles.inputError]}
            value={newAddress.label}
            onChangeText={(text) => setNewAddress({ ...newAddress, label: text })}
            placeholder="Label (e.g., Home)"
          />
          {validationErrors.label && <Text style={styles.errorText}>{validationErrors.label}</Text>}

          <TextInput
            style={[styles.input, validationErrors.streetAddress && styles.inputError]}
            value={newAddress.streetAddress}
            onChangeText={(text) => setNewAddress({ ...newAddress, streetAddress: text })}
            placeholder="Street Address"
          />
          {validationErrors.streetAddress && <Text style={styles.errorText}>{validationErrors.streetAddress}</Text>}

          <TextInput
            style={[styles.input, validationErrors.city && styles.inputError]}
            value={newAddress.city}
            onChangeText={(text) => setNewAddress({ ...newAddress, city: text })}
            placeholder="City"
          />
          {validationErrors.city && <Text style={styles.errorText}>{validationErrors.city}</Text>}

          <TextInput
            style={[styles.input, validationErrors.state && styles.inputError]}
            value={newAddress.state}
            onChangeText={(text) => {
              setNewAddress({ ...newAddress, state: text.toUpperCase() });
              setValidationErrors({ ...validationErrors, state: undefined });
            }}
            placeholder="State"
          />
          {validationErrors.state && <Text style={styles.errorText}>{validationErrors.state}</Text>}

          <TextInput
            style={[styles.input, validationErrors.zipCode && styles.inputError]}
            value={newAddress.zipCode}
            onChangeText={(text) => setNewAddress({ ...newAddress, zipCode: text })}
            placeholder="Zip Code"
            keyboardType="numeric"
          />
          {validationErrors.zipCode && <Text style={styles.errorText}>{validationErrors.zipCode}</Text>}

          <TextInput
            style={[styles.input, validationErrors.phoneNumber && styles.inputError]}
            value={newAddress.phoneNumber}
            onChangeText={(text) => {
              const cleanedText = text.replace(/\D/g, '');
              setNewAddress({ ...newAddress, phoneNumber: cleanedText });
              setValidationErrors({ ...validationErrors, phoneNumber: undefined });
            }}
            placeholder="Phone Number"
            keyboardType="phone-pad"
          />
          {validationErrors.phoneNumber && <Text style={styles.errorText}>{validationErrors.phoneNumber}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleAddAddress}>
            <Text style={styles.buttonText}>Add Address</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Form for saving current location as address */}
      {savingCurrentLocation && (
        <View style={styles.form}>
          <Text style={styles.formHeader}>Save Current Location</Text>
          {/* Display read-only location details (if available) */}
          <Text style={styles.locationDetails}>
            {currentLocationAddress.streetAddress || 'Street Address not available'},{' '}
            {currentLocationAddress.city || ''} {currentLocationAddress.state || ''}
          </Text>
          <TextInput
            style={[styles.input, validationErrors.label && styles.inputError]}
            value={currentLocationAddress.label}
            onChangeText={(text) => setCurrentLocationAddress({ ...currentLocationAddress, label: text })}
            placeholder="Label (e.g., Home)"
          />
          {validationErrors.label && <Text style={styles.errorText}>{validationErrors.label}</Text>}

          <TextInput
            style={[styles.input, validationErrors.zipCode && styles.inputError]}
            value={currentLocationAddress.zipCode}
            onChangeText={(text) => setCurrentLocationAddress({ ...currentLocationAddress, zipCode: text })}
            placeholder="Zip Code"
            keyboardType="numeric"
          />
          {validationErrors.zipCode && <Text style={styles.errorText}>{validationErrors.zipCode}</Text>}

          <TextInput
            style={[styles.input, validationErrors.phoneNumber && styles.inputError]}
            value={currentLocationAddress.phoneNumber}
            onChangeText={(text) => {
              const cleanedText = text.replace(/\D/g, '');
              setCurrentLocationAddress({ ...currentLocationAddress, phoneNumber: cleanedText });
              setValidationErrors({ ...validationErrors, phoneNumber: undefined });
            }}
            placeholder="Phone Number"
            keyboardType="phone-pad"
          />
          {validationErrors.phoneNumber && <Text style={styles.errorText}>{validationErrors.phoneNumber}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleAddCurrentLocationAddress}>
            <Text style={styles.buttonText}>Add Address</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Render existing addresses */}
      {addresses.map((address) => (
        <View key={address.id} style={styles.addressCard}>
          <View style={styles.addressInfo}>
            <Text style={styles.addressText}>
              {address.streetAddress}, {address.city}, {address.state} {address.zipCode}
            </Text>
            <Text style={styles.addressText}>Phone: {address.phoneNumber}</Text>
            {address.isDefault && (
              <Text style={styles.defaultBadge}>Default</Text>
            )}
          </View>
          <View style={styles.addressActions}>
            {!address.isDefault && (
              <TouchableOpacity 
                onPress={() => setDefaultAddress(address.id)}
                style={styles.addressButton}
              >
                <Ionicons name="star-outline" size={20} color="#FF4B2B" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => deleteAddress(address.id)}
              style={styles.addressButton}
            >
              <Ionicons name="trash-outline" size={20} color="#FF4B2B" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  form: {
    padding: 16,
    gap: 12,
    backgroundColor: '#F9F9F9',
    marginVertical: 8,
    borderRadius: 8,
  },
  formHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#FF4B2B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addressCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  addressInfo: {
    flex: 1,
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
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addressButton: {
    padding: 8,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  locationDetails: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
});

export default AddressScreen;
