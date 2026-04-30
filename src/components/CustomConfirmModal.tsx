import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { Colors as BrandColors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';

interface CustomConfirmModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  iconName?: string;
}

export const CustomConfirmModal: React.FC<CustomConfirmModalProps> = ({
  isVisible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  confirmColor = BrandColors.primary,
  iconName = 'trash-outline',
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onCancel}
      onBackButtonPress={onCancel}
      backdropOpacity={0.5}
      animationIn="zoomIn"
      animationOut="zoomOut"
      useNativeDriver
      hideModalContentWhileAnimating
      style={styles.modal}
    >
      <View style={styles.container}>
        <View style={[styles.iconCircle, { backgroundColor: confirmColor + '10' }]}>
          <Ionicons name={iconName as any} size={32} color={confirmColor} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>{cancelText || t('common.cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.confirmButton, { backgroundColor: confirmColor }]} 
            onPress={onConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>{confirmText || t('common.confirm')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 340,
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
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
