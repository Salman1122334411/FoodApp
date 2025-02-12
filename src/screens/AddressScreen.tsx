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

  useEffect(() => {
    fetchAddresses();
  }, []);

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
        <TouchableOpacity onPress={() => setAddingAddress(!addingAddress)}>
          <Ionicons name="add-circle-outline" size={24} color="#FF4B2B" />
        </TouchableOpacity>
      </View>

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
  form: {
    padding: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF4B2B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
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
    borderWidth: 1, 
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },

  
});