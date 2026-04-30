import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { styles } from './SignUpScreen.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Colors as BrandColors } from '../constants/Colors';

export const SignUpScreen = ({ navigation }: { navigation: any }) => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  // Simple email validation regex
  const validateEmail = (email: string) => {
    const re = /^\S+@\S+\.\S+$/;
    return re.test(email);
  };

  const handleSignUp = async () => {
    // Reset previous errors
    setErrors({ fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '' });
    let valid = true;
    const newErrors = { fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '' };

    // Full Name validations
    if (!fullName) {
      newErrors.fullName = t('signup.error_name_required');
      valid = false;
    }

    // Email validations
    if (!email) {
      newErrors.email = t('signup.error_email_required');
      valid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = t('signup.error_email_invalid');
      valid = false;
    }

    // Phone Number validations
    if (!phoneNumber) {
      newErrors.phoneNumber = t('signup.error_phone_required');
      valid = false;
    }

    // Password validations
    if (!password) {
      newErrors.password = t('signup.error_password_required');
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = t('signup.error_password_length');
      valid = false;
    }

    // Confirm Password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = t('signup.error_confirm_password_required');
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('signup.error_passwords_do_not_match');
      valid = false;
    }

    if (!valid) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Change redirect to point to your EmailConfirmation route (deep link)
          emailRedirectTo: 'fiestaa://emailConfirmation',
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
          },
        },
      });

      if (error) throw error;

      // Navigate to the Email Confirmation screen and pass the email address
      navigation.navigate('EmailConfirmation', { email });
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Image
          source={require('../../assets/fiestaa-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Description */}
        <Text style={styles.description}>
          <Text style={styles.boldText}>{t('signup.description_bold')}</Text> {t('signup.description')}
        </Text>

        {/* Full Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('signup.full_name_label')}</Text>
          <TextInput
            style={[styles.input, errors.fullName && styles.inputError]}
            placeholder={t('signup.full_name_placeholder')}
            placeholderTextColor="#9CA3AF"
            value={fullName}
            underlineColorAndroid="transparent"
            onChangeText={(text) => {
              setFullName(text);
              if (errors.fullName) {
                setErrors((prev) => ({ ...prev, fullName: '' }));
              }
            }}
            autoCapitalize="words"
            editable={!loading}
          />
          {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('signup.email_label')}</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder={t('signup.email_placeholder')}
            placeholderTextColor="#9CA3AF"
            value={email}
            underlineColorAndroid="transparent"
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) {
                setErrors((prev) => ({ ...prev, email: '' }));
              }
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        {/* Phone Number Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('signup.phone_label')}</Text>
          <TextInput
            style={[styles.input, errors.phoneNumber && styles.inputError]}
            placeholder={t('signup.phone_placeholder')}
            placeholderTextColor="#9CA3AF"
            value={phoneNumber}
            underlineColorAndroid="transparent"
            onChangeText={(text) => {
              setPhoneNumber(text);
              if (errors.phoneNumber) {
                setErrors((prev) => ({ ...prev, phoneNumber: '' }));
              }
            }}
            keyboardType="phone-pad"
            editable={!loading}
          />
          {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('signup.password_label')}</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
              placeholder={t('signup.password_placeholder')}
              placeholderTextColor="#9CA3AF"
              value={password}
              underlineColorAndroid="transparent"
              onChangeText={(text: string) => {
                setPassword(text);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: '' }));
                }
              }}
              secureTextEntry={!passwordVisible}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.passwordVisibilityButton}
              onPress={() => setPasswordVisible(!passwordVisible)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={passwordVisible ? "eye" : "eye-off"}
                size={24}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('signup.confirm_password_label')}</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput, errors.confirmPassword && styles.inputError]}
              placeholder={t('signup.confirm_password_placeholder')}
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              underlineColorAndroid="transparent"
              onChangeText={(text: string) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }
              }}
              secureTextEntry={!confirmPasswordVisible}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.passwordVisibilityButton}
              onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={confirmPasswordVisible ? "eye" : "eye-off"}
                size={24}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={1}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('signup.sign_up')}</Text>
          )}
        </TouchableOpacity>

        {/* Sign In Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
          activeOpacity={1}
          style={styles.linkContainer}
        >
          <Text style={styles.linkText}>{t('signup.have_account')} <Text style={styles.linkTextBold}>{t('signup.sign_in_link')}</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
};


export default SignUpScreen;

