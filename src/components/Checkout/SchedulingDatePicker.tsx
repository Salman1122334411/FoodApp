import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { format, isSameDay } from 'date-fns';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface SchedulingDatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  daysCount?: number;
}

export const SchedulingDatePicker: React.FC<SchedulingDatePickerProps> = ({
  selectedDate,
  onDateChange,
}) => {
  const { t } = useTranslation();
  const [show, setShow] = React.useState(false);

  const onChange = (event: DateTimePickerEvent, date?: Date) => {
    // On Android, the picker closes itself
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    if (date) {
      onDateChange(date);
    }
  };

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.calendarCard}
        onPress={() => setShow(true)}
        activeOpacity={0.8}
      >
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="calendar-month" size={24} color={Colors.primary} />
        </View>
        <View style={styles.dateInfo}>
          <Text style={styles.dateLabel}>
            {isToday ? t('common.today', 'Today') : format(selectedDate, 'EEEE, d MMMM')}
          </Text>
          <Text style={styles.subLabel}>{t('checkout.tap_to_change_date', 'Tap to change date')}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'} // Spinner or default for better UX
          onChange={onChange}
          minimumDate={new Date()}
        />
      )}
      
      {/* On iOS, we might need a way to close the inline picker if it's not a modal, 
          but usually for this UI, a simple modal or the default drawer is best. 
          The user wanted a 'better calendar', inline/modal is perfect. */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  calendarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFD',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF1EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  subLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '600',
  },
});
