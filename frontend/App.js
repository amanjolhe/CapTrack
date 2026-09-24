import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { theme } from './src/theme/theme';
import Header from './src/components/Header';
import IPOListScreen from './src/screens/IPOListScreen';
import IPODetailsScreen from './src/screens/IPODetailsScreen';
import WatchlistScreen from './src/screens/WatchlistScreen';
import ReminderScreen from './src/screens/ReminderScreen';
import ReminderModal from './src/components/ReminderModal';
import { setReminder } from './src/api/client';

// Configure Expo Notification Handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [activeTab, setActiveTab] = useState('all'); // all, watchlist, reminders
  const [selectedIPOId, setSelectedIPOId] = useState(null);
  
  // Reminder modal state
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [targetIPOForReminder, setTargetIPOForReminder] = useState(null);

  useEffect(() => {
    // Request Push Notification Permissions
    async function requestPermissions() {
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log("Push notification permission not granted.");
        }
      }
    }
    requestPermissions();

    // Register Service Worker on web for background notification delivery when closed
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('CapTrack Service Worker registered:', reg.scope);
      }).catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
    }
  }, []);

  const handleOpenReminderModal = (ipo) => {
    setTargetIPOForReminder(ipo);
    setReminderModalVisible(true);
  };

  const handleScheduleReminder = async (ipoId, reminderTime, eventType) => {
    // Save to Backend API
    await setReminder(ipoId, reminderTime, eventType);

    const ipoName = targetIPOForReminder?.name || 'IPO';

    // Parse selected reminder time in client local device time zone
    let delaySeconds = 5; // Default 5s for fast verification
    try {
      const parts = reminderTime.trim().split(' ');
      if (parts.length === 2) {
        const [dPart, tPart] = parts;
        const [yr, mo, dy] = dPart.split('-').map(Number);
        const [hr, mn] = tPart.split(':').map(Number);
        const targetDate = new Date(yr, mo - 1, dy, hr, mn, 0);
        const diffMs = targetDate.getTime() - new Date().getTime();
        if (diffMs > 0) {
          delaySeconds = Math.max(2, Math.floor(diffMs / 1000));
        } else {
          delaySeconds = 1; // Instant notification if target time is past or now
        }
      }
    } catch (e) {
      console.warn("Error parsing client reminder date:", e);
    }

    // 1. Native Mobile Push Notifications (Expo)
    if (Platform.OS !== 'web') {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🔔 CapTrack IPO Alert: ${ipoName}`,
            body: `Event Alert: ${eventType.replace('_', ' ').toUpperCase()} scheduled for ${reminderTime}. Check live subscription & GMP!`,
            data: { ipoId: ipoId, eventType: eventType },
          },
          trigger: { seconds: delaySeconds },
        });
      } catch (err) {
        console.warn("Expo notification error:", err.message);
      }
    }

    // 2. Web & iOS Home Screen PWA Background Notifications (via Service Worker)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const title = `🔔 CapTrack IPO Alert: ${ipoName}`;
      const body = `Event Alert: ${eventType.replace('_', ' ').toUpperCase()} for ${reminderTime}. Check live GMP & subscription!`;

      const scheduleWebNotification = async () => {
        if (Notification.permission !== 'granted') {
          try {
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') return;
          } catch (e) {
            console.warn("Notification permission error:", e);
            return;
          }
        }

        // Try Service Worker registration for persistent background alert when app is closed
        if ('serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.active) {
              reg.active.postMessage({
                type: 'SCHEDULE_REMINDER',
                title,
                body,
                delaySeconds,
                reminderId: ipoId
              });
            }
            if (delaySeconds <= 5 && reg.showNotification) {
              reg.showNotification(title, {
                body,
                icon: '/favicon.png',
                badge: '/favicon.png'
              });
            }
            return;
          } catch (err) {
            console.warn("Service Worker notification error, falling back to direct window notification:", err);
          }
        }

        // Direct browser notification fallback
        if (delaySeconds <= 5) {
          new Notification(title, { body, icon: '/favicon.png' });
        } else {
          setTimeout(() => {
            new Notification(title, { body, icon: '/favicon.png' });
          }, delaySeconds * 1000);
        }
      };

      scheduleWebNotification();
    }

    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`Reminder Set! 🔔\nNotification scheduled for ${ipoName} (${eventType.replace('_', ' ')}) at ${reminderTime}.`);
    } else {
      Alert.alert(
        "Reminder Set! 🔔",
        `Notification scheduled for ${ipoName} (${eventType.replace('_', ' ')}) at ${reminderTime}.`
      );
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.bgDark} />
      <View style={styles.container}>
        {/* Render Top Header when not in details view */}
        {!selectedIPOId && (
          <Header 
            activeTab={activeTab} 
            onTabChange={(tab) => {
              setActiveTab(tab);
              setSelectedIPOId(null);
            }} 
          />
        )}

        {/* View Switcher */}
        {selectedIPOId ? (
          <IPODetailsScreen 
            ipoId={selectedIPOId} 
            onBack={() => setSelectedIPOId(null)} 
            onOpenReminder={handleOpenReminderModal}
          />
        ) : activeTab === 'all' ? (
          <IPOListScreen 
            onSelectIPO={(id) => setSelectedIPOId(id)} 
            onOpenReminder={handleOpenReminderModal}
          />
        ) : activeTab === 'watchlist' ? (
          <WatchlistScreen 
            onSelectIPO={(id) => setSelectedIPOId(id)} 
            onOpenReminder={handleOpenReminderModal}
          />
        ) : (
          <ReminderScreen 
            onSelectIPO={(id) => setSelectedIPOId(id)}
          />
        )}

        {/* Push Notification Setup Modal */}
        <ReminderModal
          visible={reminderModalVisible}
          ipo={targetIPOForReminder}
          onClose={() => setReminderModalVisible(false)}
          onSchedule={handleScheduleReminder}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bgDark,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgDark,
  }
});
