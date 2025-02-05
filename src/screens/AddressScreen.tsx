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
  user_id: string;
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

    if (!newAddress.street_address?.trim()) {
      errors.street_address = 'Street address is required';
    }

    if (!newAddress.city?.trim()) {
      errors.city = 'City is required';
    }

    if (!newAddress.state?.trim()) {
      errors.state = 'State is required';
    } else if (!/^[A-Za-z\s]+$/.test(newAddress.state.trim())) {
      errors.state = 'State must be a valid country name';
    }

    if (!newAddress.zip_code?.trim()) {
      errors.zip_code = 'Postal code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(newAddress.zip_code.trim())) {
      errors.zip_code = 'Invalid postal code format';
    }


    if (!newAddress.phone_number?.trim()) {
      errors.phone_number = 'Phone number is required';
    } else if (!/^\d{11}$/.test(newAddress.phone_number.trim())) {
      errors.phone_number = 'Phone number must be exactly 11 digits';
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
            style={[styles.input, validationErrors.street_address && styles.inputError]}
            value={newAddress.street_address}
            onChangeText={(text) => setNewAddress({ ...newAddress, street_address: text })}
            placeholder="Street Address"
          />
          {validationErrors.street_address && <Text style={styles.errorText}>{validationErrors.street_address}</Text>}

          <TextInput
            style={[styles.input, validationErrors.city && styles.inputError]}
            value={newAddress.city}
            onChangeText={(text) => setNewAddress({ ...newAddress, city: text })}
            placeholder="City"
          />
          {validationErrors.city && <Text style={styles.errorText}>{validationErrors.city}</Text>}

         <TextInput
        style={[
                           styles.input, 
                           validationErrors.state && styles.inputError
                         ]}
                         value={newAddress.state}
                         onChangeText={(text) => {
                           setNewAddress({ ...newAddress, state: text.toUpperCase() });
                           setValidationErrors({ ...validationErrors, state: undefined });
                         }}
                         placeholder="State"
                       />
          {validationErrors.state && <Text style={styles.errorText}>{validationErrors.state}</Text>}

          <TextInput
            style={[styles.input, validationErrors.zip_code && styles.inputError]}
            value={newAddress.zip_code}
            onChangeText={(text) => setNewAddress({ ...newAddress, zip_code: text })}
            placeholder="Zip Code"
            keyboardType="numeric"
          />
          {validationErrors.zip_code && <Text style={styles.errorText}>{validationErrors.zip_code}</Text>}

          <TextInput
            style={[styles.input, validationErrors.phone_number && styles.inputError]}
            value={newAddress.phone_number}
            onChangeText={(text) => {
              const cleanedText = text.replace(/\D/g, '');
              setNewAddress({ ...newAddress, phone_number: cleanedText });
              setValidationErrors({ ...validationErrors, phone_number: undefined });
            }}
            placeholder="Phone Number"
            keyboardType="phone-pad"
          />
          {validationErrors.phone_number && <Text style={styles.errorText}>{validationErrors.phone_number}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleAddAddress}>
            <Text style={styles.buttonText}>Add Address</Text>
          </TouchableOpacity>
        </View>
      )}

      {addresses.map((address) => (
        <View key={address.id} style={styles.addressCard}>
          <View style={styles.addressInfo}>
            <Text style={styles.addressText}>
              {address.street_address}, {address.city}, {address.state} {address.zip_code}
            </Text>
            <Text style={styles.addressText}>Phone: {address.phone_number}</Text>
            {address.is_default && (
              <Text style={styles.defaultBadge}>Default</Text>
            )}
          </View>
          <View style={styles.addressActions}>
            {!address.is_default && (
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