import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Colors, Layout, Spacing, Typography } from '@/constants/Tokens';
import { useScanStore } from '@/features/scans/stores/scan-store';
import { ISSUE_DISPLAY_NAMES, REGION_DISPLAY_NAMES } from '@/features/metrics/types/metrics.types';

export default function RegionDetailScreen() {
  const { region } = useLocalSearchParams<{ region: string }>();
  const runs = useScanStore((state) => state.runs);

  const completedScans = runs
    .filter((scan) => scan.status === 'completed' && scan.result)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Aggregate issues in this region
  const regionIssues = new Map<string, { count: number; avgIntensity: number; totalIntensity: number }>();
  const scansWithRegion: Array<{ scanId: string; date: string; issues: string[] }> = [];

  completedScans.forEach((scan) => {
    if (!scan.result?.issues) return;

    const issuesInScan: string[] = [];

    Object.entries(scan.result.issues).forEach(([category, issues]) => {
      if (!Array.isArray(issues)) return;

      issues.forEach((issue) => {
        if (issue.region === region) {
          issuesInScan.push(category);
          const stats = regionIssues.get(category) || { count: 0, avgIntensity: 0, totalIntensity: 0 };
          stats.count += 1;
          stats.totalIntensity += issue.intensity || 0;
          stats.avgIntensity = stats.totalIntensity / stats.count;
          regionIssues.set(category, stats);
        }
      });
    });

    if (issuesInScan.length > 0) {
      scansWithRegion.push({ scanId: scan.id, date: scan.createdAt, issues: issuesInScan });
    }
  });

  const displayName = region ? REGION_DISPLAY_NAMES[region] || region : 'Unknown Region';
  const sortedIssues = Array.from(regionIssues.entries()).sort((a, b) => b[1].count - a[1].count);

  const getIntensityColor = (intensity: number): string => {
    if (intensity >= 0.7) return Colors.error;
    if (intensity >= 0.4) return Colors.warning;
    return Colors.success;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{displayName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistics */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{sortedIssues.length}</Text>
              <Text style={styles.statLabel}>Issue Types</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{scansWithRegion.length}</Text>
              <Text style={styles.statLabel}>Scans Affected</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {sortedIssues.reduce((sum, [, stats]) => sum + stats.count, 0)}
              </Text>
              <Text style={styles.statLabel}>Total Issues</Text>
            </View>
          </View>
        </View>

        {/* Issue Types */}
        {sortedIssues.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Issue Types in This Region</Text>
            {sortedIssues.map(([category, stats]) => (
              <TouchableOpacity
                key={category}
                style={styles.issueItem}
                onPress={() => router.push(`/(metrics)/issue-detail/${category}`)}
              >
                <View style={styles.issueHeader}>
                  <Text style={styles.issueName}>{ISSUE_DISPLAY_NAMES[category] || category}</Text>
                  <Text style={styles.issueCount}>{stats.count} instances</Text>
                </View>
                <View style={styles.intensityRow}>
                  <Text style={styles.intensityLabel}>Avg Intensity:</Text>
                  <View style={styles.intensityBar}>
                    <View
                      style={[
                        styles.intensityFill,
                        {
                          width: `${stats.avgIntensity * 100}%`,
                          backgroundColor: getIntensityColor(stats.avgIntensity),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.intensityValue}>{(stats.avgIntensity * 100).toFixed(0)}%</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Scan History */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Scan History</Text>
          {scansWithRegion.length > 0 ? (
            scansWithRegion.map(({ scanId, date, issues }) => (
              <TouchableOpacity
                key={scanId}
                style={styles.scanItem}
                onPress={() => router.push(`/(results)/${scanId}`)}
              >
                <View style={styles.scanHeader}>
                  <Text style={styles.scanDate}>
                    {new Date(date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.issueCountBadge}>{issues.length} types</Text>
                </View>
                <Text style={styles.issuesText} numberOfLines={2}>
                  {issues.map((cat) => ISSUE_DISPLAY_NAMES[cat] || cat).join(', ')}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No issues found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenMarginHorizontal,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.screenMarginHorizontal,
    paddingTop: Spacing.base,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.base,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: Spacing.tiny,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  issueItem: {
    backgroundColor: Colors.appBackground,
    borderRadius: 12,
    padding: Spacing.base,
    marginBottom: Spacing.small,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  issueName: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  issueCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intensityLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    width: 90,
  },
  intensityBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginHorizontal: Spacing.small,
  },
  intensityFill: {
    height: '100%',
  },
  intensityValue: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  scanItem: {
    backgroundColor: Colors.appBackground,
    borderRadius: 12,
    padding: Spacing.base,
    marginBottom: Spacing.small,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.tiny,
  },
  scanDate: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  issueCountBadge: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  issuesText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyState: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
  },
});
