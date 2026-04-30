import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { styles } from './AddressScreen.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAddress } from '../hooks/useAddress';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocation } from '../hooks/useLocation';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Preloader from '../components/Preloader';
import { Colors as BrandColors } from '../constants/Colors';

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
  isDefault?: boolean;
}

type FormMode = 'none' | 'add' | 'location' | 'edit';


const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  icon,
  t,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: any;
  icon: string;
  t: any;
}) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[styles.inputContainer, error ? styles.inputContainerError : null]}>
      <Ionicons name={icon as any} size={18} color={error ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        underlineColorAndroid="transparent"
      />
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const AddressForm = ({
  addr,
  setAddr,
  errors,
  setErrors,
  onSave,
  onCancel,
  title,
  saveLabel,
  isLocationForm = false,
  showDefaultToggle = false,
  t,
}: any) => (
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.formCard}>
      <View style={styles.formCardHeader}>
        <MaterialCommunityIcons name="map-marker-plus-outline" size={22} color={BrandColors.primary} />
        <Text style={styles.formCardTitle} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
      </View>

      {isLocationForm && addr.streetAddress ? (
        <View style={styles.locationPreviewBox}>
          <Ionicons name="navigate-circle-outline" size={18} color={BrandColors.primary} />
          <Text style={styles.locationPreviewText}>
            {addr.streetAddress}
            {addr.city ? `, ${addr.city}` : ''}
            {addr.state ? `, ${addr.state}` : ''}
          </Text>
        </View>
      ) : null}

      <InputField
        label={t('addresses.label')}
        value={addr.label || ''}
        onChangeText={(t2) => { setAddr({ ...addr, label: t2 }); setErrors({ ...errors, label: undefined }); }}
        placeholder={t('addresses.label_placeholder')}
        error={errors.label}
        icon="pricetag-outline"
        t={t}
      />

      {!isLocationForm && (
        <>
          <InputField
            label={t('addresses.street_address')}
            value={addr.streetAddress || ''}
            onChangeText={(t2) => { setAddr({ ...addr, streetAddress: t2 }); setErrors({ ...errors, streetAddress: undefined }); }}
            placeholder={t('addresses.street_placeholder')}
            error={errors.streetAddress}
            icon="map-outline"
            t={t}
          />
          <InputField
            label={t('addresses.city')}
            value={addr.city || ''}
            onChangeText={(t2) => { setAddr({ ...addr, city: t2 }); setErrors({ ...errors, city: undefined }); }}
            placeholder={t('addresses.city_placeholder')}
            error={errors.city}
            icon="business-outline"
            t={t}
          />
          <InputField
            label={t('addresses.state_country')}
            value={addr.state || ''}
            onChangeText={(t2) => { setAddr({ ...addr, state: t2 }); setErrors({ ...errors, state: undefined }); }}
            placeholder={t('addresses.state_placeholder')}
            error={errors.state}
            icon="globe-outline"
            t={t}
          />
        </>
      )}

      <InputField
        label={t('addresses.postal_code')}
        value={addr.zipCode || ''}
        onChangeText={(t2) => { setAddr({ ...addr, zipCode: t2 }); setErrors({ ...errors, zipCode: undefined }); }}
        placeholder={t('addresses.postal_placeholder')}
        error={errors.zipCode}
        keyboardType="numeric"
        icon="mail-outline"
        t={t}
      />
      <InputField
        label={t('addresses.phone_number')}
        value={addr.phoneNumber || ''}
        onChangeText={(t2) => {
          const cleaned = t2.replace(/\D/g, '');
          setAddr({ ...addr, phoneNumber: cleaned });
          setErrors({ ...errors, phoneNumber: undefined });
        }}
        placeholder={t('addresses.phone_placeholder')}
        error={errors.phoneNumber}
        keyboardType="phone-pad"
        icon="call-outline"
        t={t}
      />

      {showDefaultToggle && (
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAddr({ ...addr, isDefault: !addr.isDefault })}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, addr.isDefault && styles.checkboxChecked]}>
            {addr.isDefault && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>{t('addresses.set_default')}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.formButtons}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
          <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={onSave} activeOpacity={0.8}>
          <LinearGradient colors={[BrandColors.primary, BrandColors.secondary]} style={styles.saveBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.saveBtnText}>{saveLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  </KeyboardAvoidingView>
);

export function AddressScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const {
    addresses,
    loading,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    selectedDeliveryAddressId,
    setSelectedDeliveryAddress,
  } = useAddress();

  const { fetchLocation } = useLocation();

  const [formMode, setFormMode] = useState<FormMode>('none');
  const [newAddress, setNewAddress] = useState<Partial<Address>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<Partial<Address>>({});
  const [editValidationErrors, setEditValidationErrors] = useState<Record<string, string | undefined>>({});
  const [currentLocationAddress, setCurrentLocationAddress] = useState<Partial<Address>>({});
  const [fetchingLocation, setFetchingLocation] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const validateAddress = (addr: Partial<Address>, setErrors: (e: Record<string, string | undefined>) => void) => {
    const errors: Record<string, string | undefined> = {};
    if (!addr.label?.trim()) errors.label = t('addresses.label_required');
    if (!addr.streetAddress?.trim()) errors.streetAddress = t('addresses.street_required');
    if (!addr.city?.trim()) errors.city = t('addresses.city_required');
    if (!addr.state?.trim()) {
      errors.state = t('addresses.state_required');
    } else if (!/^[A-Za-z\s]+$/.test(addr.state.trim())) {
      errors.state = t('addresses.state_letters_only');
    }
    if (!addr.zipCode?.trim()) {
      errors.zipCode = t('addresses.postal_required');
    } else if (!/^\d{5}(-\d{4})?$/.test(addr.zipCode.trim())) {
      errors.zipCode = t('addresses.postal_invalid');
    }
    if (!addr.phoneNumber?.trim()) {
      errors.phoneNumber = t('addresses.phone_required');
    } else if (!/^\d{11}$/.test(addr.phoneNumber.trim())) {
      errors.phoneNumber = t('addresses.phone_invalid');
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateLocationAddress = (addr: Partial<Address>) => {
    const errors: Record<string, string> = {};
    if (!addr.label?.trim()) errors.label = t('addresses.label_required');
    if (!addr.zipCode?.trim()) {
      errors.zipCode = t('addresses.postal_required');
    } else if (!/^\d{5}(-\d{4})?$/.test(addr.zipCode.trim())) {
      errors.zipCode = t('addresses.postal_invalid');
    }
    if (!addr.phoneNumber?.trim()) {
      errors.phoneNumber = t('addresses.phone_required');
    } else if (!/^\d{11}$/.test(addr.phoneNumber.trim())) {
      errors.phoneNumber = t('addresses.phone_invalid');
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAddress = async () => {
    if (!validateAddress(newAddress, setValidationErrors)) return;
    try {
      await addAddress(newAddress);
      setFormMode('none');
      setNewAddress({});
      setValidationErrors({});
      Alert.alert(t('common.success'), t('addresses.add_success'));
    } catch (error) {
      Alert.alert(t('common.error'), t('addresses.add_error'));
    }
  };

  const handleSaveCurrentLocation = async () => {
    setFetchingLocation(true);
    try {
      await fetchLocation();
      // Read from store state after await
      const locationState = useLocation.getState();
      const { currentLocation, coords } = locationState;

      if (
        currentLocation &&
        coords
      ) {
        const parts = currentLocation.split(',');
        const street = parts[0] ? parts[0].trim() : '';
        const city = parts[1] ? parts[1].trim() : '';
        const state = parts[2] ? parts[2].trim() : '';
        setCurrentLocationAddress({
          streetAddress: street,
          city,
          state,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        });
      } else {
        // If location fetch failed, just start with empty address
        setCurrentLocationAddress({});
        Alert.alert(t('common.notice'), t('addresses.location_fetch_error'));
      }
      setFormMode('location');
    } catch (error) {
      setCurrentLocationAddress({});
      setFormMode('location');
      Alert.alert(t('common.notice'), t('addresses.location_fetch_error'));
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleAddCurrentLocationAddress = async () => {
    if (!validateLocationAddress(currentLocationAddress)) return;
    try {
      await addAddress({
        ...currentLocationAddress,
        city: currentLocationAddress.city || '',
        state: currentLocationAddress.state || '',
      });
      setFormMode('none');
      setCurrentLocationAddress({});
      setValidationErrors({});
      Alert.alert(t('common.success'), t('addresses.save_location_success'));
    } catch (error) {
      Alert.alert(t('common.error'), t('addresses.add_error'));
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address.id);
    setEditingAddress({ ...address });
    setEditValidationErrors({});
    setFormMode('edit');
  };

  const handleCancelEdit = () => {
    setEditingAddressId(null);
    setEditingAddress({});
    setEditValidationErrors({});
    setFormMode('none');
  };

  const handleUpdateAddress = async () => {
    if (!editingAddressId || !validateAddress(editingAddress, setEditValidationErrors)) return;
    try {
      await updateAddress(editingAddressId, editingAddress);
      setEditingAddressId(null);
      setEditingAddress({});
      setEditValidationErrors({});
      setFormMode('none');
      Alert.alert(t('common.success'), t('addresses.update_success'));
    } catch (error) {
      Alert.alert(t('common.error'), t('addresses.update_error'));
    }
  };

  const getAddressIcon = (label: string) => {
    const lower = label?.toLowerCase() || '';
    const homeStr = t('profile.home').toLowerCase();
    const workStr = t('profile.work').toLowerCase();
    const officeStr = 'office'; // Maybe add to i18n later if needed

    if (lower.includes(homeStr)) return 'home';
    if (lower.includes(workStr) || lower.includes(officeStr)) return 'briefcase';
    return 'location';
  };

  if (loading) {
    return (
      <Preloader fullScreen={true} />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Section Title Area (My Addresses + Actions) */}
      <View style={styles.sectionHeaderContainer}>
        <View style={styles.sectionHeaderLeft}>
          <MaterialCommunityIcons name="map-marker-multiple-outline" size={24} color={BrandColors.primary} />
          <Text style={styles.sectionTitleText} numberOfLines={1} ellipsizeMode="tail">{t('addresses.title')}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleSaveCurrentLocation}
            activeOpacity={0.8}
            disabled={fetchingLocation}
          >
            {fetchingLocation ? (
              <Preloader fullScreen={false} size={24} />
            ) : (
              <Ionicons name="locate-outline" size={20} color={BrandColors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, styles.headerBtnPrimary]}
            onPress={() => {
              setFormMode(formMode === 'add' ? 'none' : 'add');
              setNewAddress({});
              setValidationErrors({});
            }}
            activeOpacity={0.8}
          >
            <Ionicons name={formMode === 'add' ? 'close' : 'add'} size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Add Address Form */}
        {formMode === 'add' &&
          <AddressForm
            addr={newAddress}
            setAddr={setNewAddress}
            errors={validationErrors}
            setErrors={setValidationErrors}
            onSave={handleAddAddress}
            onCancel={() => { setFormMode('none'); setNewAddress({}); setValidationErrors({}); }}
            title={t('addresses.new_address_title')}
            saveLabel={t('addresses.save_address')}
            t={t}
          />
        }

        {/* Current Location Form */}
        {formMode === 'location' &&
          <AddressForm
            addr={currentLocationAddress}
            setAddr={setCurrentLocationAddress}
            errors={validationErrors}
            setErrors={setValidationErrors}
            onSave={handleAddCurrentLocationAddress}
            onCancel={() => { setFormMode('none'); setCurrentLocationAddress({}); setValidationErrors({}); }}
            title={t('addresses.save_location_title')}
            saveLabel={t('addresses.save_location')}
            isLocationForm={true}
            t={t}
          />
        }

        {/* Edit Address Form */}
        {formMode === 'edit' && editingAddressId &&
          <AddressForm
            addr={editingAddress}
            setAddr={setEditingAddress}
            errors={editValidationErrors}
            setErrors={setEditValidationErrors}
            onSave={handleUpdateAddress}
            onCancel={handleCancelEdit}
            title={t('addresses.edit_address_title')}
            saveLabel={t('addresses.update_address')}
            showDefaultToggle={true}
            t={t}
          />
        }

        {/* Address List */}
        {addresses.length === 0 && formMode === 'none' ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <MaterialCommunityIcons name="map-marker-off-outline" size={48} color={BrandColors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('addresses.no_addresses_title')}</Text>
            <Text style={styles.emptySubtitle}>{t('addresses.no_addresses_subtitle')}</Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => setFormMode('add')}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[BrandColors.primary, BrandColors.secondary]} style={styles.emptyAddBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.emptyAddBtnText}>{t('addresses.add_address')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.addressList}>
            {addresses.map((address) => {
              const isSelected = address.id === selectedDeliveryAddressId;
              const isEditing = editingAddressId === address.id && formMode === 'edit';
              if (isEditing) return null; // edit form is shown above
              return (
                <TouchableOpacity
                  key={address.id}
                  activeOpacity={0.9}
                  onPress={() => setSelectedDeliveryAddress(address.id)}
                  style={[styles.addressCard, isSelected && styles.selectedAddressCard]}
                >
                  <View style={[styles.addressIconBg, isSelected && styles.addressIconBgSelected]}>
                    <Ionicons
                      name={getAddressIcon(address.label) as any}
                      size={22}
                      color={BrandColors.primary}
                    />
                  </View>

                  <View style={styles.addressInfo}>
                    <View style={styles.addressTopRow}>
                      <Text style={styles.addressLabel} numberOfLines={1} ellipsizeMode="tail">
                        {address.label}
                      </Text>
                      {address.isDefault && (
                        <View style={styles.defaultTag}>
                          <Text style={styles.defaultTagText}>{t('cart.default')}</Text>
                        </View>
                      )}
                    </View>
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={BrandColors.primary} />
                        <Text style={styles.currentDeliveryTag}>{t('addresses.current_delivery_tag')}</Text>
                      </View>
                    )}
                    <Text style={styles.addressLine} numberOfLines={1}>
                      {address.streetAddress}
                    </Text>
                    <Text style={styles.addressLine} numberOfLines={1}>
                      {address.city}{address.state ? `, ${address.state}` : ''} {address.zipCode}
                    </Text>
                    <View style={styles.phoneRow}>
                      <Ionicons name="call-outline" size={13} color="#9CA3AF" />
                      <Text style={styles.phoneText}>{address.phoneNumber}</Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => handleEditAddress(address as Address)}
                      style={[styles.cardActionBtn, isSelected && styles.cardActionBtnSelected]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="pencil-outline" size={18} color={BrandColors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(t('addresses.delete_confirm_title'), t('addresses.delete_confirm_message'), [
                          { text: t('common.cancel'), style: 'cancel' },
                          { text: t('cart.delete'), style: 'destructive', onPress: () => deleteAddress(address.id) },
                        ])
                      }
                      style={[styles.cardActionBtn, isSelected && styles.cardActionBtnSelected]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default AddressScreen;

