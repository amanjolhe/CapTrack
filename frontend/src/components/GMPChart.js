import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

export default function GMPChart({ gmpHistory, issuePrice }) {
  if (!gmpHistory || gmpHistory.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No GMP history recorded yet.</Text>
      </View>
    );
  }

  const maxGmp = Math.max(...gmpHistory.map(g => g.gmp_amount), 50);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Grey Market Premium (GMP) Trend</Text>
      <Text style={styles.subText}>Sources: gmptoday.in & Downstox API</Text>

      {/* Visual GMP Trend Chart */}
      <View style={styles.chartContainer}>
        {gmpHistory.map((item, index) => {
          const heightPct = Math.min(((item.gmp_amount || 0) / maxGmp) * 100, 100);
          return (
            <View key={index} style={styles.columnGroup}>
              <Text style={styles.gmpValueLabel}>+₹{item.gmp_amount}</Text>
              <Text style={styles.gmpGainLabel}>{item.estimated_gain_percent}%</Text>

              <View style={styles.barTrack}>
                <View 
                  style={[
                    styles.barFill, 
                    { height: `${Math.max(heightPct, 15)}%` }
                  ]} 
                />
              </View>

              <Text style={styles.dateLabel}>{item.recorded_at.split('T')[0]}</Text>
            </View>
          );
        })}
      </View>

      {/* Highlights Box */}
      {gmpHistory.length > 0 && (
        <View style={styles.summaryBox}>
          <View style={styles.summaryCol}>
            <Text style={styles.sumLabel}>Latest Premium</Text>
            <Text style={styles.sumVal}>+₹{gmpHistory[gmpHistory.length - 1].gmp_amount}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryCol}>
            <Text style={styles.sumLabel}>Est. Listing Price</Text>
            <Text style={styles.sumVal}>₹{(issuePrice || 0) + gmpHistory[gmpHistory.length - 1].gmp_amount}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryCol}>
            <Text style={styles.sumLabel}>Expected Gain</Text>
            <Text style={[styles.sumVal, { color: theme.colors.accentSuccess }]}>
              {gmpHistory[gmpHistory.length - 1].estimated_gain_percent}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textMuted,
  },
  sectionHeader: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  subText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: 16,
  },
  columnGroup: {
    alignItems: 'center',
    flex: 1,
  },
  gmpValueLabel: {
    color: theme.colors.accentSuccess,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  gmpGainLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
  },
  barTrack: {
    width: 24,
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: theme.colors.accentSuccess,
    borderRadius: 6,
  },
  dateLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
    justifyContent: 'space-around',
  },
  summaryCol: {
    alignItems: 'center',
  },
  sumLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  sumVal: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  }
});
