import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors as BrandColors } from '../constants/Colors';

interface QuantitySelectorProps {
  initialQuantity: number;
  onUpdate: (quantity: number) => void;
  containerStyle?: any;
  size?: 'small' | 'medium';
  alwaysExpanded?: boolean;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  initialQuantity,
  onUpdate,
  containerStyle,
  size = 'small', // Universally use small
  alwaysExpanded = false,
}) => {
  const isSmall = size === 'small';
  // States: 'idle' (just +), 'expanded' ( - count + ), 'badge' (orange circle with count)
  const [mode, setMode] = useState<'idle' | 'expanded' | 'badge'>(
    alwaysExpanded ? 'expanded' : (initialQuantity > 0 ? 'badge' : 'idle')
  );
  const [quantity, setQuantity] = useState(initialQuantity);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQuantity(initialQuantity);
    if (initialQuantity === 0) {
      setMode('idle');
    } else if (mode === 'idle') {
      setMode('badge');
    }
  }, [initialQuantity]);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setTimeout(() => {
      if (quantity > 0) {
        setMode('badge');
      } else {
        setMode('idle');
      }
    }, 3000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleIncrement = () => {
    const newQty = quantity + 1;
    setQuantity(newQty);
    onUpdate(newQty);
    setMode('expanded');
    startTimer();
  };

  const handleDecrement = () => {
    if (quantity === 0) return;
    const newQty = quantity - 1;
    setQuantity(newQty);
    onUpdate(newQty);
    if (newQty === 0) {
      setMode('idle');
      stopTimer();
    } else {
      setMode('expanded');
      startTimer();
    }
  };

  const handlePressMode = () => {
    if (mode === 'idle') {
      handleIncrement();
    } else if (mode === 'badge') {
      setMode('expanded');
      startTimer();
    }
  };

  // UI rendering based on mode
  if (mode === 'idle') {
    return (
      <TouchableOpacity
        style={[
          styles.baseContainer, 
          isSmall ? styles.idleContainerSmall : styles.idleContainer, 
          containerStyle
        ]}
        onPress={handlePressMode}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={isSmall ? 18 : 24} color="#111827" />
      </TouchableOpacity>
    );
  }

  if (mode === 'badge') {
    return (
      <TouchableOpacity
        style={[
          styles.baseContainer, 
          isSmall ? styles.badgeContainerSmall : styles.badgeContainer, 
          containerStyle
        ]}
        onPress={handlePressMode}
        activeOpacity={0.8}
      >
        <Text style={[styles.badgeText, isSmall && styles.badgeTextSmall]}>{quantity}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[
      styles.baseContainer, 
      isSmall ? styles.expandedContainerSmall : styles.expandedContainer, 
      containerStyle
    ]}>
      <TouchableOpacity
        style={isSmall ? styles.actionBtnSmall : styles.actionBtn}
        onPress={handleDecrement}
        activeOpacity={0.7}
      >
        {quantity === 1 ? (
          <Ionicons name="trash-outline" size={isSmall ? 14 : 18} color="#111827" />
        ) : (
          <Ionicons name="remove" size={isSmall ? 16 : 20} color="#111827" />
        )}
      </TouchableOpacity>

      <Text style={[styles.quantityText, isSmall && styles.quantityTextSmall]}>{quantity}</Text>

      <TouchableOpacity
        style={isSmall ? styles.actionBtnSmall : styles.actionBtn}
        onPress={handleIncrement}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={isSmall ? 16 : 20} color="#111827" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    // @ts-ignore
    boxShadow: '0px 2px 8px rgba(0,0,0,0.12)',
    elevation: 4,
  },
  idleContainer: {
    width: 40,
    height: 40,
  },
  idleContainerSmall: {
    width: 30,
    height: 30,
  },
  badgeContainer: {
    width: 40,
    height: 40,
    backgroundColor: BrandColors.primary, // Orange theme circle
  },
  badgeContainerSmall: {
    width: 28,
    height: 28,
    backgroundColor: BrandColors.primary,
  },
  badgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  badgeTextSmall: {
    fontSize: 12,
  },
  expandedContainer: {
    flexDirection: 'row',
    width: 100, // Fixed width for controls
    height: 40,
    paddingHorizontal: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandedContainerSmall: {
    flexDirection: 'row',
    width: 80,
    height: 30,
    paddingHorizontal: 2,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnSmall: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  quantityTextSmall: {
    fontSize: 14,
  },
});

export default QuantitySelector;
