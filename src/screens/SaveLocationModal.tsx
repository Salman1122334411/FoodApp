import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { modalStyles } from './SaveLocationModal.styles';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../hooks/useLocation'; // Custom hook for location
import { useAddress } from '../hooks/useAddress';   // Custom hook for address management
import { supabase } from "../lib/supabase";
import { useTranslation } from 'react-i18next';
import { Colors as BrandColors } from '../constants/Colors';
import { PRESET_ADDRESSES } from '../constants/Addresses';
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
  // Destructure both currentLocation and coords from useLocation
  const { fetchLocation, currentLocation, coords, setManualLocation } = useLocation();
  const { addAddress } = useAddress();

  // Local state for form fields and flags
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { t } = useTranslation();

  // Extend the address state to include latitude and longitude.
  const [address, setAddress] = useState({
    label: '',
    zipCode: '',
    phoneNumber: '',
    streetAddress: '',
    city: '',
    state: '',
    isDefault: false,
    latitude: null as number | null,
    longitude: null as number | null,
  });

  // When the modal opens, fetch the current location.
  useEffect(() => {
    if (visible) {
      setLoadingLocation(true);
      fetchLocation()
        .catch((error) => {
          console.error('Location fetch error:', error);
          Alert.alert(t('common.error'), t('save_location.error_fetch'));
        })
        .finally(() => {
          setLoadingLocation(false);
        });
    } else {
      // Reset state when modal is closed.
      setAddress({
        label: '',
        zipCode: '',
        phoneNumber: '',
        streetAddress: '',
        city: '',
        state: '',
        isDefault: false,
        latitude: null,
        longitude: null,
      });
      setValidationErrors({});
      setDefaultAddress(false);
    }
  }, [visible, fetchLocation]);

  // When currentLocation or coords update, update the address details.
  useEffect(() => {
    if (
      visible &&
      currentLocation &&
      coords &&
      !currentLocation.includes('Error') &&
      currentLocation !== 'Fetching current location...'
    ) {
      // You can split the currentLocation string if needed.
      const parts = currentLocation.split(',');
      setAddress((prev) => ({
        ...prev,
        streetAddress: parts[0] ? parts[0].trim() : '',
        city: parts[1] ? parts[1].trim() : '',
        state: parts[2] ? parts[2].trim() : '',
        latitude: coords.latitude,
        longitude: coords.longitude,
      }));
    }
  }, [currentLocation, visible, coords]);

  // Validate required fields.
  const validate = () => {
    let errors: Record<string, string> = {};

    if (!address.label.trim()) {
      errors.label = t('save_location.error_label');
    }
    if (!address.zipCode.trim()) {
      errors.zipCode = t('save_location.error_zip');
    } else if (!/^\d{5}(-\d{4})?$/.test(address.zipCode.trim())) {
      errors.zipCode = t('save_location.error_zip_format');
    }
    if (!address.phoneNumber.trim()) {
      errors.phoneNumber = t('save_location.error_phone');
    } else if (!/^\d{11}$/.test(address.phoneNumber.trim())) {
      errors.phoneNumber = t('save_location.error_phone_format');
    }

    if (!address.streetAddress.trim()) {
      errors.streetAddress = t('save_location.error_street');
    }
    if (!address.city.trim()) {
      errors.city = t('save_location.error_city');
    }
    if (!address.state.trim()) {
      errors.state = t('save_location.error_state');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
 
  const handleQuickSelect = (preset: any) => {
    setAddress({
      label: preset.label,
      streetAddress: preset.streetAddress,
      city: preset.city,
      state: preset.state,
      zipCode: preset.zipCode,
      phoneNumber: address.phoneNumber, // Keep current phone number
      isDefault: address.isDefault,
      latitude: preset.latitude,
      longitude: preset.longitude,
    });
    setValidationErrors({});
  };
 
  const handleSetAppLocation = (preset: any) => {
    setManualLocation(preset.label, { latitude: preset.latitude, longitude: preset.longitude });
    Alert.alert(t('common.success'), t('save_location.location_simulated', { location: preset.label }));
    onClose();
  };

  // Handler for saving the address, now including latitude and longitude.
  const handleSave = async () => {
    if (!validate()) return;

    const newAddress = {
      ...address,
      latitude: address.latitude ?? undefined,
      longitude: address.longitude ?? undefined,
      isDefault: defaultAddress,
    };

    try {
      if (defaultAddress) {
        // Get the current user's session and id
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          Alert.alert(t('common.error'), t('save_location.user_not_logged_in'));
          return;
        }
        const currentUserId = session.user.id;

        // Update all addresses for the user to set isDefault to false
        const { error: updateError } = await supabase
          .from("Address")
          .update({ isDefault: false })
          .eq("userId", currentUserId);

        if (updateError) {
          console.error("Error updating previous default addresses:", updateError);
          Alert.alert(t('common.error'), t('save_location.error_save'));
          return;
        }
      }

      await addAddress(newAddress);
      onAddressAdded && onAddressAdded();
      Alert.alert(t('common.success'), t('save_location.success_save'));
      onClose();
    } catch (error) {
      console.error("Error saving address:", error);
      Alert.alert(t('common.error'), t('save_location.error_save'));
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
          <Text style={modalStyles.modalTitle}>{t('save_location.title')}</Text>
          {loadingLocation ? (
            <ActivityIndicator size="large" color={BrandColors.primary} />
          ) : (
            <>
              <Text style={modalStyles.quickSelectHeader}>{t('save_location.quick_select')}</Text>
              <View style={modalStyles.quickSelectContainer}>
                {PRESET_ADDRESSES.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={modalStyles.quickSelectChip}
                    onPress={() => handleQuickSelect(preset)}
                    onLongPress={() => handleSetAppLocation(preset)}
                    activeOpacity={0.7}
                  >
                    <Text style={modalStyles.quickSelectChipText}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
 
              <TextInput
                style={[modalStyles.input, validationErrors.streetAddress && modalStyles.inputError]}
                placeholder={t('save_location.street_placeholder')}
                value={address.streetAddress}
                onChangeText={(text) => setAddress((prev) => ({ ...prev, streetAddress: text }))}
                underlineColorAndroid="transparent"
              />
              {validationErrors.streetAddress && (
                <Text style={modalStyles.errorText}>{validationErrors.streetAddress}</Text>
              )}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[modalStyles.input, validationErrors.city && modalStyles.inputError]}
                    placeholder={t('save_location.city_placeholder')}
                    value={address.city}
                    onChangeText={(text) => setAddress((prev) => ({ ...prev, city: text }))}
                    underlineColorAndroid="transparent"
                  />
                  {validationErrors.city && (
                    <Text style={modalStyles.errorText}>{validationErrors.city}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[modalStyles.input, validationErrors.state && modalStyles.inputError]}
                    placeholder={t('save_location.state_placeholder')}
                    value={address.state}
                    onChangeText={(text) => setAddress((prev) => ({ ...prev, state: text }))}
                    underlineColorAndroid="transparent"
                  />
                  {validationErrors.state && (
                    <Text style={modalStyles.errorText}>{validationErrors.state}</Text>
                  )}
                </View>
              </View>
              <TextInput
                style={[modalStyles.input, validationErrors.label && modalStyles.inputError]}
                placeholder={t('save_location.label_placeholder')}
                value={address.label}
                onChangeText={(text) =>
                  setAddress((prev) => ({ ...prev, label: text }))
                }
                underlineColorAndroid="transparent"
              />
              {validationErrors.label && (
                <Text style={modalStyles.errorText}>{validationErrors.label}</Text>
              )}
              <TextInput
                style={[modalStyles.input, validationErrors.zipCode && modalStyles.inputError]}
                placeholder={t('save_location.zip_placeholder')}
                keyboardType="numeric"
                value={address.zipCode}
                onChangeText={(text) =>
                  setAddress((prev) => ({ ...prev, zipCode: text }))
                }
                underlineColorAndroid="transparent"
              />
              {validationErrors.zipCode && (
                <Text style={modalStyles.errorText}>{validationErrors.zipCode}</Text>
              )}
              <TextInput
                style={[modalStyles.input, validationErrors.phoneNumber && modalStyles.inputError]}
                placeholder={t('save_location.phone_placeholder')}
                keyboardType="phone-pad"
                value={address.phoneNumber}
                onChangeText={(text) => {
                  const cleanedText = text.replace(/\D/g, '');
                  setAddress((prev) => ({ ...prev, phoneNumber: cleanedText }));
                }}
                underlineColorAndroid="transparent"
              />
              {validationErrors.phoneNumber && (
                <Text style={modalStyles.errorText}>{validationErrors.phoneNumber}</Text>
              )}
              <View style={modalStyles.defaultContainer}>
                <TouchableOpacity
                  onPress={() => setDefaultAddress(!defaultAddress)}
                  style={modalStyles.checkbox}
                  activeOpacity={1}
                >
                  {defaultAddress && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
                <Text style={modalStyles.defaultText}>{t('save_location.set_default')}</Text>
              </View>
              <TouchableOpacity style={modalStyles.saveButton} onPress={handleSave} activeOpacity={1}>
                <Text style={modalStyles.saveButtonText}>{t('save_location.save_btn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose} activeOpacity={1}>
                <Text style={modalStyles.cancelButtonText}>{t('save_location.cancel_btn')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}


