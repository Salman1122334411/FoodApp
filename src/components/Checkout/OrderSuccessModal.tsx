import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { Colors as BrandColors } from '../../constants/Colors';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface OrderSuccessModalProps {
  isVisible: boolean;
  onTrack: () => void;
  onHome: () => void;
  orderId?: string;
}

export function OrderSuccessModal({ isVisible, onTrack, onHome, orderId }: OrderSuccessModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      isVisible={isVisible}
      backdropOpacity={0.5}
      animationIn="zoomInUp"
      animationOut="zoomOutDown"
      useNativeDriver
      style={styles.modal}
    >
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={80} color={BrandColors.primary} />
          </View>
        </View>

        <Text style={styles.title}>{t('common.success')}</Text>
        <Text style={styles.subtitle}>{t('checkout.success_message')}</Text>
        
        {orderId && (
          <Text style={styles.orderId}>Order #{orderId.slice(-5).toUpperCase()}</Text>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={onTrack}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Track My Order</Text>
            <Ionicons name="map-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={onHome}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF0ED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#FFF8F6',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 50,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: BrandColors.primary,
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '700',
  },
});
