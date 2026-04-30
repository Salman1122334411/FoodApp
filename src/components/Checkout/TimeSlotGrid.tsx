import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface Slot {
  id: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  isAvailable: boolean;
}

interface TimeSlotGridProps {
  slots: Slot[];
  selectedSlotId: string | null;
  onSlotChange: (slotId: string, label: string) => void;
  isLoading?: boolean;
}

export const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  slots,
  selectedSlotId,
  onSlotChange,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Fetching available slots...</Text>
      </View>
    );
  }

  if (slots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={32} color="#92400E" style={{ marginBottom: 10 }} />
        <Text style={styles.emptyText}>No delivery slots available for this date.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {slots.map((slot) => {
          const isSelected = selectedSlotId === slot.id;
          const label = `${slot.startTime} - ${slot.endTime}`;

          return (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.slotButton,
                isSelected && styles.selectedSlotButton,
                !slot.isAvailable && styles.disabledSlot,
              ]}
              disabled={!slot.isAvailable}
              onPress={() => onSlotChange(slot.id, label)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isSelected ? "checkmark-circle" : "time-outline"} 
                size={18} 
                color={isSelected ? "#FFF" : (slot.isAvailable ? '#6B7280' : '#9CA3AF')} 
                style={{ marginRight: 10 }}
              />
              <Text style={[
                styles.slotText,
                isSelected && styles.selectedText,
                !slot.isAvailable && styles.disabledText,
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotButton: {
    flexDirection: 'row',
    paddingVertical: 18, // Increased for better touch target and breathability
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    width: '48%', // Adjusted for gap
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16, // Increased gap between rows
  },
  selectedSlotButton: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
  },
  disabledSlot: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
  },
  slotText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '700', // Reduced from 800
  },
  disabledText: {
    color: '#D1D5DB',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 12,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
  },
});
