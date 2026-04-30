import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { styles } from './ProfileScreen.styles';
import { useTranslation } from 'react-i18next';
import { useAddress } from '../hooks/useAddress'; // Import hook
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors as BrandColors } from '../constants/Colors';

import { supabase } from '../lib/supabase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Preloader from '../components/Preloader';

interface Address {
  id: string;
  userId: string;
  user_id?: string;
  label?: string;
  streetAddress?: string;
  street_address?: string;
  city: string;
  state: string;
  zipCode?: string;
  zip_code?: string;
  phoneNumber?: string;
  phone_number?: string;
  isDefault?: boolean;
  is_default?: boolean;
  latitude?: number;
  longitude?: number;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone_number: string;
  avatar_url?: string;
}

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // Remove local addresses state and use hook instead for consistency if possible, 
  // but to minimize refactor risk I will sync them or just use the hook's selection state.
  // Actually, the hook handles fetching too. Let's use the hook's data if possible, 
  // but ProfileScreen has its own fetchProfile that fetches addresses. 
  // For now, I will keep local fetching but mix in the global selection state.

  const [addresses, setAddresses] = useState<Address[]>([]);
  const { selectedDeliveryAddressId, setSelectedDeliveryAddress, updateAddress, deleteAddress, fetchAddresses: fetchAddressesFromHook } = useAddress(); // Use global selection state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  // Language Modal state
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // Edit address state
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<Partial<Address>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Silent return if user is not found (e.g. during logout)

      const { data: profileData, error: profileError } = await supabase
        .from('User')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: addressData, error: addressError } = await supabase
        .from('Address')
        .select('*')
        .eq('userId', user.id)
        .order('isDefault', { ascending: false });

      if (addressError) throw addressError;
      setAddresses(addressData || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Only show alert if it's a real fetch error, not a missing user
      Alert.alert(t('common.error'), t('profile.load_error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Refresh when navigating back to the screen
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  // Auto-select default address if none selected
  useEffect(() => {
    if (!selectedDeliveryAddressId && addresses.length > 0) {
      const defaultAddr = addresses.find(a => a.isDefault || a.is_default);
      if (defaultAddr) {
        setSelectedDeliveryAddress(defaultAddr.id);
      } else {
        // Fallback: select the first address if no default exists
        setSelectedDeliveryAddress(addresses[0].id);
      }
    }
  }, [addresses, selectedDeliveryAddressId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert(t('common.error'), t('profile.logout_error'));
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // First, remove default from all addresses
      await supabase
        .from('Address')
        .update({ isDefault: false })
        .eq('userId', user.id);

      // Set the selected address as default
      const { error } = await supabase
        .from('Address')
        .update({ isDefault: true })
        .eq('id', addressId);

      if (error) throw error;

      // Refresh addresses
      fetchProfile();
      Alert.alert(t('common.success'), t('profile.address_updated'));
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert(t('common.error'), t('profile.address_update_error'));
    }
  };



  const handleDeleteAddress = async (addressId: string) => {
    Alert.alert(
      t('addresses.delete_confirm_title'),
      t('addresses.delete_confirm_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('cart.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(addressId);
              fetchProfile();
              Alert.alert(t('common.success'), t('profile.address_deleted'));
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert(t('common.error'), t('profile.address_delete_error'));
            }
          },
        },
      ]
    );
  };

  // Validation function for editing an address
  const validateEditAddress = () => {
    let errors: Record<string, string> = {};

    if (!editingAddress.label?.trim()) {
      errors.label = t('addresses.label_required');
    }
    if (!editingAddress.street_address?.trim()) {
      errors.street_address = t('addresses.street_required');
    }
    if (!editingAddress.city?.trim()) {
      errors.city = t('addresses.city_required');
    }
    if (!editingAddress.state?.trim()) {
      errors.state = t('addresses.state_required');
    }
    if (!editingAddress.zip_code?.trim()) {
      errors.zip_code = t('addresses.postal_required');
    } else if (!/^\d{5}(-\d{4})?$/.test(editingAddress.zip_code.trim())) {
      errors.zip_code = t('addresses.postal_invalid');
    }
    if (!editingAddress.phone_number?.trim()) {
      errors.phone_number = t('addresses.phone_required');
    } else if (!/^\d{11}$/.test(editingAddress.phone_number.trim())) {
      errors.phone_number = t('addresses.phone_invalid');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle edit button press
  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address.id);
    setEditingAddress({
      label: address.label || t('profile.home'),
      street_address: address.streetAddress || address.street_address || '',
      city: address.city || '',
      state: address.state || '',
      zip_code: address.zipCode || address.zip_code || '',
      phone_number: address.phoneNumber || address.phone_number || '',
      latitude: address.latitude,
      longitude: address.longitude,
    });
    setValidationErrors({});
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingAddressId(null);
    setEditingAddress({});
    setValidationErrors({});
  };

  // Handle update address
  const handleUpdateAddress = async () => {
    if (!editingAddressId || !validateEditAddress()) return;

    try {
      // Map local snake_case fields to camelCase for the hook/DB
      const updateData: Partial<Address> = {
        label: editingAddress.label || t('profile.home'),
        streetAddress: editingAddress.street_address || editingAddress.streetAddress, // Handle both just in case
        city: editingAddress.city,
        state: editingAddress.state,
        zipCode: editingAddress.zip_code || editingAddress.zipCode,
        phoneNumber: editingAddress.phone_number || editingAddress.phoneNumber,
        latitude: editingAddress.latitude,
        longitude: editingAddress.longitude,
        isDefault: editingAddress.isDefault,
      };

      // Use the hook to update. The hook handles isDefault logic (unsetting others).
      await updateAddress(editingAddressId, updateData);

      setEditingAddressId(null);
      setEditingAddress({});
      setValidationErrors({});
      fetchProfile(); // Refresh profile/addresses
      Alert.alert(t('common.success'), t('profile.address_updated'));
    } catch (error) {
      console.error('Error updating address:', error);
      Alert.alert(t('common.error'), t('profile.address_update_error'));
    }
  };

  if (loading) {
    return (
      <Preloader fullScreen={true} />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          colors={[BrandColors.primary]}
          tintColor={BrandColors.primary}
        />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
              <Ionicons name="person" size={40} color={BrandColors.primary} />
            </View>
          )}
        </View>
        <Text style={styles.name}>{profile?.name || t('profile.user')}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditProfile' as never)}
          activeOpacity={1}
        >
          <Ionicons name="person-outline" size={24} color={BrandColors.primary} />
          <Text style={styles.actionButtonText}>{t('profile.edit_profile')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Orders' as never)}
          activeOpacity={1}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="receipt-outline" size={24} color={BrandColors.primary} />
          </View>
          <Text style={styles.actionButtonText}>{t('profile.orders')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => { }}
          activeOpacity={1}
        >
          <Ionicons name="heart-outline" size={24} color={BrandColors.primary} />
          <Text style={styles.actionButtonText}>{t('profile.favorites')}</Text>
        </TouchableOpacity>
      </View>

      {/* Address Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
            {t('profile.delivery_addresses')}
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('Addresses' as never)}
            activeOpacity={1}
          >
            <Ionicons name="add" size={24} color={BrandColors.primary} />
          </TouchableOpacity>
        </View>

        {addresses.map((address) => {
          const isSelected = selectedDeliveryAddressId === address.id;
          const isDefault = address.isDefault || address.is_default;
          return (
            <View key={address.id}>
              {/* Edit form for this address */}
              {editingAddressId === address.id ? (
                <View style={styles.editForm}>
                  <Text style={styles.editFormTitle}>{t('addresses.edit_address_title')}</Text>

                  <TextInput
                    style={[styles.editInput, validationErrors.label && styles.inputError]}
                    value={editingAddress.label || ""}
                    onChangeText={(text) => setEditingAddress({ ...editingAddress, label: text })}
                    placeholder={t('addresses.label_placeholder')}
                    underlineColorAndroid="transparent"
                  />
                  {validationErrors.label && (
                    <Text style={styles.errorText}>{validationErrors.label}</Text>
                  )}

                  <TextInput
                    style={[styles.editInput, validationErrors.street_address && styles.inputError]}
                    value={editingAddress.street_address || ""}
                    onChangeText={(text) => setEditingAddress({ ...editingAddress, street_address: text })}
                    placeholder={t('addresses.street_placeholder')}
                    underlineColorAndroid="transparent"
                  />
                  {validationErrors.street_address && (
                    <Text style={styles.errorText}>{validationErrors.street_address}</Text>
                  )}

                  <TextInput
                    style={[styles.editInput, validationErrors.city && styles.inputError]}
                    value={editingAddress.city || ""}
                    onChangeText={(text) => setEditingAddress({ ...editingAddress, city: text })}
                    placeholder={t('addresses.city_placeholder')}
                    underlineColorAndroid="transparent"
                  />
                  {validationErrors.city && (
                    <Text style={styles.errorText}>{validationErrors.city}</Text>
                  )}

                  <TextInput
                    style={[styles.editInput, validationErrors.state && styles.inputError]}
                    value={editingAddress.state || ""}
                    onChangeText={(text) => setEditingAddress({ ...editingAddress, state: text })}
                    placeholder={t('addresses.state_placeholder')}
                    underlineColorAndroid="transparent"
                  />
                  {validationErrors.state && (
                    <Text style={styles.errorText}>{validationErrors.state}</Text>
                  )}

                  <TextInput
                    style={[styles.editInput, validationErrors.zip_code && styles.inputError]}
                    value={editingAddress.zip_code || ""}
                    onChangeText={(text) => setEditingAddress({ ...editingAddress, zip_code: text })}
                    placeholder={t('addresses.postal_placeholder')}
                    keyboardType="numeric"
                    underlineColorAndroid="transparent"
                  />
                  {validationErrors.zip_code && (
                    <Text style={styles.errorText}>{validationErrors.zip_code}</Text>
                  )}

                  <TextInput
                    style={[styles.editInput, validationErrors.phone_number && styles.inputError]}
                    value={editingAddress.phone_number || ""}
                    onChangeText={(text) => {
                      const cleanedText = text.replace(/\D/g, '');
                      setEditingAddress({ ...editingAddress, phone_number: cleanedText });
                    }}
                    placeholder={t('addresses.phone_placeholder')}
                    keyboardType="phone-pad"
                    underlineColorAndroid="transparent"
                  />
                  {validationErrors.phone_number && (
                    <Text style={styles.errorText}>{validationErrors.phone_number}</Text>
                  )}

                  {/* Set as Default Button */}
                  {/* Set as Default Checkbox */}
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setEditingAddress({ ...editingAddress, isDefault: !editingAddress.isDefault })}
                    activeOpacity={1}
                  >
                    <Ionicons
                      name={editingAddress.isDefault ? "checkbox" : "square-outline"}
                      size={24}
                      color={editingAddress.isDefault ? BrandColors.primary : "#6B7280"}
                    />
                    <Text style={styles.checkboxLabel}>{t('addresses.set_default')}</Text>
                  </TouchableOpacity>

                  <View style={styles.editButtonContainer}>
                    <TouchableOpacity
                      style={[styles.editFormButton, styles.cancelButton]}
                      onPress={handleCancelEdit}
                      activeOpacity={1}
                    >
                      <Text style={[styles.editFormButtonText, styles.cancelButtonText]}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editFormButton, styles.updateButton]}
                      onPress={handleUpdateAddress}
                      activeOpacity={1}
                    >
                      <Text style={styles.editFormButtonText}>{t('addresses.update_address')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Address card display */
                <TouchableOpacity
                  onPress={() => setSelectedDeliveryAddress(address.id)}
                  activeOpacity={0.9}
                  style={[
                    styles.addressCard,
                    isSelected && {
                      backgroundColor: '#FFF',
                      borderColor: BrandColors.primary,
                      borderWidth: 1.5 // Reduced from 2
                    } // Border instead of fill
                  ]}
                >
                  <View style={styles.addressInfo}>
                    <View style={[styles.addressHeader, { flex: 1 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 0, flex: 1 }}>
                        <Ionicons
                          name={(address.isDefault || address.is_default) ? "location" : "location-outline"}
                          size={24}
                          color={(isSelected || address.isDefault || address.is_default) ? BrandColors.primary : "#6B7280"}
                          style={{ marginTop: 2 }}
                        />
                        <View style={{ marginLeft: 8, flex: 1 }}>
                          {address.label && (
                            <Text style={[styles.addressText, { fontWeight: '700', color: '#111827', marginBottom: 4 }]}>
                              {address.label.charAt(0).toUpperCase() + address.label.slice(1).toLowerCase()}
                            </Text>
                          )}
                           <Text style={[styles.addressText, { lineHeight: 22, color: '#111827' }]} numberOfLines={1} ellipsizeMode="tail">
                            {address.streetAddress || address.street_address || ''}, {address.city}
                          </Text>
                          <Text style={[styles.addressSubtext, { marginTop: 2, color: '#6B7280' }]} numberOfLines={1} ellipsizeMode="tail">
                            {address.state}, {address.zipCode || address.zip_code || ''}
                          </Text>
                           <Text style={[styles.addressSubtext, { marginTop: 2, color: '#6B7280' }]}>
                            {t('profile.phone_number')}: {address.phoneNumber || address.phone_number}
                          </Text>
                          {(address.isDefault || address.is_default) && (
                            <Text style={[styles.defaultBadge, { color: BrandColors.primary, fontWeight: '500', marginTop: 8 }]}>
                              {t('profile.default_address')}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>


                  </View>

                  <View style={styles.addressActions}>
                    <TouchableOpacity
                      onPress={() => handleEditAddress(address)}
                      style={styles.addressAction}
                      activeOpacity={1}
                    >
                      <MaterialIcons name="edit" size={22} color={BrandColors.primary} />
                    </TouchableOpacity>

                    {/* Always show delete button for all addresses */}
                    <TouchableOpacity
                      onPress={() => handleDeleteAddress(address.id)}
                      style={[styles.addressAction, styles.deleteAction]}
                      activeOpacity={1}
                    >
                      <MaterialCommunityIcons name="delete-outline" size={22} color={BrandColors.primary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setLanguageModalVisible(true)}
          activeOpacity={1}
        >
          <Ionicons name="language-outline" size={24} color="#4B5563" />
          <Text style={styles.settingText}>{t('profile.language')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#6B7280', marginRight: 8 }}>
              {t(`languages.${i18n.language}`)}
            </Text>
            <Ionicons name="chevron-forward" size={24} color="#4B5563" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('Notifications' as never)}
          activeOpacity={1}
        >
          <Ionicons name="notifications-outline" size={24} color="#4B5563" />
          <Text style={styles.settingText}>{t('profile.notifications')}</Text>
          <Ionicons name="chevron-forward" size={24} color="#4B5563" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('PaymentMethods' as never)}
          activeOpacity={1}
        >
          <Ionicons name="card-outline" size={24} color="#4B5563" />
          <Text style={styles.settingText}>{t('profile.payment_methods')}</Text>
          <Ionicons name="chevron-forward" size={24} color="#4B5563" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('Help' as never)}
          activeOpacity={1}
        >
          <Ionicons name="help-circle-outline" size={24} color="#4B5563" />
          <Text style={styles.settingText}>{t('profile.help_support')}</Text>
          <Ionicons name="chevron-forward" size={24} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={1}
      >
        <Ionicons name="log-out-outline" size={24} color="#fff" />
        <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.select_language')}</Text>

            {[
              { code: 'en', label: t('languages.en') },
              { code: 'ru', label: t('languages.ru') },
              { code: 'tr', label: t('languages.tr') },
              { code: 'az', label: t('languages.az') },
              { code: 'ar', label: t('languages.ar') },
            ].map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  i18n.language === lang.code && styles.languageOptionSelected
                ]}
                onPress={() => {
                  i18n.changeLanguage(lang.code);
                  setLanguageModalVisible(false);
                }}
              >
                <Text style={[
                  styles.languageOptionText,
                  i18n.language === lang.code && styles.languageOptionTextSelected
                ]}>
                  {lang.label}
                </Text>
                {i18n.language === lang.code && (
                  <Ionicons name="checkmark-circle" size={24} color={BrandColors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}


export default ProfileScreen;
