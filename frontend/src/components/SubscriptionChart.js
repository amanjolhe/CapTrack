import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../theme/theme';

export default function SubscriptionChart({ subscriptions }) {
  if (!subscriptions || subscriptions.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No subscription data available yet.</Text>
      </View>
    );
  }

  const latestSub = subscriptions[subscriptions.length - 1];

  const categories = [
    { label: "QIB (Institutional)", value: latestSub.qib_x, color: '#38BDF8' },
    { label: "NII (HNI > ₹10L)", value: latestSub.bii_x || latestSub.nii_x, color: '#A78BFA' },
    { label: "NII (Small ₹2L-10L)", value: latestSub.sii_x || (latestSub.nii_x * 0.7), color: '#C084FC' },
    { label: "Retail Investors", value: latestSub.retail_x, color: '#34D399' },
    { label: "Employees", value: latestSub.employee_x, color: '#FBBF24' },
    { label: "Total Over-subscription", value: latestSub.total_x, color: '#F43F5E', isTotal: true },
  ];

  const maxVal = Math.max(...categories.map(c => c.value || 0), 10);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Category-wise Subscription Breakdown</Text>
      <Text style={styles.subText}>Latest Data (Day {latestSub.day} - {latestSub.date})</Text>

      {/* Visual Category Subscription Bars */}
      <View style={styles.barList}>
        {categories.map((cat, idx) => {
          const widthPct = Math.min(((cat.value || 0) / maxVal) * 100, 100);
          return (
            <View key={idx} style={[styles.barRow, cat.isTotal && styles.totalRow]}>
              <View style={styles.labelRow}>
                <Text style={[styles.categoryLabel, cat.isTotal && styles.totalLabelText]}>
                  {cat.label}
                </Text>
                <Text style={[styles.categoryVal, { color: cat.color }, cat.isTotal && styles.totalValText]}>
                  {(cat.value || 0).toFixed(2)}x
                </Text>
              </View>

              <View style={styles.track}>
                <View 
                  style={[
                    styles.fillBar, 
                    { width: `${Math.max(widthPct, 2)}%`, backgroundColor: cat.color }
                  ]} 
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Day-Wise Subscription Matrix Table */}
      <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Day-wise Timeline Table</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: 50 }]}>Day</Text>
            <Text style={[styles.th, { width: 90 }]}>Date</Text>
            <Text style={[styles.th, { width: 70 }]}>QIB</Text>
            <Text style={[styles.th, { width: 70 }]}>NII</Text>
            <Text style={[styles.th, { width: 70 }]}>Retail</Text>
            <Text style={[styles.th, { width: 80 }]}>Total</Text>
          </View>

          {/* Table Rows */}
          {subscriptions.map((row, index) => (
            <View key={index} style={[styles.tr, index % 2 === 1 && styles.trEven]}>
              <Text style={[styles.td, { width: 50, fontWeight: '700' }]}>Day {row.day}</Text>
              <Text style={[styles.td, { width: 90 }]}>{row.date}</Text>
              <Text style={[styles.td, { width: 70, color: '#38BDF8' }]}>{row.qib_x}x</Text>
              <Text style={[styles.td, { width: 70, color: '#A78BFA' }]}>{row.nii_x}x</Text>
              <Text style={[styles.td, { width: 70, color: '#34D399' }]}>{row.retail_x}x</Text>
              <Text style={[styles.td, { width: 80, fontWeight: '800', color: '#F43F5E' }]}>{row.total_x}x</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
    marginBottom: 4,
  },
  subText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 16,
  },
  barList: {
    gap: 14,
  },
  barRow: {
    marginBottom: 4,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  totalLabelText: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: 14,
  },
  categoryVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  totalValText: {
    fontSize: 15,
  },
  track: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
    borderRadius: 4,
  },
  table: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginTop: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  th: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  tr: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  trEven: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  td: {
    color: theme.colors.textPrimary,
    fontSize: 12,
  }
});
