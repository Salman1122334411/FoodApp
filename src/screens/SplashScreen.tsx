import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function SplashScreenComponent() {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  const startAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FFFFFF']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>Fiesta</Text>
        <Text style={styles.subtitle}>Tasty & Healthy</Text>
        
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: 'https://marketplace.canva.com/EAFaFUz4aKo/2/0/1600w/canva-yellow-abstract-cooking-fire-free-logo-JmYWTjUsE-Q.jpg' }}

            style={styles.foodImage}
            resizeMode="contain"
          />
          <View style={styles.decorationLeft}>
            <Text style={styles.decorationEmoji}>🌿</Text>
          </View>
          <View style={styles.decorationRight}>
            <Text style={styles.decorationEmoji}>🍋</Text>
          </View>
          <View style={styles.decorationBottom}>
            <Text style={styles.decorationEmoji}>🌶️</Text>
          </View>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 18,
    color: '#000000',
    opacity: 0.9,
    marginBottom: 40,
    fontFamily: 'System',
  },
  imageContainer: {
    width: '80%',
    aspectRatio: 1,
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  decorationLeft: {
    position: 'absolute',
    left: -20,
    top: '50%',
  },
  decorationRight: {
    position: 'absolute',
    right: -20,
    top: '30%',
  },
  decorationBottom: {
    position: 'absolute',
    bottom: -20,
    left: '40%',
  },
  decorationEmoji: {
    fontSize: 24,
  },
});