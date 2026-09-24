import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';

export default function IPOCard({ ipo, onPressDetails, onToggleWatch, onOpenReminder }) {
  const getStatusStyle = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'waiting for allotment') {
      return { 
        bg: 'rgba(251, 191, 36, 0.18)', 
        text: '#FBBF24', 
        border: 'rgba(251, 191, 36, 0.5)',
        label: '⏳ WAITING FOR ALLOTMENT' 
      };
    }
    if (s === 'pre apply') {
      return { 
        bg: 'rgba(59, 130, 246, 0.18)', 
        text: '#60A5FA', 
        border: 'rgba(59, 130, 246, 0.5)',
        label: '⚡ PRE APPLY' 
      };
    }
    if (s === 'active' || s === 'ongoing') {
      return { 
        bg: 'rgba(52, 211, 153, 0.18)', 
        text: '#34D399', 
        border: 'rgba(52, 211, 153, 0.5)',
        label: '🔥 ACTIVE (APPLY NOW)' 
      };
    }
    if (s === 'upcoming') {
      return { 
        bg: 'rgba(167, 139, 250, 0.18)', 
        text: '#A78BFA', 
        border: 'rgba(167, 139, 250, 0.5)',
        label: '📅 UPCOMING (TBA)' 
      };
    }
    if (s === 'listed') {
      return { 
        bg: 'rgba(56, 189, 248, 0.18)', 
        text: '#38BDF8', 
        border: 'rgba(56, 189, 248, 0.5)',
        label: '📈 LISTED' 
      };
    }
    return { 
      bg: 'rgba(100, 116, 139, 0.18)', 
      text: '#94A3B8', 
      border: 'rgba(100, 116, 139, 0.5)',
      label: status?.toUpperCase() 
    };
  };

  const statusStyle = getStatusStyle(ipo.status);

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.85} 
      onPress={() => onPressDetails(ipo.id)}
    >
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          <Text style={styles.companyName} numberOfLines={1}>{ipo.name}</Text>
          <View style={styles.symbolRow}>
            <Text style={styles.symbolText}>{ipo.symbol}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.exchangeText}>{ipo.exchange}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={[styles.typeText, ipo.issue_type === 'SME' && styles.smeTypeText]}>{ipo.issue_type || 'Mainboard'}</Text>
          </View>
        </View>

        <View style={styles.actionsRight}>
          <TouchableOpacity 
            style={[styles.iconBtn, ipo.is_watched && styles.watchedBtn]} 
            onPress={() => onToggleWatch(ipo.id)}
          >
            <Text style={styles.iconBtnText}>{ipo.is_watched ? '★' : '☆'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={() => onOpenReminder(ipo)}
          >
            <Text style={styles.iconBtnText}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Badges Row */}
      <View style={styles.badgeRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
        </View>

        {/* LTP Pill for Listed IPOs vs Live GMP Pill for Active/Upcoming */}
        {ipo.status?.toLowerCase() === 'listed' ? (
          <View style={[styles.gmpPill, { backgroundColor: (ipo.est_listing_gain_percent || 0) >= 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)' }]}>
            <Text style={styles.gmpLabel}>LTP </Text>
            <Text style={[styles.gmpValue, { color: (ipo.est_listing_gain_percent || 0) >= 0 ? '#34D399' : '#F87171' }]}>
              ₹{ipo.listing_price || ipo.issue_price_max || 0}
            </Text>
            <Text style={[styles.gmpPercent, { color: (ipo.est_listing_gain_percent || 0) >= 0 ? '#34D399' : '#F87171' }]}>
              {' '}({(ipo.est_listing_gain_percent || 0) >= 0 ? '+' : ''}{ipo.est_listing_gain_percent || 0}%)
            </Text>
          </View>
        ) : (
          <View style={styles.gmpPill}>
            <Text style={styles.gmpLabel}>GMP </Text>
            <Text style={styles.gmpValue}>+₹{ipo.latest_gmp || 0}</Text>
            <Text style={styles.gmpPercent}> ({ipo.est_listing_gain_percent || 0}%)</Text>
          </View>
        )}

        {/* Subscription Badge */}
        {ipo.total_subscription_x > 0 && (
          <View style={styles.subPill}>
            <Text style={styles.subLabel}>Sub </Text>
            <Text style={styles.subValue}>{ipo.total_subscription_x}x</Text>
          </View>
        )}
      </View>

      {/* Financial Details Metrics */}
      <View style={styles.gridContainer}>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Price Band</Text>
          <Text style={styles.gridValue}>₹{ipo.issue_price_min} - ₹{ipo.issue_price_max}</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Lot Size</Text>
          <Text style={styles.gridValue}>{ipo.lot_size} Shares</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Issue Size</Text>
          <Text style={styles.gridValue}>₹{ipo.issue_size_cr} Cr</Text>
        </View>
      </View>

      {/* Footer Timeline */}
      <View style={styles.footerRow}>
        <Text style={styles.dateText}>
          📅 Open: <Text style={styles.dateHighlight}>{ipo.open_date}</Text>  |  Close: <Text style={styles.dateHighlight}>{ipo.close_date}</Text>
        </Text>
        <Text style={styles.detailsChevron}>View Analysis →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleArea: {
    flex: 1,
    marginRight: 8,
  },
  companyName: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolText: {
    color: theme.colors.accentPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  dotSeparator: {
    color: theme.colors.textMuted,
    marginHorizontal: 6,
    fontSize: 12,
  },
  exchangeText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  typeText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  smeTypeText: {
    color: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  actionsRight: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  watchedBtn: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderColor: theme.colors.accentWarning,
  },
  iconBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gmpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gmpBadgeBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  gmpLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  gmpValue: {
    color: theme.colors.accentSuccess,
    fontSize: 12,
    fontWeight: '800',
  },
  gmpPercent: {
    color: theme.colors.accentSuccess,
    fontSize: 11,
    fontWeight: '700',
  },
  subPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.subBadgeBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  subLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  subValue: {
    color: theme.colors.accentPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  gridContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  gridItem: {
    alignItems: 'flex-start',
  },
  gridLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  gridValue: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  dateText: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  dateHighlight: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  detailsChevron: {
    color: theme.colors.accentPrimary,
    fontSize: 12,
    fontWeight: '700',
  }
});
