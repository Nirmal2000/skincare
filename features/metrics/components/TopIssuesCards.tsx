import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/Tokens';
import { useMetricsData } from '../hooks/useMetricsData';

export default function TopIssuesCards() {
  const { getTopIssues } = useMetricsData();
  const topIssues = getTopIssues(3);

  const handleIssuePress = (category: string) => {
    router.push(`/(metrics)/issue-detail/${category}`);
  };

  if (topIssues.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Top Issues</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No issues detected</Text>
          <Text style={styles.emptySubtext}>Your skin is looking great!</Text>
        </View>
      </View>
    );
  }

  const getIntensityColor = (intensity: number): string => {
    if (intensity >= 0.7) return Colors.error;
    if (intensity >= 0.4) return Colors.warning;
    return Colors.success;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top 3 Issues</Text>
      <Text style={styles.subtitle}>Most frequent concerns across your scans</Text>

      <View style={styles.cardsContainer}>
        {topIssues.map((issue, index) => (
          <TouchableOpacity
            key={issue.category}
            style={styles.card}
            onPress={() => handleIssuePress(issue.category)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <Text style={styles.issueName}>{issue.displayName}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{issue.percentage.toFixed(0)}%</Text>
                <Text style={styles.statLabel}>Frequency</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {issue.scansWithIssue}/{issue.totalScans}
                </Text>
                <Text style={styles.statLabel}>Scans</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{issue.count}</Text>
                <Text style={styles.statLabel}>Instances</Text>
              </View>
            </View>

            {/* Intensity bar */}
            <View style={styles.intensityContainer}>
              <Text style={styles.intensityLabel}>Avg Intensity</Text>
              <View style={styles.intensityBar}>
                <View
                  style={[
                    styles.intensityFill,
                    {
                      width: `${issue.avgIntensity * 100}%`,
                      backgroundColor: getIntensityColor(issue.avgIntensity),
                    },
                  ]}
                />
              </View>
              <Text style={styles.intensityValue}>{(issue.avgIntensity * 100).toFixed(0)}%</Text>
            </View>

            <Text style={styles.tapHint}>Tap for details →</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.tiny,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
  },
  cardsContainer: {
    gap: Spacing.small,
  },
  card: {
    backgroundColor: Colors.appBackground,
    borderRadius: 12,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.small,
  },
  rankText: {
    ...Typography.bodySmall,
    color: Colors.white,
    fontWeight: '700',
  },
  issueName: {
    ...Typography.h4,
    color: Colors.textPrimary,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.base,
    paddingVertical: Spacing.small,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.tiny,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  intensityLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    width: 80,
  },
  intensityBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: Spacing.small,
  },
  intensityFill: {
    height: '100%',
    borderRadius: 4,
  },
  intensityValue: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  tapHint: {
    ...Typography.caption,
    color: Colors.primary,
    textAlign: 'right',
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    marginBottom: Spacing.tiny,
  },
  emptySubtext: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
});
