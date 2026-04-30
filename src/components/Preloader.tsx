import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface PreloaderProps {
  fullScreen?: boolean;
  size?: number;
}

const Preloader: React.FC<PreloaderProps> = ({ fullScreen = true, size = 120 }) => {
  const jumpAnim = useRef(new Animated.Value(0)).current;
  const shadowOpacity = useRef(new Animated.Value(0.1)).current;
  const shadowScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const createAnimation = () => {
      return Animated.parallel([
        Animated.sequence([
          Animated.timing(jumpAnim, {
            toValue: -30,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(jumpAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(shadowOpacity, {
            toValue: 0.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(shadowOpacity, {
            toValue: 0.1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(shadowScale, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(shadowScale, {
            toValue: 0.5,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]);
    };

    Animated.loop(createAnimation()).start();
  }, [jumpAnim, shadowOpacity, shadowScale]);

  const content = (
    <View style={styles.content}>
      <Animated.View style={[styles.shadow, { opacity: shadowOpacity, transform: [{ scaleX: shadowScale }] }]} />
      <Animated.View style={{ transform: [{ translateY: jumpAnim }] }}>
        <Image
          source={require('../../assets/fiestaa-logo.png')}
          style={{ width: size, height: size, resizeMode: 'contain' }}
        />
      </Animated.View>
    </View>
  );

  if (fullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        {content}
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    height: 120, // Reduced height for tighter centering
    marginTop: 40, // Offset to visually balance the jump upwards
  },
  shadow: {
    position: 'absolute',
    bottom: 10,
    width: 50,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 10,
  },
});

export default Preloader;
