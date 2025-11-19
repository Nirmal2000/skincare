import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/Tokens';
import { useMetricsData } from '../hooks/useMetricsData';

export default function AffectedRegionsMap() {
  const { getRegionFrequency } = useMetricsData();
  const regions = getRegionFrequency();

  const handleRegionPress = (region: string) => {
    router.push(`/(metrics)/region-detail/${region}`);
  };

  if (regions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Most Affected Regions</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No region data available</Text>
          <Text style={styles.emptySubtext}>Complete scans to see which areas need attention</Text>
        </View>
      </View>
    );
  }

  // Get max count for normalization
  const maxCount = Math.max(...regions.map((r) => r.count));

  const getHeatColor = (count: number): string => {
    const intensity = count / maxCount;
    if (intensity >= 0.7) return Colors.error;
    if (intensity >= 0.4) return Colors.warning;
    return Colors.primary;
  };

  const getIntensityColor = (intensity: number): string => {
    if (intensity >= 0.7) return Colors.error;
    if (intensity >= 0.4) return Colors.warning;
    return Colors.success;
  };

  // Show top 8 regions
  const topRegions = regions.slice(0, 8);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Most Affected Regions</Text>
      <Text style={styles.subtitle}>Areas requiring attention based on issue frequency</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {topRegions.map((region, index) => {
          const heatColor = getHeatColor(region.count);
          const heatIntensity = region.count / maxCount;

          return (
            <TouchableOpacity
              key={region.region}
              style={styles.regionCard}
              onPress={() => handleRegionPress(region.region)}
            >
              {/* Rank indicator */}
              <View style={styles.rankContainer}>
                <Text style={styles.rankNumber}>#{index + 1}</Text>
              </View>

              {/* Region visualization */}
              <View
                style={[
                  styles.regionCircle,
                  {
                    backgroundColor: heatColor,
                    opacity: 0.2 + heatIntensity * 0.8, // 20% to 100% opacity
                  },
                ]}
              >
                <Text style={[styles.regionCount, { color: heatColor }]}>{region.count}</Text>
              </View>

              {/* Region name */}
              <Text style={styles.regionName} numberOfLines={2}>
                {region.displayName}
              </Text>

              {/* Issue types count */}
              <Text style={styles.issueTypesCount}>
                {region.issueTypes.length} {region.issueTypes.length === 1 ? 'type' : 'types'}
              </Text>

              {/* Intensity indicator */}
              <View style={styles.intensityBar}>
                <View
                  style={[
                    styles.intensityFill,
                    {
                      width: `${region.avgIntensity * 100}%`,
                      backgroundColor: getIntensityColor(region.avgIntensity),
                    },
                  ]}
                />
              </View>

              <Text style={styles.tapHint}>Tap →</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: Colors.error, opacity: 0.8 }]} />
          <Text style={styles.legendText}>High</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: Colors.warning, opacity: 0.6 }]} />
          <Text style={styles.legendText}>Medium</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: Colors.primary, opacity: 0.4 }]} />
          <Text style={styles.legendText}>Low</Text>
        </View>
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
  scrollContent: {
    gap: Spacing.base,
    paddingVertical: Spacing.small,
  },
  regionCard: {
    width: 120,
    backgroundColor: Colors.appBackground,
    borderRadius: 12,
    padding: Spacing.small,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rankNumber: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 10,
  },
  regionCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.small,
    marginTop: Spacing.small,
  },
  regionCount: {
    ...Typography.h2,
    fontWeight: '800',
  },
  regionName: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.tiny,
    minHeight: 32,
  },
  issueTypesCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.small,
  },
  intensityBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.tiny,
  },
  intensityFill: {
    height: '100%',
  },
  tapHint: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '500',
    fontSize: 10,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.base,
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.tiny,
  },
  legendCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
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
    marginBottom: Spacing.tiny,
  },
  emptySubtext: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
