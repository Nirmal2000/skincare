import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/Tokens';
import { useScanStore } from '@/features/scans/stores/scan-store';

function LatestScanSummaryComponent() {
  // Get the latest completed scan data for conditional rendering and memo key
  const latestScan = useScanStore((state) => state.getLatestCompletedScan());

  // Only render if there's a completed scan
  if (!latestScan) {
    return null;
  }

  // Get computed metrics for the confirmed existing scan
  const metrics = useScanStore.getState().getSkinHealthMetrics();
  const issuesSummary = useScanStore.getState().getIssuesCount();
  const topConcerns = useScanStore.getState().getTopConcerns(2);

  // If no metrics available (edge case), don't render
  if (!metrics) {
    return null;
  }

  return (
    <View style={styles.summaryCard}>
      {/* Score Row */}
      <View style={styles.scoreRow}>
        <Text style={styles.bigScore}>{metrics.score}</Text>
        <Text style={styles.scoreLabel}>Skin Health Score</Text>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{metrics.skinType}</Text>
          <Text style={styles.metricLabel}>Skin Type</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {metrics.skinAge.estimated} ({metrics.skinAge.relative})
          </Text>
          <Text style={styles.metricLabel}>Skin Age</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{metrics.skinTone}</Text>
          <Text style={styles.metricLabel}>Skin Tone</Text>
        </View>
      </View>

      {/* Issues Summary */}
      {issuesSummary.total > 0 && (
        <View style={styles.issuesRow}>
          <Text style={styles.issuesText}>
            {issuesSummary.total} area{issuesSummary.total > 1 ? 's' : ''} {issuesSummary.critical > 0 ? 'need attention' : 'detected'}
          </Text>
        </View>
      )}

      {/* Top Concerns */}
      {topConcerns.length > 0 && (
        <View style={styles.concernsSection}>
          <Text style={styles.concernsTitle}>Focus Areas</Text>
          {topConcerns.map((concern, index) => (
            <View key={concern.category} style={styles.concernItem}>
              <Text style={styles.concernLabel}>{concern.label}</Text>
              <Text style={styles.concernScore}>{concern.score}%</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    marginBottom: Spacing.large,
    ...Shadows.card,
  },
  scoreRow: {
    alignItems: 'center',
    marginBottom: Spacing.large,
  },
  bigScore: {
    ...Typography.h1,
    color: Colors.brandPink,
    fontSize: 64,
    lineHeight: 76,
    fontWeight: '800',
  },
  scoreLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.tiny,
    textAlign: 'center',
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.large,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.micro,
    textAlign: 'center',
  },

  // Issues Row
  issuesRow: {
    marginBottom: Spacing.large,
  },
  issuesText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Concerns Section
  concernsSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundLight,
    paddingTop: Spacing.large,
  },
  concernsTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.medium,
  },
  concernItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.small,
  },
  concernLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  concernScore: {
    ...Typography.bodySmall,
    color: Colors.brandPink,
    fontWeight: '600',
  },
});

// Export as memoized component for performance
export default React.memo(LatestScanSummaryComponent);
