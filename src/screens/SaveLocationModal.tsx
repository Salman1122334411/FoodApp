import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../hooks/useLocation'; // Your custom hook for location
import { useAddress } from '../hooks/useAddress';   // Your custom hook for address management

interface SaveLocationModalProps {
  visible: boolean;
  onClose: () => void;
  onAddressAdded?: () => void;
}

export default function SaveLocationModal({
  visible,
  onClose,
  onAddressAdded,
}: SaveLocationModalProps) {
  // Destructure the correct property: currentLocation (not "location")
  const { fetchLocation, currentLocation } = useLocation();
  const { addAddress } = useAddress();

  // Local state for the form fields and flags
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // The new address to be created using the current location
  const [address, setAddress] = useState({
    label: '',
    zipCode: '',
    phoneNumber: '',
    streetAddress: '',
    city: '',
    state: '',
    isDefault: false,
  });

  // When modal opens, fetch the current location
  useEffect(() => {
    if (visible) {
      setLoadingLocation(true);
      fetchLocation()
        .catch((error) => {
          console.error('Location fetch error:', error);
          Alert.alert('Error', 'Failed to fetch current location');
        })
        .finally(() => {
          setLoadingLocation(false);
        });
    } else {
      // Reset form state when the modal is closed
      setAddress({
        label: '',
        zipCode: '',
        phoneNumber: '',
        streetAddress: '',
        city: '',
        state: '',
        isDefault: false,
      });
      setValidationErrors({});
      setDefaultAddress(false);
    }
  }, [visible, fetchLocation]);

  // When the currentLocation value updates, update the address details
  useEffect(() => {
    if (
      visible &&
      currentLocation &&
      !currentLocation.includes('Error') &&
      currentLocation !== 'Fetching current location...'
    ) {
      const parts = currentLocation.split(',');
      setAddress((prev) => ({
        ...prev,
        streetAddress: parts[0] ? parts[0].trim() : '',
        city: parts[1] ? parts[1].trim() : '',
        state: parts[2] ? parts[2].trim() : '',
      }));
    }
  }, [currentLocation, visible]);

  // Validate only the required fields for the current location address
  const validate = () => {
    let errors: Record<string, string> = {};

    if (!address.label.trim()) {
      errors.label = 'Label is required';
    }
    if (!address.zipCode.trim()) {
      errors.zipCode = 'Postal code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(address.zipCode.trim())) {
      errors.zipCode = 'Invalid postal code format';
    }
    if (!address.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{11}$/.test(address.phoneNumber.trim())) {
      errors.phoneNumber = 'Phone number must be exactly 11 digits';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler for saving the current location as a new address
  const handleSave = async () => {
    if (!validate()) return;

    const newAddress = {
      ...address,
      isDefault: defaultAddress,
    };

    try {
      await addAddress(newAddress);
      onAddressAdded && onAddressAdded();
      Alert.alert('Success', 'Current location saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContainer}>
          <Text style={modalStyles.modalTitle}>Save Current Location</Text>
          {loadingLocation ? (
            <ActivityIndicator size="large" color="#FF4B2B" />
          ) : (
            <>
              <Text style={modalStyles.locationText}>
                {address.streetAddress
                  ? `${address.streetAddress}, ${address.city}, ${address.state}`
                  : 'Location not available'}
              </Text>
              <TextInput
                style={[modalStyles.input, validationErrors.label && modalStyles.inputError]}
                placeholder="Label (e.g., Home)"
                value={address.label}
                onChangeText={(text) =>
                  setAddress((prev) => ({ ...prev, label: text }))
                }
              />
              {validationErrors.label && (
                <Text style={modalStyles.errorText}>{validationErrors.label}</Text>
              )}
              <TextInput
                style={[modalStyles.input, validationErrors.zipCode && modalStyles.inputError]}
                placeholder="Zip Code"
                keyboardType="numeric"
                value={address.zipCode}
                onChangeText={(text) =>
                  setAddress((prev) => ({ ...prev, zipCode: text }))
                }
              />
              {validationErrors.zipCode && (
                <Text style={modalStyles.errorText}>{validationErrors.zipCode}</Text>
              )}
              <TextInput
                style={[modalStyles.input, validationErrors.phoneNumber && modalStyles.inputError]}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                value={address.phoneNumber}
                onChangeText={(text) => {
                  const cleanedText = text.replace(/\D/g, '');
                  setAddress((prev) => ({ ...prev, phoneNumber: cleanedText }));
                }}
              />
              {validationErrors.phoneNumber && (
                <Text style={modalStyles.errorText}>{validationErrors.phoneNumber}</Text>
              )}
              <View style={modalStyles.defaultContainer}>
                <TouchableOpacity
                  onPress={() => setDefaultAddress(!defaultAddress)}
                  style={modalStyles.checkbox}
                >
                  {defaultAddress && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
                <Text style={modalStyles.defaultText}>Set as default address</Text>
              </View>
              <TouchableOpacity style={modalStyles.saveButton} onPress={handleSave}>
                <Text style={modalStyles.saveButtonText}>Save Address</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
                <Text style={modalStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  locationText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  defaultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FF4B2B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  defaultText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#FF4B2B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 10,
  },
  cancelButtonText: {
    color: '#FF4B2B',
    fontSize: 16,
  },
});
