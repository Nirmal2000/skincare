import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

import { Colors, Spacing, Typography } from '@/constants/Tokens';
import { useMetricsData } from '../hooks/useMetricsData';

export default function CategoryTrendsCarousel() {
  const { getCategoryTrends } = useMetricsData();
  const trends = getCategoryTrends();

  const handleTrendPress = (category: string) => {
    router.push(`/(metrics)/category-trend/${category}`);
  };

  if (trends.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Category Trends</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Not enough data yet</Text>
          <Text style={styles.emptySubtext}>Complete more scans to see category trends</Text>
        </View>
      </View>
    );
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable'): string => {
    if (trend === 'up') return Colors.success;
    if (trend === 'down') return Colors.error;
    return Colors.textSecondary;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Category Trends</Text>
      <Text style={styles.subtitle}>Individual score tracking over time</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {trends.map((trend) => {
          const chartData = trend.dataPoints.map((point, index) => ({
            x: index,
            score: point.score,
          }));

          return (
            <TouchableOpacity
              key={trend.category}
              style={styles.trendCard}
              onPress={() => handleTrendPress(trend.category)}
            >
              {/* Header with current score */}
              <View style={styles.cardHeader}>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {trend.displayName}
                </Text>
                <View style={styles.scoreContainer}>
                  <Text style={styles.currentScoreValue}>{trend.currentScore}</Text>
                  <Text style={styles.scoreMax}>/100</Text>
                </View>
              </View>

              {/* Trend indicator */}
              <View style={styles.trendIndicator}>
                <Text style={[styles.trendIcon, { color: getTrendColor(trend.trend) }]}>
                  {getTrendIcon(trend.trend)}
                </Text>
                <Text
                  style={[
                    styles.trendChange,
                    { color: getTrendColor(trend.trend) },
                  ]}
                >
                  {Math.abs(trend.change).toFixed(0)}%
                </Text>
              </View>

              {/* Mini sparkline chart */}
              <View style={styles.chartContainer}>
                {chartData.length > 1 ? (
                  <CartesianChart
                    data={chartData}
                    xKey="x"
                    yKeys={['score']}
                    domain={{ y: [0, 100] }}
                    domainPadding={{ left: 0, right: 0, top: 5, bottom: 5 }}
                  >
                    {({ points }) => (
                      <Line
                        points={points.score}
                        color={getTrendColor(trend.trend)}
                        strokeWidth={2}
                        curveType="catmullRom"
                      />
                    )}
                  </CartesianChart>
                ) : (
                  <View style={styles.noChartContainer}>
                    <Text style={styles.noChartText}>Need more data</Text>
                  </View>
                )}
              </View>

              <Text style={styles.tapHint}>Tap for details →</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  trendCard: {
    width: 160,
    backgroundColor: Colors.appBackground,
    borderRadius: 12,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    marginBottom: Spacing.small,
  },
  categoryName: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.tiny,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentScoreValue: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontSize: 28,
  },
  scoreMax: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  trendIcon: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: Spacing.tiny,
  },
  trendChange: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  chartContainer: {
    height: 60,
    marginBottom: Spacing.small,
  },
  noChartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noChartText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  tapHint: {
    ...Typography.caption,
    color: Colors.primary,
    textAlign: 'right',
    fontWeight: '500',
    fontSize: 10,
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
