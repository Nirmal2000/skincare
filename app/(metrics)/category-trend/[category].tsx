import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CartesianChart, Line } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';

import { Colors, Layout, Spacing, Typography } from '@/constants/Tokens';
import { useMetricsData } from '@/features/metrics/hooks/useMetricsData';
import { SCORE_DISPLAY_NAMES } from '@/features/metrics/types/metrics.types';

export default function CategoryTrendScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const { getCategoryTrends } = useMetricsData();

  const trends = getCategoryTrends();
  const trend = trends.find((t) => t.category === category);

  if (!trend) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trend Not Found</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>
    );
  }

  const chartData = trend.dataPoints.map((point, index) => ({
    x: index,
    score: point.score,
  }));

  const getTrendColor = (trendType: 'up' | 'down' | 'stable'): string => {
    if (trendType === 'up') return Colors.success;
    if (trendType === 'down') return Colors.error;
    return Colors.textSecondary;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{trend.displayName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.label}>Current Score</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{trend.currentScore}</Text>
            <Text style={styles.scoreMax}>/100</Text>
            <View style={[styles.trendBadge, { backgroundColor: getTrendColor(trend.trend) }]}>
              <Text style={styles.trendText}>
                {trend.trend === 'up' ? '↑' : trend.trend === 'down' ? '↓' : '→'} {Math.abs(trend.change).toFixed(0)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Full Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Score History</Text>
          <View style={styles.chartContainer}>
            <CartesianChart data={chartData} xKey="x" yKeys={['score']} domain={{ y: [0, 100] }} domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}>
              {({ points }) => (
                <>
                  <Line points={points.score} color={getTrendColor(trend.trend)} strokeWidth={3} curveType="catmullRom" animate={{ type: 'timing', duration: 300 }} />
                  {points.score.map((point, index) => (
                    <Circle key={index} cx={point.x ?? 0} cy={point.y ?? 0} r={5} color={getTrendColor(trend.trend)} opacity={0.8} />
                  ))}
                </>
              )}
            </CartesianChart>
          </View>
        </View>

        {/* Data Points List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Scan History</Text>
          {trend.dataPoints.slice().reverse().map((point, index) => (
            <TouchableOpacity key={point.runId} style={styles.dataPoint} onPress={() => router.push(`/(results)/${point.runId}`)}>
              <View style={styles.dataPointHeader}>
                <Text style={styles.dataPointDate}>
                  {new Date(point.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.dataPointScore}>{point.score}/100</Text>
              </View>
            </TouchableOpacity>
          ))}
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
  scoreCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    alignItems: 'center',
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.tiny,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.small,
  },
  scoreValue: {
    ...Typography.h1,
    color: Colors.primary,
  },
  scoreMax: {
    ...Typography.h3,
    color: Colors.textSecondary,
  },
  trendBadge: {
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 8,
    marginLeft: Spacing.small,
  },
  trendText: {
    ...Typography.bodySmall,
    color: Colors.white,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  chartContainer: {
    height: 300,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  dataPoint: {
    backgroundColor: Colors.appBackground,
    borderRadius: 12,
    padding: Spacing.base,
    marginBottom: Spacing.small,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dataPointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataPointDate: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
  },
  dataPointScore: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
});
