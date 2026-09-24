import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { theme } from '../theme/theme';

export default function ReminderModal({ visible, ipo, onClose, onSchedule }) {
  const [eventType, setEventType] = useState('open_date');
  const [selectedDate, setSelectedDate] = useState('2026-09-24');
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('30');
  const [ampm, setAmpm] = useState('AM');

  useEffect(() => {
    if (ipo) {
      const defaultDate = ipo.open_date && ipo.open_date !== 'TBA' ? ipo.open_date : '2026-09-24';
      setSelectedDate(defaultDate);
      setSelectedHour('09');
      setSelectedMinute('30');
      setAmpm('AM');
    }
  }, [ipo, visible]);

  if (!ipo) return null;

  const handleEventTypeChange = (type) => {
    setEventType(type);
    if (type === 'open_date') {
      setSelectedDate(ipo.open_date && ipo.open_date !== 'TBA' ? ipo.open_date : '2026-09-24');
      setSelectedHour('09');
      setSelectedMinute('30');
      setAmpm('AM');
    } else if (type === 'close_date') {
      setSelectedDate(ipo.close_date && ipo.close_date !== 'TBA' ? ipo.close_date : '2026-09-26');
      setSelectedHour('03');
      setSelectedMinute('30');
      setAmpm('PM');
    } else if (type === 'allotment') {
      setSelectedDate(ipo.close_date && ipo.close_date !== 'TBA' ? ipo.close_date : '2026-09-27');
      setSelectedHour('06');
      setSelectedMinute('00');
      setAmpm('PM');
    }
  };

  const get24HourTime = () => {
    let hrs = parseInt(selectedHour || '9', 10);
    if (isNaN(hrs)) hrs = 9;
    hrs = Math.max(1, Math.min(12, hrs));
    
    if (ampm === 'PM' && hrs < 12) hrs += 12;
    if (ampm === 'AM' && hrs === 12) hrs = 0;

    const hrsStr = hrs.toString().padStart(2, '0');
    let minsStr = selectedMinute.trim().padStart(2, '0');
    if (minsStr.length > 2) minsStr = minsStr.slice(0, 2);
    
    return `${hrsStr}:${minsStr}`;
  };

  const handleSave = async () => {
    if (!selectedDate.trim()) {
      Alert.alert("Error", "Please enter a valid date (YYYY-MM-DD).");
      return;
    }

    const time24 = get24HourTime();
    const formattedReminderTime = `${selectedDate.trim()} ${time24}`;

    // Trigger native iOS/Browser push notification permission prompt on user tap
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        try {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            console.log("Push notification permission granted!");
          }
        } catch (err) {
          console.warn("Notification request permission error:", err);
        }
      }
    }

    onSchedule(ipo.id, formattedReminderTime, eventType);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Set IPO Push Notification</Text>
          <Text style={styles.modalSub}>{ipo.name} ({ipo.symbol})</Text>

          {/* Event Type Switcher */}
          <Text style={styles.fieldLabel}>Select Event Alert</Text>
          <View style={styles.eventRow}>
            <TouchableOpacity 
              style={[styles.eventTab, eventType === 'open_date' && styles.eventTabActive]}
              onPress={() => handleEventTypeChange('open_date')}
            >
              <Text style={[styles.eventText, eventType === 'open_date' && styles.eventTextActive]}>🚀 Open Date</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.eventTab, eventType === 'close_date' && styles.eventTabActive]}
              onPress={() => handleEventTypeChange('close_date')}
            >
              <Text style={[styles.eventText, eventType === 'close_date' && styles.eventTextActive]}>⏳ Close Date</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.eventTab, eventType === 'allotment' && styles.eventTabActive]}
              onPress={() => handleEventTypeChange('allotment')}
            >
              <Text style={[styles.eventText, eventType === 'allotment' && styles.eventTextActive]}>📊 Allotment</Text>
            </TouchableOpacity>
          </View>

          {/* Calendar Date Input */}
          <Text style={styles.fieldLabel}>📅 Calendar Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.textInput}
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder="2026-09-24"
            placeholderTextColor={theme.colors.textMuted}
          />

          {/* Time & AM/PM Selector */}
          <Text style={styles.fieldLabel}>⏰ Select Time (12-Hour AM/PM)</Text>
          <View style={styles.timePickerRow}>
            {/* Hour Input */}
            <View style={styles.timeUnitBox}>
              <Text style={styles.unitLabel}>Hour</Text>
              <TextInput
                style={styles.unitInput}
                value={selectedHour}
                onChangeText={setSelectedHour}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="09"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <Text style={styles.colonSeparator}>:</Text>

            {/* Minute Input */}
            <View style={styles.timeUnitBox}>
              <Text style={styles.unitLabel}>Minute</Text>
              <TextInput
                style={styles.unitInput}
                value={selectedMinute}
                onChangeText={setSelectedMinute}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="30"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            {/* AM / PM Segmented Toggle */}
            <View style={styles.ampmToggleRow}>
              <TouchableOpacity 
                style={[styles.ampmBtn, ampm === 'AM' && styles.ampmBtnActive]}
                onPress={() => setAmpm('AM')}
              >
                <Text style={[styles.ampmText, ampm === 'AM' && styles.ampmTextActive]}>AM</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.ampmBtn, ampm === 'PM' && styles.ampmBtnActive]}
                onPress={() => setAmpm('PM')}
              >
                <Text style={[styles.ampmText, ampm === 'PM' && styles.ampmTextActive]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Formatted Preview Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              🔔 Alert Scheduled: <Text style={styles.highlightText}>{selectedDate} at {selectedHour}:{selectedMinute} {ampm}</Text>
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Schedule Alert</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  modalSub: {
    color: theme.colors.accentPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  fieldLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  eventRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  eventTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  eventTabActive: {
    backgroundColor: theme.colors.pillActive,
    borderColor: theme.colors.accentPrimary,
  },
  eventText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  eventTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 8,
    padding: 12,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeUnitBox: {
    flex: 1,
  },
  unitLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginBottom: 4,
    textAlign: 'center',
  },
  unitInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 8,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  colonSeparator: {
    color: theme.colors.accentPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 14,
  },
  ampmToggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginTop: 14,
  },
  ampmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  ampmBtnActive: {
    backgroundColor: theme.colors.accentPrimary,
  },
  ampmText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  ampmTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  infoBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  infoText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  highlightText: {
    color: theme.colors.accentPrimary,
    fontWeight: '800',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelText: {
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: theme.colors.accentSuccess,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveText: {
    color: '#0F172A',
    fontWeight: '800',
  }
});
