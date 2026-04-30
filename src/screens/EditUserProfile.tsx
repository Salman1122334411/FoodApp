import * as React from "react";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { styles } from "./EditUserProfile.styles";
import { supabase } from "../lib/supabase";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Preloader from "../components/Preloader";
import { Colors as BrandColors } from "../constants/Colors";

export function EditProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t('profile.no_user_found'));

      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("User")
        .select("name, phoneNumber")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setName(data.name || "");
        setPhone(data.phoneNumber || "");
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('profile.name_required'));
      return;
    }

    try {
      setSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t('profile.no_user_found'));

      const updates = {
        name,
        phoneNumber: phone,
        updatedAt: new Date(),
      };

      const { error } = await supabase
        .from("User")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      Alert.alert(t('common.success'), t('profile.update_success'));
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Preloader fullScreen={true} />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Card */}
        <View style={styles.card}>
          {/* Profile Image Placeholder */}
          <View style={styles.profileImageContainer}>
            <View style={styles.imageWrapper}>
              <Ionicons name="person" size={60} color="#CBD5E1" />
              <TouchableOpacity style={styles.editImageIcon}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Header */}
          <Text style={styles.headerTitle}>{t('profile.edit_user_profile')}</Text>

          {/* Role Indicator */}
          <View style={styles.roleContainer}>
            <Ionicons name="person-circle-outline" size={20} color={BrandColors.primary} />
            <Text style={styles.roleText}>{t('profile.customer')}</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.full_name')}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('profile.name_placeholder')}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.phone_number')}</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder={t('profile.phone_placeholder')}
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.email')}</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={email}
                editable={false}
                placeholder={t('profile.email_placeholder')}
              />
            </View>

            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdate}
              disabled={saving}
            >
              {saving ? (
                <Preloader fullScreen={false} size={40} />
              ) : (
                <Text style={styles.updateButtonText}>{t('profile.update_profile')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default EditProfileScreen;