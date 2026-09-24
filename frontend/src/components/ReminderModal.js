import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { theme } from '../theme/theme';

export default function ReminderModal({ visible, ipo, onClose, onSchedule }) {
  const [eventType, setEventType] = useState('open_date');
  const [reminderTime, setReminderTime] = useState('2026-09-24 09:30');

  if (!ipo) return null;

  const handleSave = () => {
    if (!reminderTime.trim()) {
      Alert.alert("Error", "Please enter a valid date and time.");
      return;
    }
    onSchedule(ipo.id, reminderTime, eventType);
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
              onPress={() => { setEventType('open_date'); setReminderTime(`${ipo.open_date || '2026-09-24'} 09:30`); }}
            >
              <Text style={[styles.eventText, eventType === 'open_date' && styles.eventTextActive]}>🚀 Open Date</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.eventTab, eventType === 'close_date' && styles.eventTabActive]}
              onPress={() => { setEventType('close_date'); setReminderTime(`${ipo.close_date || '2026-09-26'} 15:00`); }}
            >
              <Text style={[styles.eventText, eventType === 'close_date' && styles.eventTextActive]}>⏳ Close Date</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.eventTab, eventType === 'allotment' && styles.eventTabActive]}
              onPress={() => { setEventType('allotment'); setReminderTime(`${ipo.close_date || '2026-09-27'} 18:00`); }}
            >
              <Text style={[styles.eventText, eventType === 'allotment' && styles.eventTextActive]}>📊 Allotment</Text>
            </TouchableOpacity>
          </View>

          {/* Reminder Date & Time Input */}
          <Text style={styles.fieldLabel}>Reminder Date & Time (YYYY-MM-DD HH:MM)</Text>
          <TextInput
            style={styles.textInput}
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="2026-09-24 09:30"
            placeholderTextColor={theme.colors.textMuted}
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 A local push notification alert will trigger on your device at the specified time.
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
    marginBottom: 12,
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
  infoBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  infoText: {
    color: theme.colors.accentPrimary,
    fontSize: 11,
    lineHeight: 16,
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
