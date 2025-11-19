import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Colors, Layout, Spacing, Typography } from '@/constants/Tokens';
import { useScanStore } from '@/features/scans/stores/scan-store';
import { ISSUE_DISPLAY_NAMES, REGION_DISPLAY_NAMES } from '@/features/metrics/types/metrics.types';

export default function IssueDetailScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const runs = useScanStore((state) => state.runs);

  const completedScans = runs
    .filter((scan) => scan.status === 'completed' && scan.result)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Aggregate issue data for this category
  const issueData = completedScans
    .map((scan) => {
      if (!scan.result?.issues || !category) return null;
      const issues = scan.result.issues[category as keyof typeof scan.result.issues];
      if (!Array.isArray(issues) || issues.length === 0) return null;

      return {
        scanId: scan.id,
        date: scan.createdAt,
        issues,
        totalCount: issues.length,
        avgIntensity: issues.reduce((sum, issue) => sum + (issue.intensity || 0), 0) / issues.length,
        regions: [...new Set(issues.map((i) => i.region))],
      };
    })
    .filter(Boolean);

  const displayName = category ? ISSUE_DISPLAY_NAMES[category] || category : 'Unknown Issue';
  const totalScans = completedScans.length;
  const scansWithIssue = issueData.length;
  const frequency = totalScans > 0 ? (scansWithIssue / totalScans) * 100 : 0;

  // Get all affected regions across all scans
  const allRegions = new Map<string, number>();
  issueData.forEach((data) => {
    data?.regions.forEach((region) => {
      allRegions.set(region, (allRegions.get(region) || 0) + 1);
    });
  });

  const sortedRegions = Array.from(allRegions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

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
        {/* Statistics Card */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{frequency.toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Frequency</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {scansWithIssue}/{totalScans}
              </Text>
              <Text style={styles.statLabel}>Scans Affected</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {issueData.reduce((sum, d) => sum + (d?.totalCount || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Total Instances</Text>
            </View>
          </View>
        </View>

        {/* Most Affected Regions */}
        {sortedRegions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Most Affected Regions</Text>
            {sortedRegions.map(([region, count]) => (
              <View key={region} style={styles.regionItem}>
                <Text style={styles.regionName}>
                  {REGION_DISPLAY_NAMES[region] || region}
                </Text>
                <View style={styles.regionBar}>
                  <View
                    style={[
                      styles.regionBarFill,
                      {
                        width: `${(count / sortedRegions[0][1]) * 100}%`,
                        backgroundColor: Colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.regionCount}>{count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Scan History */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Scan History</Text>
          {issueData.length > 0 ? (
            issueData.map((data) => {
              if (!data) return null;
              return (
                <TouchableOpacity
                  key={data.scanId}
                  style={styles.scanItem}
                  onPress={() => router.push(`/(results)/${data.scanId}`)}
                >
                  <View style={styles.scanHeader}>
                    <Text style={styles.scanDate}>
                      {new Date(data.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    <View style={styles.scanBadge}>
                      <Text style={styles.scanBadgeText}>{data.totalCount} instances</Text>
                    </View>
                  </View>

                  <View style={styles.intensityRow}>
                    <Text style={styles.intensityLabel}>Avg Intensity:</Text>
                    <View style={styles.intensityBar}>
                      <View
                        style={[
                          styles.intensityFill,
                          {
                            width: `${data.avgIntensity * 100}%`,
                            backgroundColor: getIntensityColor(data.avgIntensity),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.intensityValue}>{(data.avgIntensity * 100).toFixed(0)}%</Text>
                  </View>

                  <View style={styles.scanRegions}>
                    <Text style={styles.regionsLabel}>Regions: </Text>
                    <Text style={styles.regionsText} numberOfLines={1}>
                      {data.regions.map((r) => REGION_DISPLAY_NAMES[r] || r).join(', ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No occurrences found</Text>
              <Text style={styles.emptySubtext}>This issue has not appeared in any scans</Text>
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
  statsCard: {
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
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
    gap: Spacing.small,
  },
  regionName: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    width: 100,
  },
  regionBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.appBackground,
    borderRadius: 4,
    overflow: 'hidden',
  },
  regionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  regionCount: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
    width: 30,
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
    marginBottom: Spacing.small,
  },
  scanDate: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  scanBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 8,
  },
  scanBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.small,
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
  scanRegions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  regionsLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  regionsText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    flex: 1,
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
    textAlign: 'center',
  },
});
