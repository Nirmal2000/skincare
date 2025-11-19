import { useMemo } from 'react';
import { useScanStore } from '@/features/scans/stores/scan-store';
import type { ScanRun } from '@/features/scans/stores/scan-store';
import type {
  CategoryTrend,
  IssueFrequency,
  RegionFrequency,
  ScoreDataPoint,
  TimeRange,
} from '../types/metrics.types';
import { ISSUE_DISPLAY_NAMES, REGION_DISPLAY_NAMES, SCORE_DISPLAY_NAMES } from '../types/metrics.types';

export function useMetricsData() {
  const runs = useScanStore((state) => state.runs);

  // Get all completed scans sorted by date (newest first)
  const completedScans = useMemo(() => {
    return runs
      .filter((scan) => scan.status === 'completed' && scan.result)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [runs]);

  // Filter scans by time range
  const getScansInRange = (range: TimeRange): ScanRun[] => {
    if (range === 'all') return completedScans;

    const now = new Date();
    const cutoffDate = new Date();

    switch (range) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '2w':
        cutoffDate.setDate(now.getDate() - 14);
        break;
      case '1m':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
    }

    return completedScans.filter((scan) => new Date(scan.createdAt) >= cutoffDate);
  };

  // Get score timeline data
  const getScoreTimeline = (range: TimeRange): ScoreDataPoint[] => {
    const scansInRange = getScansInRange(range);

    return scansInRange
      .map((scan) => ({
        runId: scan.id,
        date: scan.createdAt,
        score: scan.result?.global_profile.scores.overall ?? 0,
        createdAt: scan.createdAt,
      }))
      .reverse(); // oldest first for timeline display
  };

  // Get top N most frequent issues
  const getTopIssues = (limit: number = 3): IssueFrequency[] => {
    if (completedScans.length === 0) return [];

    const issueStats = new Map<string, { count: number; scans: Set<string>; totalIntensity: number }>();

    // Aggregate issue data across all scans
    completedScans.forEach((scan) => {
      if (!scan.result?.issues) return;

      Object.entries(scan.result.issues).forEach(([category, issues]) => {
        if (!Array.isArray(issues) || issues.length === 0) return;

        const stats = issueStats.get(category) || { count: 0, scans: new Set(), totalIntensity: 0 };
        stats.count += issues.length;
        stats.scans.add(scan.id);
        stats.totalIntensity += issues.reduce((sum, issue) => sum + (issue.intensity || 0), 0);
        issueStats.set(category, stats);
      });
    });

    // Convert to array and calculate percentages
    const issueFrequencies: IssueFrequency[] = Array.from(issueStats.entries()).map(
      ([category, stats]) => ({
        category,
        displayName: ISSUE_DISPLAY_NAMES[category] || category,
        count: stats.count,
        scansWithIssue: stats.scans.size,
        totalScans: completedScans.length,
        percentage: (stats.scans.size / completedScans.length) * 100,
        avgIntensity: stats.count > 0 ? stats.totalIntensity / stats.count : 0,
      })
    );

    // Sort by frequency (scansWithIssue) and return top N
    return issueFrequencies.sort((a, b) => b.scansWithIssue - a.scansWithIssue).slice(0, limit);
  };

  // Get region frequency data for heatmap
  const getRegionFrequency = (): RegionFrequency[] => {
    if (completedScans.length === 0) return [];

    const regionStats = new Map<
      string,
      { count: number; issueTypes: Set<string>; totalIntensity: number }
    >();

    // Aggregate region data across all scans
    completedScans.forEach((scan) => {
      if (!scan.result?.issues) return;

      Object.entries(scan.result.issues).forEach(([category, issues]) => {
        if (!Array.isArray(issues)) return;

        issues.forEach((issue) => {
          if (!issue.region) return;

          const stats = regionStats.get(issue.region) || {
            count: 0,
            issueTypes: new Set(),
            totalIntensity: 0,
          };
          stats.count += 1;
          stats.issueTypes.add(category);
          stats.totalIntensity += issue.intensity || 0;
          regionStats.set(issue.region, stats);
        });
      });
    });

    // Convert to array
    const regionFrequencies: RegionFrequency[] = Array.from(regionStats.entries()).map(
      ([region, stats]) => ({
        region,
        displayName: REGION_DISPLAY_NAMES[region] || region,
        count: stats.count,
        issueTypes: Array.from(stats.issueTypes),
        avgIntensity: stats.count > 0 ? stats.totalIntensity / stats.count : 0,
      })
    );

    // Sort by count (most issues first)
    return regionFrequencies.sort((a, b) => b.count - a.count);
  };

  // Get category trends (for individual score tracking)
  const getCategoryTrends = (): CategoryTrend[] => {
    if (completedScans.length === 0) return [];

    type ScoreKey = 'acne' | 'wrinkles' | 'pigmentation' | 'hydration' | 'oily_shine' | 'pores' | 'dark_circles' | 'roughness' | 'sensitivity_redness' | 'blackheads';

    const scoreKeys: ScoreKey[] = [
      'acne',
      'wrinkles',
      'pigmentation',
      'hydration',
      'oily_shine',
      'pores',
      'dark_circles',
      'roughness',
      'sensitivity_redness',
      'blackheads',
    ];

    return scoreKeys
      .map((scoreKey) => {
        const dataPoints: ScoreDataPoint[] = completedScans
          .map((scan) => ({
            runId: scan.id,
            date: scan.createdAt,
            score: scan.result?.global_profile.scores[scoreKey] ?? 0,
            createdAt: scan.createdAt,
          }))
          .reverse(); // oldest first

        const currentScore = dataPoints[dataPoints.length - 1]?.score ?? 0;
        const previousScore = dataPoints[dataPoints.length - 2]?.score ?? currentScore;

        const change = currentScore - previousScore;
        const trend: 'up' | 'down' | 'stable' = Math.abs(change) < 2 ? 'stable' : change > 0 ? 'up' : 'down';

        return {
          category: scoreKey,
          displayName: SCORE_DISPLAY_NAMES[scoreKey] || scoreKey,
          scoreKey,
          dataPoints,
          currentScore,
          trend,
          change: previousScore !== 0 ? ((change / previousScore) * 100) : 0,
        };
      })
      .filter((trend) => trend.dataPoints.length > 0); // only include if we have data
  };

  return {
    completedScans,
    getScoreTimeline,
    getTopIssues,
    getRegionFrequency,
    getCategoryTrends,
    getScansInRange,
  };
}
