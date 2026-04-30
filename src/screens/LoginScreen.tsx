console.log('DEBUG: LoginScreen.tsx module evaluation started');
import React, { useState, useEffect } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    Alert,
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { styles } from './LoginScreen.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { Colors as BrandColors } from '../constants/Colors';

// Google Sign-In is only available in native standalone/dev-client builds
const isExpoGo = Constants.appOwnership === 'expo';

// Safe stub — avoids crashing in Expo Go where native modules are unavailable
let GoogleSignin: any = null;
let statusCodes: any = {};

try {
  if (!isExpoGo && Platform.OS !== 'web') {
    const gsi = require('@react-native-google-signin/google-signin');
    GoogleSignin = gsi.GoogleSignin;
    statusCodes = gsi.statusCodes;
    GoogleSignin.configure({
      webClientId: '601001909197-a7i7qjqvd5aimtojh9lub8vvafer2v0u.apps.googleusercontent.com',
    });
  }
} catch (e) {
  console.warn('Google Sign-In native module not available in this environment');
}

export const LoginScreen = ({ navigation }: { navigation: any }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);

    // Simple regex for email validation
    const validateEmail = (email: string) => {
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert(t('common.error'), t('login.error_fill_all'));
            return;
        }
        if (!validateEmail(email)) {
            Alert.alert(t('common.error'), t('login.error_invalid_email'));
            return;
        }

        try {
            setLoadingEmail(true);
            const { error, data } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            console.log('Logged in user:', data.user);
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
        } finally {
            setLoadingEmail(false);
        }
    };

    // Google Login Logic (Native only - not available in Expo Go)
    const handleGoogleLogin = async () => {
        if (isExpoGo || Platform.OS === 'web' || !GoogleSignin) {
            Alert.alert(t('common.info'), t('login.google_signin_not_available'));
            return;
        }
        try {
            setLoadingGoogle(true);
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.data?.idToken;

            if (idToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: idToken,
                });

                if (error) throw error;
            } else {
                throw new Error('No ID token present!');
            }
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                console.log('User cancelled login');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                console.log('Login in progress');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert(t('common.error'), t('login.error_google_play'));
            } else {
                console.error('Google login error:', error);
                Alert.alert(t('login.login_failed'), error.message);
            }
        } finally {
            setLoadingGoogle(false);
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

                {/* Title and Description */}
                <Text style={styles.description}>
                    <Text style={styles.boldText}>{t('login.description_bold')}</Text> {t('login.description')}
                </Text>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t('login.email_label')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('login.email_placeholder')}
                        placeholderTextColor="#9CA3AF"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!(loadingEmail || loadingGoogle)}
                        underlineColorAndroid="transparent"
                    />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t('login.password_label')}</Text>
                    <View style={styles.passwordInputContainer}>
                        <TextInput
                            style={[styles.input, styles.passwordInput]}
                            placeholder={t('login.password_placeholder')}
                            placeholderTextColor="#9CA3AF"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!passwordVisible}
                            editable={!(loadingEmail || loadingGoogle)}
                            underlineColorAndroid="transparent"
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
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                    style={[styles.button, (loadingEmail || loadingGoogle) && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loadingEmail || loadingGoogle}
                >
                    {loadingEmail ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>{t('login.sign_in')}</Text>
                    )}
                </TouchableOpacity>

                {/* Separator */}
                <View style={styles.separator}>
                    <View style={styles.separatorLine} />
                    <Text style={styles.separatorText}>{t('login.or')}</Text>
                    <View style={styles.separatorLine} />
                </View>

                {/* Google Login Button */}
                <TouchableOpacity
                    style={[styles.googleButton, loadingGoogle && styles.googleButtonDisabled]}
                    onPress={handleGoogleLogin}
                    disabled={loadingGoogle || loadingEmail}
                >
                    {loadingGoogle ? (
                        <ActivityIndicator color="#374151" />
                    ) : (
                        <>
                            <Image
                                source={require("../../assets/google-logo.png")}
                                style={styles.googleLogo}
                            />
                            <Text style={styles.googleButtonText}>{t('login.sign_in_google')}</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Sign Up Link */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('SignUp')}
                    disabled={loadingEmail || loadingGoogle}
                    style={styles.linkContainer}
                >
                    <Text style={styles.linkText}>{t('login.no_account')} <Text style={styles.linkTextBold}>{t('login.sign_up_link')}</Text></Text>
                </TouchableOpacity>
            </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};
