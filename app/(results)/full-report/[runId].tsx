import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/Tokens';
import { useScanStore } from '@/features/scans/stores/scan-store';
import { IssueCategory } from '@/types/api';

// Human-readable labels for issue categories
const ISSUE_LABELS: Record<IssueCategory, string> = {
  oily_shine: 'Oily Shine',
  dryness_dehydration: 'Dryness & Dehydration',
  enlarged_pores_texture: 'Visible Pores & Texture',
  blackheads: 'Blackheads',
  acne_active: 'Active Acne',
  acne_scars_post_inflammatory: 'Acne Scars',
  pigmentation_brown_spots: 'Brown Spots',
  freckles: 'Freckles',
  melasma_like_patches: 'Melasma-like Patches',
  redness_sensitivity: 'Redness & Sensitivity',
  wrinkles_and_fine_lines: 'Wrinkles & Fine Lines',
  eye_bags: 'Eye Bags',
  dark_circles: 'Dark Circles',
  moles_or_nevi: 'Moles or Nevi',
};

export default function FullReportScreen() {
  const insets = useSafeAreaInsets();
  const { runId } = useLocalSearchParams<{ runId: string }>();
  const [expandedSections, setExpandedSections] = useState<Set<IssueCategory>>(new Set());

  // Get the run from the store
  const run = useScanStore((state) => state.runs.find((r) => r.id === runId));

  const toggleSection = useCallback((category: IssueCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  if (!run || !run.result) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Report not found</Text>
      </View>
    );
  }

  // Get overall score
  const overallScore = run.result.global_profile?.scores?.overall ?? 0;
  const description = run.result.global_profile?.summary_description ?? '';

  // Get issues with data
  const issuesWithData = run.result.issues
    ? (Object.entries(run.result.issues) as [IssueCategory, any[]][])
        .filter(([_, items]) => items && items.length > 0)
        .map(([category, items]) => ({ category, items }))
    : [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, Spacing.large) },
        ]}
      >
        <Text style={styles.headerTitle}>Full Report</Text>
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, Spacing.large) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Score Box */}
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Skin Health Score</Text>
          <Text style={styles.scoreValue}>{Math.round(overallScore)}</Text>
          <Text style={styles.scoreOutOf}>out of 100</Text>
        </View>

        {/* Global Description */}
        {description && (
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        )}

        {/* Issue Categories */}
        <View style={styles.issuesContainer}>
          <Text style={styles.sectionTitle}>Detected Issues</Text>

          {issuesWithData.length > 0 ? (
            issuesWithData.map(({ category, items }) => {
              const isExpanded = expandedSections.has(category);

              return (
                <View key={category} style={styles.issueSection}>
                  {/* Section Header */}
                  <Pressable
                    style={styles.sectionHeader}
                    onPress={() => toggleSection(category)}
                  >
                    <View style={styles.sectionHeaderLeft}>
                      <Text style={styles.sectionHeaderText}>
                        {ISSUE_LABELS[category]}
                      </Text>
                      <Text style={styles.issueCount}>
                        {items.length} area{items.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={Colors.textSecondary}
                    />
                  </Pressable>

                  {/* Expandable Content */}
                  {isExpanded && (
                    <View style={styles.sectionContent}>
                      {items.map((item, index) => (
                        <View key={`${item.region}-${index}`} style={styles.issueItem}>
                          {/* Region Label */}
                          <Text style={styles.regionLabel}>{item.region}</Text>

                          {/* Intensity */}
                          <View style={styles.metricRow}>
                            <Text style={styles.metricLabel}>Intensity</Text>
                            <View style={styles.progressBarContainer}>
                              <View
                                style={[
                                  styles.progressBar,
                                  {
                                    width: `${item.intensity * 100}%`,
                                    backgroundColor: getIntensityColor(item.intensity),
                                  },
                                ]}
                              />
                            </View>
                            <Text style={styles.metricValue}>
                              {Math.round(item.intensity * 100)}%
                            </Text>
                          </View>

                          {/* Area */}
                          <View style={styles.metricRow}>
                            <Text style={styles.metricLabel}>Area</Text>
                            <View style={styles.progressBarContainer}>
                              <View
                                style={[
                                  styles.progressBar,
                                  {
                                    width: `${(item.area / 10) * 100}%`,
                                    backgroundColor: getIntensityColor(item.area / 10),
                                  },
                                ]}
                              />
                            </View>
                            <Text style={styles.metricValue}>{item.area}/10</Text>
                          </View>

                          {/* Description */}
                          {item.description && (
                            <Text style={styles.issueDescription}>{item.description}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.noIssuesContainer}>
              <Text style={styles.noIssuesText}>No issues detected</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Helper function to get color based on intensity
function getIntensityColor(value: number): string {
  if (value < 0.3) return Colors.successGreen;
  if (value < 0.6) return '#FF9800'; // Orange
  return '#FF6B6B'; // Red
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
  header: {
    backgroundColor: Colors.appBackground,
    paddingHorizontal: Spacing.large,
    paddingBottom: Spacing.default,
    // borderBottomWidth: 1,
    // borderBottomColor: Colors.backgroundLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.large,
  },
  scoreBox: {
    backgroundColor: Colors.brandSecondary,
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.large,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.small,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '700',
    color: Colors.black,
    lineHeight: 60,
  },
  scoreOutOf: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
    opacity: 0.8,
  },
  descriptionBox: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.large,
    marginBottom: Spacing.large,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textPrimary,
    fontWeight: '400',
  },
  issuesContainer: {
    marginTop: Spacing.default,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.default,
  },
  issueSection: {
    marginBottom: Spacing.default,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.default,
    backgroundColor: Colors.backgroundLight,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  issueCount: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  sectionContent: {
    padding: Spacing.default,
  },
  issueItem: {
    marginBottom: Spacing.large,
    paddingBottom: Spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  regionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    width: 70,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 4,
    marginHorizontal: Spacing.small,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    width: 45,
    textAlign: 'right',
  },
  issueDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginTop: Spacing.tiny,
    fontStyle: 'italic',
  },
  noIssuesContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  noIssuesText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xxxl,
  },
});
