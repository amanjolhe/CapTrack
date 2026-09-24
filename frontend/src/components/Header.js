import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';

export default function Header({ activeTab, onTabChange }) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>CT</Text>
          </View>
          <View>
            <Text style={styles.title}>CapTrack</Text>
            <Text style={styles.subtitle}>IPO Intelligence & GMP Tracker</Text>
          </View>
        </View>

        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>NSE/BSE LIVE</Text>
        </View>
      </View>

      {/* Main Navigation Tabs */}
      <View style={styles.navBar}>
        <TouchableOpacity 
          style={[styles.navTab, activeTab === 'all' && styles.navTabActive]} 
          onPress={() => onTabChange('all')}
        >
          <Text style={[styles.navText, activeTab === 'all' && styles.navTextActive]}>🔥 All IPOs</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navTab, activeTab === 'watchlist' && styles.navTabActive]} 
          onPress={() => onTabChange('watchlist')}
        >
          <Text style={[styles.navText, activeTab === 'watchlist' && styles.navTextActive]}>⭐ Watchlist</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navTab, activeTab === 'reminders' && styles.navTabActive]} 
          onPress={() => onTabChange('reminders')}
        >
          <Text style={[styles.navText, activeTab === 'reminders' && styles.navTextActive]}>🔔 Reminders</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardBg,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.pillActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 18,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accentSuccess,
    marginRight: 6,
  },
  liveText: {
    color: theme.colors.accentSuccess,
    fontSize: 10,
    fontWeight: '700',
  },
  navBar: {
    flexDirection: 'row',
    gap: 8,
  },
  navTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  navTabActive: {
    backgroundColor: theme.colors.pillActive,
  },
  navText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  }
});
