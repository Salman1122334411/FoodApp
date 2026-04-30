import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { styles } from "./ProfileSetupModal.styles";
import { supabase } from "../lib/supabase";
import { Calendar, ChevronDown, MapPin, Phone, User } from "lucide-react-native";
import cuid from "cuid";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocation } from "../hooks/useLocation"; // Added location hook
import { useTranslation } from "react-i18next";
import { Colors as BrandColors } from "../constants/Colors";
import { PRESET_ADDRESSES } from "../constants/Addresses";

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
  const { t, i18n } = useTranslation();

  // useLocation hook for fetching current location
  const { fetchLocation, currentLocation, coords, setManualLocation } = useLocation();

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
    return date.toLocaleDateString(i18n.language, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Validate profile section
  const validateProfileSection = (): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!name.trim()) {
      errors.name = t('profile_setup.error_name');
    }
    if (!phoneNumber.trim()) {
      errors.phoneNumber = t('profile_setup.error_phone_req');
    } else if (!/^\d{10,11}$/.test(phoneNumber.trim())) {
      errors.phoneNumber = t('profile_setup.error_phone_format');
    }
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    if (age < -1) {
      errors.dob = t('profile_setup.error_age');
    }
    return errors;
  };

  // Validate address section (both for auto-fetched and manual mode)
  const validateAddressSection = (): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!addressLabel.trim()) {
      errors.addressLabel = t('profile_setup.error_address_label');
    }
    if (!streetAddress.trim()) {
      errors.streetAddress = t('profile_setup.error_street');
    }
    if (!city.trim()) {
      errors.city = t('profile_setup.error_city');
    }
    if (!stateField.trim()) {
      errors.state = t('profile_setup.error_state');
    } else if (!/^[A-Za-z\s]+$/.test(stateField.trim())) {
      errors.state = t('profile_setup.error_state_format');
    }
    if (!zipCode.trim()) {
      errors.zipCode = t('profile_setup.error_zip');
    } else if (!/^\d{5}(-\d{4})?$/.test(zipCode.trim())) {
      errors.zipCode = t('profile_setup.error_zip_format');
    }
    if (!addressPhoneNumber.trim()) {
      errors.addressPhoneNumber = t('profile_setup.error_address_phone_req');
    } else if (!/^\d{10,11}$/.test(addressPhoneNumber.trim())) {
      errors.addressPhoneNumber = t('profile_setup.error_address_phone_format');
    }
    return errors;
  };

  const handleQuickSelect = (preset: any) => {
    setAddressLabel(preset.label);
    setStreetAddress(preset.streetAddress);
    setCity(preset.city);
    setStateField(preset.state);
    setZipCode(preset.zipCode);
    setLatitude(preset.latitude);
    setLongitude(preset.longitude);
    setManualMode(true); // Switch to manual mode so fields are visible/editable
    setValidationErrors({});
  };
 
  const handleSetAppLocation = (preset: any) => {
    setManualLocation(preset.label, { latitude: preset.latitude, longitude: preset.longitude });
    Alert.alert(t('common.success'), t('profile_setup.location_simulated', { location: preset.label }));
  };

  // When the address tab is active and auto mode is enabled, fetch current location.
  useEffect(() => {
    if (activeSection === "address" && !manualMode) {
      setLoadingLocation(true);
      fetchLocation()
        .catch((error) => {
          console.error("Location fetch error:", error);
          Alert.alert(t('common.error'), t('save_location.error_fetch'));
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
      coords
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
      const userPayload = {
        id: user.id,
        email: email,
        name: name,
        phoneNumber: phoneNumber,
        dob: dob.toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("Upserting User:", userPayload);

      const { error: userError } = await supabase.from("User").upsert(userPayload);

      if (userError) {
        console.error("User Upsert Error:", userError);
        throw new Error(`User Update Failed: ${userError.message}`);
      }

      // Insert the default address.
      const addressPayload = {
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
        latitude: manualMode ? 1 : (latitude || 0),
        longitude: manualMode ? 1 : (longitude || 0),
      };

      console.log("Inserting Address:", addressPayload);

      const { error: addressError } = await supabase.from("Address").insert(addressPayload);

      if (addressError) {
        console.error("Address Insert Error:", addressError);
        throw new Error(`Address Insert Failed: ${addressError.message}`);
      }

      Alert.alert(t('common.success'), t('profile_setup.success_message'));
      onProfileSetupSuccess();
    } catch (error: any) {
      console.error("Detailed Profile Update Error:", error);
      Alert.alert(t('common.error'), error.message || t('profile_setup.error_update_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (


    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{t('profile_setup.title')}</Text>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeSection === "profile" && styles.activeTab]}
            onPress={() => setActiveSection("profile")}
            activeOpacity={1}
          >
            <User size={18} color={activeSection === "profile" ? BrandColors.primary : "#666"} />
            <Text style={[styles.tabText, activeSection === "profile" && styles.activeTabText]}>
              {t('profile_setup.tab_profile')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeSection === "address" && styles.activeTab]}
            onPress={() => setActiveSection("address")}
            activeOpacity={1}
          >
            <MapPin size={18} color={activeSection === "address" ? BrandColors.primary : "#666"} />
            <Text style={[styles.tabText, activeSection === "address" && styles.activeTabText]}>
              {t('profile_setup.tab_address')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {activeSection === "profile" ? (
            <>
              {/* Profile Section */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('profile_setup.email')}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput style={styles.input} value={email} editable={false} underlineColorAndroid="transparent" />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('profile_setup.full_name')}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder={t('profile_setup.name_placeholder')}
                    underlineColorAndroid="transparent"
                  />
                </View>
                {validationErrors.name && <Text style={styles.errorText}>{validationErrors.name}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('profile_setup.phone')}</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={18} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIcon}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder={t('profile_setup.phone_placeholder')}
                    keyboardType="phone-pad"
                    underlineColorAndroid="transparent"
                  />
                </View>
                {validationErrors.phoneNumber && (
                  <Text style={styles.errorText}>{validationErrors.phoneNumber}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('profile_setup.dob')}</Text>
                <TouchableOpacity style={styles.datePickerButton} onPress={showDatepicker} activeOpacity={1}>
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
                        <Text style={styles.datePickerTitle}>{t('profile_setup.dob_select')}</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)} activeOpacity={1}>
                          <Text style={styles.datePickerDoneBtn}>{t('profile_setup.done')}</Text>
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
              {/* Quick Select Section */}
              <Text style={styles.quickSelectHeader}>{t('profile_setup.quick_select')}</Text>
              <View style={styles.quickSelectContainer}>
                {PRESET_ADDRESSES.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={styles.quickSelectChip}
                    onPress={() => handleQuickSelect(preset)}
                    onLongPress={() => handleSetAppLocation(preset)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickSelectChipText}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
 
              {/* Address Section */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('profile_setup.address_label')}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={addressLabel}
                    onChangeText={setAddressLabel}
                    placeholder={t('profile_setup.address_label_placeholder')}
                    underlineColorAndroid="transparent"
                  />
                </View>
                {validationErrors.addressLabel && (
                  <Text style={styles.errorText}>{validationErrors.addressLabel}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('profile_setup.zip_code')}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={zipCode}
                    onChangeText={setZipCode}
                    placeholder={t('profile_setup.zip_code_placeholder')}
                    keyboardType="numeric"
                    underlineColorAndroid="transparent"
                  />
                </View>
                {validationErrors.zipCode && <Text style={styles.errorText}>{validationErrors.zipCode}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('profile_setup.address_phone')}</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={18} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIcon}
                    value={addressPhoneNumber}
                    onChangeText={setAddressPhoneNumber}
                    placeholder={t('profile_setup.address_phone_placeholder')}
                    keyboardType="phone-pad"
                    underlineColorAndroid="transparent"
                  />
                </View>
                {validationErrors.addressPhoneNumber && (
                  <Text style={styles.errorText}>{validationErrors.addressPhoneNumber}</Text>
                )}
              </View>

              {!manualMode ? (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('profile_setup.current_location')}</Text>
                  {loadingLocation ? (
                    <ActivityIndicator color={BrandColors.primary} />
                  ) : (
                    <Text style={styles.locationText} numberOfLines={2} ellipsizeMode="tail">
                      {streetAddress
                        ? `${streetAddress}, ${city}, ${stateField}`
                        : t('save_location.location_not_available')}
                    </Text>
                  )}
                </View>
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('profile_setup.street')}</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={streetAddress}
                        onChangeText={setStreetAddress}
                        placeholder={t('profile_setup.street_placeholder')}
                        underlineColorAndroid="transparent"
                      />
                    </View>
                    {validationErrors.streetAddress && (
                      <Text style={styles.errorText}>{validationErrors.streetAddress}</Text>
                    )}
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('profile_setup.city')}</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder={t('profile_setup.city_placeholder')}
                        underlineColorAndroid="transparent"
                      />
                    </View>
                    {validationErrors.city && <Text style={styles.errorText}>{validationErrors.city}</Text>}
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('profile_setup.state')}</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={stateField}
                        onChangeText={setStateField}
                        placeholder={t('profile_setup.state_placeholder')}
                        underlineColorAndroid="transparent"
                      />
                    </View>
                    {validationErrors.state && <Text style={styles.errorText}>{validationErrors.state}</Text>}
                  </View>
                </>
              )}

              <TouchableOpacity
                onPress={() => setManualMode(!manualMode)}
                activeOpacity={1}
                style={styles.manualToggleButton}
              >
                <Text style={styles.manualToggleButtonText}>
                  {manualMode ? t('profile_setup.use_current_location') : t('profile_setup.enter_manually')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading} activeOpacity={1}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {activeSection === "profile" ? t('profile_setup.continue_to_address') : t('profile_setup.complete_setup')}
            </Text>
          )}
        </TouchableOpacity>

        {activeSection === "profile" && (
          <TouchableOpacity style={styles.skipButton} onPress={() => setActiveSection("address")} activeOpacity={1}>
            <Text style={styles.skipButtonText}>{t('profile_setup.skip_to_address')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default ProfileSetupModal;
