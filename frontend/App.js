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
  }, []);

  const handleOpenReminderModal = (ipo) => {
    setTargetIPOForReminder(ipo);
    setReminderModalVisible(true);
  };

  const handleScheduleReminder = async (ipoId, reminderTime, eventType) => {
    // Save to Backend API
    await setReminder(ipoId, reminderTime, eventType);

    // Schedule local push notification
    if (Platform.OS !== 'web') {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🔔 CapTrack IPO Alert: ${targetIPOForReminder?.name}`,
            body: `Event Alert: ${eventType.toUpperCase()} scheduled for ${reminderTime}. Check live subscription & GMP!`,
            data: { ipoId: ipoId, eventType: eventType },
          },
          trigger: { seconds: 5 }, // Immediate demo trigger or parsed date trigger
        });
      } catch (err) {
        console.warn("Notification scheduling warning:", err.message);
      }
    }

    Alert.alert(
      "Reminder Set! 🔔",
      `Notification scheduled for ${targetIPOForReminder?.name} (${eventType.replace('_', ' ')}) at ${reminderTime}.`
    );
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
