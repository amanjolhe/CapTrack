import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { theme } from '../theme/theme';
import { fetchReminders } from '../api/client';

export default function ReminderScreen({ onSelectIPO }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchReminders();
    setReminders(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const data = await fetchReminders();
    setReminders(data);
    setRefreshing(false);
  };

  const getEventBadge = (eventType) => {
    switch (eventType?.toLowerCase()) {
      case 'open_date':
        return { text: '🚀 Open Date Alert', bg: 'rgba(56, 189, 248, 0.15)', color: theme.colors.accentPrimary };
      case 'close_date':
        return { text: '⏳ Close Date Alert', bg: 'rgba(251, 191, 36, 0.15)', color: theme.colors.accentWarning };
      case 'allotment':
        return { text: '📊 Allotment Alert', bg: 'rgba(167, 139, 250, 0.15)', color: theme.colors.accentPurple };
      default:
        return { text: '🔔 Event Alert', bg: 'rgba(52, 211, 153, 0.15)', color: theme.colors.accentSuccess };
    }
  };

  const handleDeleteReminder = (id) => {
    Alert.alert("Cancel Reminder", "Remove scheduled push alert for this IPO?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Remove", 
        style: "destructive",
        onPress: () => setReminders(prev => prev.filter(r => r.reminder_id !== id))
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerTitleRow}>
        <Text style={styles.screenTitle}>🔔 Scheduled Push Reminders</Text>
        <Text style={styles.screenSub}>Device alerts set for IPO Opening, Closing, and Allotment events.</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
          <Text style={styles.loadingText}>Fetching Active Reminders...</Text>
        </View>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={item => item.reminder_id.toString()}
          renderItem={({ item }) => {
            const badge = getEventBadge(item.event_type);
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <TouchableOpacity onPress={() => onSelectIPO(item.ipo_id)}>
                    <Text style={styles.companyName}>{item.ipo_name}</Text>
                    <Text style={styles.symbolText}>{item.symbol}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteReminder(item.reminder_id)}>
                    <Text style={styles.deleteText}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.infoRow}>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                  </View>

                  <View style={styles.timeBox}>
                    <Text style={styles.timeLabel}>Alert Scheduled For</Text>
                    <Text style={styles.timeValue}>📅 {item.reminder_time}</Text>
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accentPrimary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>No Reminders Set</Text>
              <Text style={styles.emptySub}>Tap the bell icon on any IPO card to schedule push notifications.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgDark,
  },
  headerTitleRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  screenTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  screenSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  listPadding: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textMuted,
    marginTop: 12,
    fontSize: 13,
  },
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  companyName: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  symbolText: {
    color: theme.colors.accentPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteText: {
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  timeBox: {
    alignItems: 'flex-end',
  },
  timeLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },
  timeValue: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  }
});
