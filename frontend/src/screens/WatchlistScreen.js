import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { theme } from '../theme/theme';
import IPOCard from '../components/IPOCard';
import { fetchWatchlist, toggleWatchlist } from '../api/client';

export default function WatchlistScreen({ onSelectIPO, onOpenReminder }) {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchWatchlist();
    setWatchlist(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const data = await fetchWatchlist();
    setWatchlist(data);
    setRefreshing(false);
  };

  const handleToggleWatch = async (id) => {
    await toggleWatchlist(id);
    setWatchlist(prev => prev.filter(item => item.ipo.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerTitleRow}>
        <Text style={styles.screenTitle}>⭐ Your Bookmarked IPOs</Text>
        <Text style={styles.screenSub}>Track live GMP movement and subscription updates in real-time.</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
          <Text style={styles.loadingText}>Fetching Watchlist...</Text>
        </View>
      ) : (
        <FlatList
          data={watchlist}
          keyExtractor={item => item.watchlist_id.toString()}
          renderItem={({ item }) => (
            <IPOCard
              ipo={{
                ...item.ipo,
                latest_gmp: item.latest_gmp,
                est_listing_gain_percent: item.est_listing_gain_percent,
                total_subscription_x: item.total_subscription_x,
                is_watched: true
              }}
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
              <Text style={styles.emptyIcon}>⭐</Text>
              <Text style={styles.emptyTitle}>Watchlist is Empty</Text>
              <Text style={styles.emptySub}>Tap the star icon on any IPO card to track it here.</Text>
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
