import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SchedulingDatePicker } from './SchedulingDatePicker';
import { TimeSlotGrid } from './TimeSlotGrid';
import { getDeliverySlots, getRestaurantByIdFromAPI } from '../../lib/api';
import { format } from 'date-fns';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DeliveryTimingCardProps {
  restaurantId: string;
  onTimingChange: (isScheduled: boolean, date: Date | null, slot: string | null) => void;
  t: (key: string) => string;
}

export const DeliveryTimingCard: React.FC<DeliveryTimingCardProps> = ({
  restaurantId,
  onTimingChange,
  t,
}) => {
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedSlotLabel, setSelectedSlotLabel] = useState<string | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [supportsScheduling, setSupportsScheduling] = useState(true);
  const [capabilityLoading, setCapabilityLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Fetch initial slots on mount to confirm availability
  useEffect(() => {
    const initScheduling = async () => {
      try {
        setCapabilityLoading(true);
        // We always assume scheduling is possible if the restaurant exists, 
        // as the web app shows it as available.
        setSupportsScheduling(true);
      } catch (error) {
        console.error('Error initializing scheduling:', error);
      } finally {
        setCapabilityLoading(false);
      }
    };

    if (restaurantId) {
      initScheduling();
    }
  }, [restaurantId]);

  // Fetch slots whenever the date changes
  useEffect(() => {
    if (isScheduled && supportsScheduling) {
      fetchSlots();
    }
  }, [selectedDate, isScheduled, supportsScheduling]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setSlotsError(null);
      const data = await getDeliverySlots(restaurantId, selectedDate);
      
      setSlots(data || []);

      // If we got data, but the currently selected slot is no longer in the list, reset it
      if (selectedSlotId && !data?.find((s: any) => s.id === selectedSlotId)) {
        handleSlotChange(null, null);
      }
    } catch (error) {
      console.error('Error fetching delivery slots from Web API:', error);
      setSlotsError(t('checkout.scheduling_unavailable'));
      setSlots([]);
      handleSlotChange(null, null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (scheduled: boolean) => {
    if (scheduled && !supportsScheduling) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsScheduled(scheduled);
    if (!scheduled) {
      onTimingChange(false, null, null);
    } else {
      onTimingChange(true, selectedDate, selectedSlotLabel);
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    // Notify parent immediately of date change, slot reset
    onTimingChange(isScheduled, date, null);
  };

  const handleSlotChange = (slotId: string | null, label: string | null) => {
    setSelectedSlotId(slotId);
    setSelectedSlotLabel(label);
    onTimingChange(isScheduled, selectedDate, label);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('checkout.delivery_timing')}</Text>
      </View>

      <View style={styles.timingContainer}>
        {/* Deliver Now Card */}
        <TouchableOpacity
          style={[
            styles.timingCard,
            !isScheduled && styles.activeTimingCard,
          ]}
          onPress={() => handleToggle(false)}
          activeOpacity={0.9}
        >
          <View style={styles.timingIconContainer}>
            <Ionicons 
              name="flash" 
              size={24} 
              color={!isScheduled ? '#FFF' : TEXT_GRAY} 
            />
          </View>
          <Text style={[styles.timingTitle, !isScheduled && styles.activeTimingTitle]}>
            {t('checkout.deliver_now')}
          </Text>
          <Text style={[styles.timingSubtext, !isScheduled && styles.activeTimingSubtext]}>
            {t('checkout.fastest_delivery')}
          </Text>
        </TouchableOpacity>

        {/* Schedule for Later Card */}
        <TouchableOpacity
          style={[
            styles.timingCard,
            isScheduled && styles.activeTimingCard,
            !supportsScheduling && styles.disabledTimingCard,
          ]}
          onPress={() => supportsScheduling && handleToggle(true)}
          activeOpacity={supportsScheduling ? 0.9 : 1}
        >
          <View style={styles.timingIconContainer}>
            <Ionicons 
              name="time" 
              size={24} 
              color={isScheduled ? '#FFF' : (!supportsScheduling ? '#D1D5DB' : TEXT_GRAY)} 
            />
          </View>
          <Text style={[
            styles.timingTitle, 
            isScheduled && styles.activeTimingTitle,
            !supportsScheduling && styles.disabledTimingTitle
          ]}>
            {t('checkout.schedule_later')}
          </Text>
          <Text style={[
            styles.timingSubtext, 
            isScheduled && styles.activeTimingSubtext,
            !supportsScheduling && styles.disabledTimingTitle
          ]}>
             {t('checkout.pick_your_time')}
          </Text>
        </TouchableOpacity>
      </View>

      {isScheduled && (
        <View style={styles.schedulingContent}>
          <Text style={styles.detailsLabel}>{t('checkout.select_date')}</Text>
          <SchedulingDatePicker 
            selectedDate={selectedDate} 
            onDateChange={handleDateChange} 
          />
          
          <Text style={styles.detailsLabel}>{t('checkout.available_slots')}</Text>
          {slotsError ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#EF4444" />
              <Text style={styles.errorText}>{slotsError}</Text>
            </View>
          ) : (
            <TimeSlotGrid 
              slots={slots} 
              selectedSlotId={selectedSlotId} 
              onSlotChange={handleSlotChange}
              isLoading={loading}
            />
          )}
        </View>
      )}
    </View>
  );
};

const TEXT_GRAY = '#6B7280';

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginTop: 32, // Further increased gap for better section separation
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3D1C12',
    letterSpacing: -0.5,
  },
  timingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  timingCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  activeTimingCard: {
    backgroundColor: Colors.primary,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  timingIconContainer: {
    marginBottom: 12,
  },
  timingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_GRAY,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  activeTimingTitle: {
    color: '#FFFFFF',
  },
  timingSubtext: {
    fontSize: 11,
    color: TEXT_GRAY,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  activeTimingSubtext: {
    color: 'rgba(255,255,255,0.8)',
  },
  schedulingContent: {
    marginTop: 20,
    backgroundColor: '#FFF',
    padding: 20, // Increased padding
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  detailsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  disabledTimingCard: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
    borderWidth: 1,
  },
  disabledTimingTitle: {
    color: '#D1D5DB',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 8,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});
