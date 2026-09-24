import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';
import { fetchIPODetails, fetchIPOSubscription } from '../api/client';
import SubscriptionChart from '../components/SubscriptionChart';
import GMPChart from '../components/GMPChart';

export default function IPODetailsScreen({ ipoId, onBack, onOpenReminder }) {
  const [data, setData] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, subscription, financials, risks

  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      const detailsRes = await fetchIPODetails(ipoId);
      const subsRes = await fetchIPOSubscription(ipoId);
      setData(detailsRes);
      setSubscriptions(subsRes);
      setLoading(false);
    }
    loadDetails();
  }, [ipoId]);

  if (loading || !data) {
    return (
      <View style={styles.loaderCenter}>
        <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
        <Text style={styles.loadingText}>Loading IPO Prospectus & Analytics...</Text>
      </View>
    );
  }

  const { metadata, latest_gmp, gmp_history, financials, gemini_summary } = data;
  const fin = financials && financials.length > 0 ? financials[0] : null;

  return (
    <View style={styles.container}>
      {/* Top Header Navigation */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Back to List</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.remindBtn}
          onPress={() => onOpenReminder(metadata)}
        >
          <Text style={styles.remindText}>🔔 Set Reminder</Text>
        </TouchableOpacity>
      </View>

      {/* Main Title & Symbol */}
      <View style={styles.titleSection}>
        <Text style={styles.companyTitle}>{metadata.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.symbolBadge}>{metadata.symbol}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.exchangeText}>{metadata.exchange}</Text>
          <Text style={styles.dot}>•</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{metadata.status}</Text>
          </View>
        </View>
      </View>

      {/* Detail Tabs Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'overview' && styles.tabItemActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'subscription' && styles.tabItemActive]}
          onPress={() => setActiveTab('subscription')}
        >
          <Text style={[styles.tabText, activeTab === 'subscription' && styles.tabTextActive]}>Subscription</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'financials' && styles.tabItemActive]}
          onPress={() => setActiveTab('financials')}
        >
          <Text style={[styles.tabText, activeTab === 'financials' && styles.tabTextActive]}>Financials & GMP</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'risks' && styles.tabItemActive]}
          onPress={() => setActiveTab('risks')}
        >
          <Text style={[styles.tabText, activeTab === 'risks' && styles.tabTextActive]}>Risks</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Contents */}
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Key Issue Parameters Grid */}
            <View style={styles.gridBox}>
              <View style={styles.gridCell}>
                <Text style={styles.cellLabel}>Price Band</Text>
                <Text style={styles.cellVal}>₹{metadata.issue_price_min} - ₹{metadata.issue_price_max}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.cellLabel}>Lot Size</Text>
                <Text style={styles.cellVal}>{metadata.lot_size} Shares</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.cellLabel}>Issue Size</Text>
                <Text style={styles.cellVal}>₹{metadata.issue_size_cr} Cr</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.cellLabel}>Listing Date</Text>
                <Text style={styles.cellVal}>{metadata.listing_date || 'TBA'}</Text>
              </View>
            </View>

            {/* Gemini AI Rating Card */}
            {gemini_summary && (
              <View style={styles.aiRatingCard}>
                <View style={styles.aiHeader}>
                  <Text style={styles.aiBadgeTitle}>✨ GEMINI AI SUMMARY & VERDICT</Text>
                  <View style={styles.verdictPill}>
                    <Text style={styles.verdictText}>{gemini_summary.ai_rating}</Text>
                  </View>
                </View>
                <Text style={styles.aiOverviewText}>{gemini_summary.company_overview}</Text>
              </View>
            )}

            {/* Promoters & Issue Objectives */}
            {gemini_summary && (
              <>
                <View style={styles.sectionBox}>
                  <Text style={styles.sectionHeading}>Founders & Promoters</Text>
                  <Text style={styles.bodyText}>{gemini_summary.promoters}</Text>
                </View>

                <View style={styles.sectionBox}>
                  <Text style={styles.sectionHeading}>Objects of the Issue</Text>
                  <Text style={styles.bodyText}>{gemini_summary.objectives}</Text>
                </View>

                <View style={styles.sectionBox}>
                  <Text style={styles.sectionHeading}>Key Business Strengths</Text>
                  <Text style={[styles.bodyText, { color: theme.colors.accentSuccess }]}>
                    {gemini_summary.strengths}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === 'subscription' && (
          <View style={styles.tabContent}>
            <SubscriptionChart subscriptions={subscriptions} />
          </View>
        )}

        {/* FINANCIALS TAB */}
        {activeTab === 'financials' && (
          <View style={styles.tabContent}>
            <GMPChart gmpHistory={gmp_history} issuePrice={metadata.issue_price_max} />

            {fin && (
              <View style={styles.sectionBox}>
                <Text style={styles.sectionHeading}>Financial Performance Summary ({fin.period})</Text>
                <View style={styles.finGrid}>
                  <View style={styles.finCell}>
                    <Text style={styles.finLabel}>Revenue</Text>
                    <Text style={styles.finVal}>₹{fin.revenue_cr} Cr</Text>
                  </View>
                  <View style={styles.finCell}>
                    <Text style={styles.finLabel}>Net Profit (PAT)</Text>
                    <Text style={styles.finVal}>₹{fin.pat_cr} Cr</Text>
                  </View>
                  <View style={styles.finCell}>
                    <Text style={styles.finLabel}>EPS</Text>
                    <Text style={styles.finVal}>₹{fin.eps}</Text>
                  </View>
                  <View style={styles.finCell}>
                    <Text style={styles.finLabel}>P/E Ratio</Text>
                    <Text style={styles.finVal}>{fin.pe_ratio}x</Text>
                  </View>
                </View>

                <Text style={[styles.sectionHeading, { marginTop: 16 }]}>Valuation Narrative</Text>
                <Text style={styles.bodyText}>{fin.valuation_narrative}</Text>

                <Text style={[styles.sectionHeading, { marginTop: 14 }]}>Peer Group Comparison</Text>
                <Text style={styles.bodyText}>{fin.peer_comparison_narrative}</Text>
              </View>
            )}
          </View>
        )}

        {/* RISKS TAB */}
        {activeTab === 'risks' && (
          <View style={styles.tabContent}>
            <View style={styles.riskCard}>
              <Text style={styles.riskTitle}>⚠️ Key SEBI Prospectus Risk Factors</Text>
              <Text style={styles.riskSub}>Extracted & summarized via Gemini API from RHP filing.</Text>

              <Text style={styles.riskBody}>
                {gemini_summary?.risks || "• Customer concentration risk in key geographical regions.\n• Volatility in raw material price index.\n• Regulatory compliance changes."}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgDark,
  },
  loaderCenter: {
    flex: 1,
    backgroundColor: theme.colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textMuted,
    marginTop: 12,
    fontSize: 13,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  backText: {
    color: theme.colors.accentPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  remindBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.gmpBadgeBg,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  remindText: {
    color: theme.colors.accentSuccess,
    fontWeight: '700',
    fontSize: 12,
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  companyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolBadge: {
    color: theme.colors.accentPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  dot: {
    color: theme.colors.textMuted,
    marginHorizontal: 6,
  },
  exchangeText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  statusPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: theme.colors.accentSuccess,
    fontSize: 10,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: theme.colors.accentPrimary,
  },
  tabText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.accentPrimary,
    fontWeight: '800',
  },
  scrollPadding: {
    padding: 16,
  },
  tabContent: {
    gap: 16,
  },
  gridBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  gridCell: {
    width: '50%',
    padding: 8,
  },
  cellLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  cellVal: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  aiRatingCard: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiBadgeTitle: {
    color: theme.colors.accentPurple,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  verdictPill: {
    backgroundColor: theme.colors.accentSuccess,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verdictText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '900',
  },
  aiOverviewText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
  },
  sectionBox: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  sectionHeading: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  bodyText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  finGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  finCell: {
    alignItems: 'center',
  },
  finLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },
  finVal: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  riskCard: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  riskTitle: {
    color: theme.colors.accentDanger,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  riskSub: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginBottom: 12,
  },
  riskBody: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 22,
  }
});
