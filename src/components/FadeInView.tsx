import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface FadeInViewProps {
  children: React.ReactNode;
  duration?: number;
}

/**
 * Wraps a screen to provide a smooth fade-in transition when it gains focus.
 * Used by the bottom tab navigator for a polished tab-switch experience.
 */
const FadeInView: React.FC<FadeInViewProps> = ({ children, duration = 250 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  useFocusEffect(
    React.useCallback(() => {
      // Reset values
      opacity.setValue(0);
      scale.setValue(0.98);

      // Run a powerful combination of animations
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          speed: 12,
          bounciness: 4,
          useNativeDriver: true,
        })
      ]).start();
    }, [opacity, scale, duration])
  );

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity,
          transform: [
            { scale }
          ]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default FadeInView;
