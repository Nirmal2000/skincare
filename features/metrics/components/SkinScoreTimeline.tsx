import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';

import { Colors, Spacing, Typography } from '@/constants/Tokens';
import { useMetricsData } from '../hooks/useMetricsData';
import type { TimeRange } from '../types/metrics.types';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '2w', label: '2 Weeks' },
  { value: '1m', label: '1 Month' },
  { value: 'all', label: 'All Time' },
];

export default function SkinScoreTimeline() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1m');
  const { getScoreTimeline } = useMetricsData();
  const { state, isActive } = useChartPressState({ x: 0, y: { score: 0 } });

  const data = getScoreTimeline(selectedRange);

  // Format data for victory-native-xl chart
  const chartData = data.map((point, index) => ({
    x: index,
    score: point.score,
    runId: point.runId,
    date: new Date(point.date),
  }));

  const getScoreColor = (score: number): string => {
    if (score >= 70) return Colors.success;
    if (score >= 50) return Colors.warning;
    return Colors.error;
  };

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Skin Score Timeline</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No scan data available</Text>
          <Text style={styles.emptySubtext}>Complete a scan to see your progress</Text>
        </View>
      </View>
    );
  }

  const latestScore = chartData[chartData.length - 1]?.score ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Skin Score Timeline</Text>
        <Text style={styles.currentScore}>
          {latestScore}
          <Text style={styles.scoreLabel}>/100</Text>
        </Text>
      </View>

      {/* Time Range Tabs */}
      <View style={styles.tabContainer}>
        {TIME_RANGES.map((range) => (
          <TouchableOpacity
            key={range.value}
            style={[styles.tab, selectedRange === range.value && styles.tabActive]}
            onPress={() => setSelectedRange(range.value)}
          >
            <Text style={[styles.tabText, selectedRange === range.value && styles.tabTextActive]}>
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={['score']}
          domain={{ y: [0, 100] }}
          domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
          chartPressState={state}
        >
          {({ points }) => (
            <>
              <Line
                points={points.score}
                color={Colors.primary}
                strokeWidth={3}
                curveType="catmullRom"
                animate={{ type: 'timing', duration: 300 }}
              />
              {points.score.map((point, index) => {
                const dataPoint = chartData[index];
                const color = getScoreColor(dataPoint?.score ?? 0);
                return (
                  <Circle
                    key={index}
                    cx={point.x ?? 0}
                    cy={point.y ?? 0}
                    r={isActive && Math.round(state.x.value.value) === index ? 8 : 5}
                    color={color}
                    opacity={0.9}
                  />
                );
              })}
            </>
          )}
        </CartesianChart>
        {isActive && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>
              Score: {Math.round(state.y.score.value.value)}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const index = Math.round(state.x.value.value);
                const point = chartData[index];
                if (point?.runId) {
                  router.push(`/(results)/${point.runId}`);
                }
              }}
              style={styles.tooltipButton}
            >
              <Text style={styles.tooltipButtonText}>View Details →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Good (70+)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
          <Text style={styles.legendText}>Fair (50-69)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
          <Text style={styles.legendText}>Needs Care (&lt;50)</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  currentScore: {
    ...Typography.h2,
    color: Colors.primary,
  },
  scoreLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.appBackground,
    borderRadius: 8,
    padding: 4,
    marginBottom: Spacing.base,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.tiny,
    paddingHorizontal: Spacing.small,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.white,
  },
  tabText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  chartContainer: {
    height: 250,
    marginVertical: Spacing.small,
  },
  tooltip: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: [{ translateX: -75 }],
    backgroundColor: Colors.white,
    padding: Spacing.small,
    borderRadius: 8,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  },
  tooltipText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.tiny,
  },
  tooltipButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: 4,
  },
  tooltipButtonText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.small,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.tiny,
  },
  legendText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyState: {
    paddingVertical: Spacing.xxl,
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
