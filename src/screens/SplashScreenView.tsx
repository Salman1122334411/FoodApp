import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  Image,
  Animated,
} from 'react-native';
import { styles } from './SplashScreenView.styles';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';


const appVersion = Constants.expoConfig?.version ?? '1.0.0';

interface SplashScreenViewProps {
  onFinished: () => void;
}

export function SplashScreenView({ onFinished }: SplashScreenViewProps) {
  const { t } = useTranslation();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const versionOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1) Fade + scale in the logo
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      // 2) Fade in tagline
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 3) Fade in version
      Animated.timing(versionOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // 4) Hold for a moment, then finish
      Animated.delay(700),
    ]).start(() => {
      onFinished();
    });
  }, []);

  return (
    <LinearGradient
      colors={['#fff', '#FFF5F2']}
      style={styles.container}
    >
      {/* Decorative orange circle top-right */}
      <View style={styles.decorCircleTopRight} />
      <View style={styles.decorCircleBottomLeft} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <Image
          source={require('../../assets/fiestaa-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: textOpacity }]}>
        {t('splash.tagline')}
      </Animated.Text>

      {/* Version badge at the bottom */}
      <Animated.View style={[styles.versionContainer, { opacity: versionOpacity }]}>
        <Text style={styles.versionText}>v{appVersion}</Text>
      </Animated.View>
    </LinearGradient>
  );
}

