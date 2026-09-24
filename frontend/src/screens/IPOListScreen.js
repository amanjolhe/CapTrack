import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import IPOCard from '../components/IPOCard';
import { fetchIPOList, fetchIPOStats, toggleWatchlist } from '../api/client';

export default function IPOListScreen({ onSelectIPO, onOpenReminder }) {
  const [ipos, setIpos] = useState([]);
  const [stats, setStats] = useState({
    open_count: 0,
    upcoming_count: 0,
    closed_count: 0,
    listed_gains_count: 0,
    listed_loss_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedIssueType, setSelectedIssueType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [data, statsData] = await Promise.all([
      fetchIPOList(selectedStatus, searchQuery, selectedIssueType),
      fetchIPOStats()
    ]);
    setIpos(data);
    if (statsData) setStats(statsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus, selectedIssueType, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    const [data, statsData] = await Promise.all([
      fetchIPOList(selectedStatus, searchQuery, selectedIssueType),
      fetchIPOStats()
    ]);
    setIpos(data);
    if (statsData) setStats(statsData);
    setRefreshing(false);
  };

  const handleToggleWatch = async (id) => {
    await toggleWatchlist(id);
    setIpos(prev => prev.map(item => item.id === id ? { ...item, is_watched: !item.is_watched } : item));
  };

  const statusFilters = [
    { label: 'All', value: 'all' },
    { label: '🔥 Active', value: 'active' },
    { label: '⏳ Upcoming', value: 'upcoming' },
    { label: '📈 Listed', value: 'listed' },
  ];

  const issueTypeFilters = [
    { label: 'All', value: 'all' },
    { label: 'Mainboard', value: 'mainboard' },
    { label: 'SME', value: 'sme' },
  ];

  return (
    <View style={styles.container}>
      {/* Groww-style Top Statistics Summary Strip */}
      <View style={styles.statsStripContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Open IPOs</Text>
            <Text style={styles.statValue}>{stats.open_count || 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Upcoming IPOs</Text>
            <Text style={styles.statValue}>{stats.upcoming_count || 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Closed IPOs</Text>
            <Text style={styles.statValue}>{stats.closed_count || 0}</Text>
          </View>
          <View style={[styles.statCard, styles.gainCard]}>
            <Text style={styles.statTitle}>Listed in Gains</Text>
            <Text style={[styles.statValue, styles.gainText]}>{stats.listed_gains_count || 0}</Text>
          </View>
          <View style={[styles.statCard, styles.lossCard]}>
            <Text style={styles.statTitle}>Listed in Loss</Text>
            <Text style={[styles.statValue, styles.lossText]}>{stats.listed_loss_count || 0}</Text>
          </View>
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search IPO by name or symbol..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills: Mainboard vs SME */}
      <View style={styles.categoryRow}>
        <Text style={styles.categoryHeader}>Category:</Text>
        {issueTypeFilters.map(cat => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.catPill,
              selectedIssueType === cat.value && styles.catPillActive
            ]}
            onPress={() => setSelectedIssueType(cat.value)}
          >
            <Text style={[
              styles.catText,
              selectedIssueType === cat.value && styles.catTextActive
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 4 Status Tabs */}
      <View style={styles.filterRow}>
        {statusFilters.map(filter => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterPill,
              selectedStatus === filter.value && styles.filterPillActive
            ]}
            onPress={() => setSelectedStatus(filter.value)}
          >
            <Text style={[
              styles.filterText,
              selectedStatus === filter.value && styles.filterTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
          <Text style={styles.loadingText}>Fetching latest IPOs & GMP...</Text>
        </View>
      ) : (
        <FlatList
          data={ipos}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <IPOCard
              ipo={item}
              onPressDetails={onSelectIPO}
              onToggleWatch={handleToggleWatch}
              onOpenReminder={onOpenReminder}
            />
          )}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accentPrimary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No IPOs Found</Text>
              <Text style={styles.emptySub}>No IPOs match the selected filters or search query.</Text>
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
  statsStripContainer: {
    paddingTop: 10,
    paddingBottom: 4,
  },
  statsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
    alignItems: 'flex-start',
  },
  statTitle: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  gainCard: {
    borderColor: 'rgba(52, 211, 153, 0.3)',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  gainText: {
    color: theme.colors.accentSuccess,
  },
  lossCard: {
    borderColor: 'rgba(248, 113, 113, 0.3)',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
  },
  lossText: {
    color: theme.colors.accentDanger,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 9,
    color: theme.colors.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  clearBtn: {
    position: 'absolute',
    right: 28,
    top: 17,
  },
  clearText: {
    color: theme.colors.textMuted,
    fontSize: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  categoryHeader: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginRight: 4,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38BDF8',
  },
  catText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  catTextActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  filterPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillActive: {
    backgroundColor: theme.colors.pillActive,
    borderColor: theme.colors.accentPrimary,
  },
  filterText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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
