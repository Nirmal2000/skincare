import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/Tokens';
import { useScanStore } from '@/features/scans/stores/scan-store';
import {
  ProductRecommendation,
  RoutineStep,
} from '@/types/api';

export default function RoutineScreen() {
  const insets = useSafeAreaInsets();
  const { runId } = useLocalSearchParams<{ runId: string }>();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([]) // All sections collapsed by default
  );

  // Get the run from the store
  const run = useScanStore((state) => state.runs.find((r) => r.id === runId));

  const toggleSection = useCallback((section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleProductPress = useCallback((url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  }, []);

  if (!run || !run.routine) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Routine not found</Text>
      </View>
    );
  }

  const { routine } = run;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, Spacing.large) },
        ]}
      >
        <Text style={styles.headerTitle}>Your Routine</Text>
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
        {/* Summary Card */}
        {routine.reasons.prioritized_concerns.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Key Concerns</Text>
            {routine.reasons.prioritized_concerns.map((concern, index) => (
              <View key={index} style={styles.concernItem}>
                <View style={styles.concernHeader}>
                  <Text style={styles.concernKey}>
                    {formatConcernKey(concern.key)}
                  </Text>
                  <View style={[styles.severityBadge, getSeverityStyle(concern.severity)]}>
                    <Text style={styles.severityText}>{concern.severity}</Text>
                  </View>
                </View>
                <Text style={styles.concernWhy}>{concern.why}</Text>
              </View>
            ))}
            {routine.reasons.notes && (
              <Text style={styles.summaryNotes}>{routine.reasons.notes}</Text>
            )}
          </View>
        )}

        {/* Morning Routine */}
        <RoutineSection
          title="☀️ Morning Routine"
          sectionKey="am"
          steps={routine.routine.am}
          expanded={expandedSections.has('am')}
          onToggle={() => toggleSection('am')}
          onProductPress={handleProductPress}
        />

        {/* Midday Routine (if exists) */}
        {routine.routine.midday && routine.routine.midday.length > 0 && (
          <RoutineSection
            title="☀️ Midday Routine"
            sectionKey="midday"
            steps={routine.routine.midday}
            expanded={expandedSections.has('midday')}
            onToggle={() => toggleSection('midday')}
            onProductPress={handleProductPress}
          />
        )}

        {/* Evening Routine */}
        <RoutineSection
          title="🌙 Evening Routine"
          sectionKey="pm"
          steps={routine.routine.pm}
          expanded={expandedSections.has('pm')}
          onToggle={() => toggleSection('pm')}
          onProductPress={handleProductPress}
        />

        {/* Warnings Section */}
        {routine.warnings && routine.warnings.length > 0 && (
          <View style={styles.warningsCard}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning" size={24} color="#FF9800" />
              <Text style={styles.warningTitle}>Important Safety Information</Text>
            </View>
            {routine.warnings.map((warning, index) => (
              <Text key={index} style={styles.warningText}>
                • {warning}
              </Text>
            ))}
          </View>
        )}

        {/* Lifestyle Section */}
        <View style={styles.section}>
          <Pressable
            style={styles.sectionHeader}
            onPress={() => toggleSection('lifestyle')}
          >
            <Text style={styles.sectionTitle}>🌟 Lifestyle Tips</Text>
            <Ionicons
              name={expandedSections.has('lifestyle') ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={Colors.textSecondary}
            />
          </Pressable>

          {expandedSections.has('lifestyle') && (
            <View style={styles.sectionContent}>
              {routine.lifestyle.sleep && (
                <LifestyleTip icon="🛌" label="Sleep" text={routine.lifestyle.sleep} />
              )}
              {routine.lifestyle.stress && (
                <LifestyleTip icon="🧘" label="Stress Management" text={routine.lifestyle.stress} />
              )}
              {routine.lifestyle.sun && (
                <LifestyleTip icon="☀️" label="Sun Protection" text={routine.lifestyle.sun} />
              )}
              {routine.lifestyle.habits && (
                <LifestyleTip icon="✨" label="Healthy Habits" text={routine.lifestyle.habits} />
              )}
              {routine.lifestyle.routine_hygiene && (
                <LifestyleTip
                  icon="🧼"
                  label="Routine Hygiene"
                  text={routine.lifestyle.routine_hygiene}
                />
              )}

              {/* Diet Section */}
              {(routine.lifestyle.diet.increase.length > 0 ||
                routine.lifestyle.diet.limit.length > 0 ||
                routine.lifestyle.diet.supplements.length > 0) && (
                <View style={styles.dietSection}>
                  <Text style={styles.dietTitle}>🥗 Diet Recommendations</Text>

                  {routine.lifestyle.diet.increase.length > 0 && (
                    <View style={styles.dietCategory}>
                      <Text style={styles.dietCategoryTitle}>Increase</Text>
                      {routine.lifestyle.diet.increase.map((item, index) => (
                        <Text key={index} style={styles.dietItem}>
                          • {item}
                        </Text>
                      ))}
                    </View>
                  )}

                  {routine.lifestyle.diet.limit.length > 0 && (
                    <View style={styles.dietCategory}>
                      <Text style={styles.dietCategoryTitle}>Limit</Text>
                      {routine.lifestyle.diet.limit.map((item, index) => (
                        <Text key={index} style={styles.dietItem}>
                          • {item}
                        </Text>
                      ))}
                    </View>
                  )}

                  {routine.lifestyle.diet.supplements.length > 0 && (
                    <View style={styles.dietCategory}>
                      <Text style={styles.dietCategoryTitle}>Supplements</Text>
                      {routine.lifestyle.diet.supplements.map((item, index) => (
                        <Text key={index} style={styles.dietItem}>
                          • {item}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Helper Components

interface RoutineSectionProps {
  title: string;
  sectionKey: string;
  steps: RoutineStep[];
  expanded: boolean;
  onToggle: () => void;
  onProductPress: (url: string) => void;
}

function RoutineSection({
  title,
  steps,
  expanded,
  onToggle,
  onProductPress,
}: RoutineSectionProps) {
  return (
    <View style={styles.section}>
      <Pressable style={styles.sectionHeader} onPress={onToggle}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={Colors.textSecondary}
        />
      </Pressable>

      {expanded && (
        <View style={styles.sectionContent}>
          {steps.map((step, index) => (
            <StepCard
              key={index}
              step={step}
              stepNumber={index + 1}
              onProductPress={onProductPress}
            />
          ))}
        </View>
      )}
    </View>
  );
}

interface StepCardProps {
  step: RoutineStep;
  stepNumber: number;
  onProductPress: (url: string) => void;
}

function StepCard({ step, stepNumber, onProductPress }: StepCardProps) {
  return (
    <View style={styles.stepCard}>
      {/* Step Header */}
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{stepNumber}</Text>
        </View>
        <Text style={styles.stepType}>{formatStepType(step.type)}</Text>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <InstructionRow icon="💧" label="How" text={step.instructions.how} />
        <InstructionRow icon="📅" label="When" text={step.instructions.frequency} />
        <InstructionRow icon="⏰" label="Timing" text={step.instructions.timing} />
      </View>

      {/* Products */}
      {step.products.map((product, idx) => (
        <ProductCard
          key={idx}
          product={product}
          onPress={() => onProductPress(product.url)}
        />
      ))}
    </View>
  );
}

interface InstructionRowProps {
  icon: string;
  label: string;
  text: string;
}

function InstructionRow({ icon, label, text }: InstructionRowProps) {
  return (
    <View style={styles.instructionRow}>
      <Text style={styles.instructionIcon}>{icon}</Text>
      <View style={styles.instructionContent}>
        <Text style={styles.instructionLabel}>{label}</Text>
        <Text style={styles.instructionText}>{text}</Text>
      </View>
    </View>
  );
}

interface ProductCardProps {
  product: ProductRecommendation;
  onPress: () => void;
}

function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <Pressable style={styles.productCard} onPress={onPress}>
      <View style={styles.productHeader}>
        <Text style={styles.productBrand}>{product.brand}</Text>
        <View style={[styles.tierBadge, getTierStyle(product.tier)]}>
          <Text style={styles.tierText}>{product.tier}</Text>
        </View>
      </View>
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productWhy}>{product.why}</Text>
      <View style={styles.productLink}>
        <Text style={styles.linkText}>View Product</Text>
        <Ionicons name="open-outline" size={16} color={Colors.accentBlue} />
      </View>
    </Pressable>
  );
}

interface LifestyleTipProps {
  icon: string;
  label: string;
  text: string;
}

function LifestyleTip({ icon, label, text }: LifestyleTipProps) {
  return (
    <View style={styles.lifestyleTip}>
      <View style={styles.lifestyleTipHeader}>
        <Text style={styles.lifestyleTipIcon}>{icon}</Text>
        <Text style={styles.lifestyleTipLabel}>{label}</Text>
      </View>
      <Text style={styles.lifestyleTipText}>{text}</Text>
    </View>
  );
}

// Helper Functions

function formatStepType(type: string): string {
  const typeMap: Record<string, string> = {
    cleanser: 'Cleanser',
    active: 'Active Treatment',
    moisturizer: 'Moisturizer',
    sunscreen: 'Sunscreen',
    refresh: 'Refresh',
    other: 'Other',
  };
  return typeMap[type] || type;
}

function formatConcernKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getSeverityStyle(severity: string) {
  switch (severity.toLowerCase()) {
    case 'mild':
      return { backgroundColor: '#E8F5E9' };
    case 'moderate':
      return { backgroundColor: '#FFF3E0' };
    case 'severe':
      return { backgroundColor: '#FFEBEE' };
    default:
      return { backgroundColor: Colors.backgroundLight };
  }
}

function getTierStyle(tier: string) {
  switch (tier) {
    case 'budget':
      return { backgroundColor: '#E8F5E9' };
    case 'mid':
      return { backgroundColor: '#E3F2FD' };
    case 'premium':
      return { backgroundColor: '#F3E5F5' };
    default:
      return { backgroundColor: Colors.backgroundLight };
  }
}

// Styles

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.large,
    paddingBottom: Spacing.default,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
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
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xxxl,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.large,
    marginBottom: Spacing.large,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.default,
  },
  concernItem: {
    marginBottom: Spacing.default,
    paddingBottom: Spacing.default,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  concernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  concernKey: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.tiny,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  concernWhy: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  summaryNotes: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginTop: Spacing.small,
    fontStyle: 'italic',
  },

  // Section
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionContent: {
    padding: Spacing.default,
  },

  // Step Card
  stepCard: {
    marginBottom: Spacing.large,
    paddingBottom: Spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.default,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brandPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  stepType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  // Instructions
  instructions: {
    marginBottom: Spacing.default,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.small,
  },
  instructionIcon: {
    fontSize: 18,
    marginRight: Spacing.small,
    marginTop: 2,
  },
  instructionContent: {
    flex: 1,
  },
  instructionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textPrimary,
  },

  // Product Card
  productCard: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: Spacing.default,
    marginTop: Spacing.small,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.tiny,
  },
  productBrand: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tierBadge: {
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.micro,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  productWhy: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginBottom: Spacing.small,
  },
  productLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accentBlue,
    marginRight: 4,
  },

  // Warnings Card
  warningsCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: Spacing.large,
    marginBottom: Spacing.large,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.default,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E65100',
    marginLeft: Spacing.small,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#E65100',
    marginBottom: Spacing.small,
  },

  // Lifestyle Tips
  lifestyleTip: {
    marginBottom: Spacing.default,
  },
  lifestyleTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.tiny,
  },
  lifestyleTipIcon: {
    fontSize: 20,
    marginRight: Spacing.small,
  },
  lifestyleTipLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  lifestyleTipText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginLeft: 28,
  },

  // Diet Section
  dietSection: {
    marginTop: Spacing.default,
    paddingTop: Spacing.default,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundLight,
  },
  dietTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.default,
  },
  dietCategory: {
    marginBottom: Spacing.default,
  },
  dietCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.tiny,
  },
  dietItem: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textPrimary,
    marginLeft: Spacing.default,
  },
});
