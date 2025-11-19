import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { Button } from '@/components/Button';
import { PRO_ENTITLEMENT_ID } from '@/features/subscription/config/revenuecat-config';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
} from '@/constants/Tokens';

export default function ManageSubscriptionScreen() {
  const router = useRouter();
  const { customerInfo, isPro, restorePurchases, isLoadingCustomerInfo } = useSubscription();
  const [isRestoring, setIsRestoring] = useState(false);

  const entitlement = customerInfo?.entitlements.active[PRO_ENTITLEMENT_ID];
  const renewalDate = entitlement?.expirationDate
    ? new Date(entitlement.expirationDate)
    : null;

  const statusLabel = !entitlement
    ? 'Free'
    : entitlement.willRenew
    ? 'Active'
    : 'Active (expires soon)';

  const statusColor = !entitlement
    ? Colors.textSecondary
    : entitlement.willRenew
    ? Colors.successGreen
    : Colors.warningOrange;

  const handleManageSubscriptions = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === 'ios') {
      // Deep link to Apple subscription management
      const url = 'https://apps.apple.com/account/subscriptions';
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Manage Subscription',
          'To manage your subscription:\n\n1. Open the Settings app\n2. Tap your name at the top\n3. Select Subscriptions\n4. Find BetterSkin'
        );
      }
    } else {
      // Android: Google Play subscriptions
      const url = 'https://play.google.com/store/account/subscriptions';
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Manage Subscription',
          'To manage your subscription:\n\n1. Open Google Play\n2. Tap your profile icon\n3. Select Payments & subscriptions\n4. Tap Subscriptions'
        );
      }
    }
  };

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const restoredInfo = await restorePurchases();

      if (restoredInfo?.entitlements.active[PRO_ENTITLEMENT_ID]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Restore Successful',
          'Your Pro subscription has been restored!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any active subscriptions linked to this account.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(
        'Restore Failed',
        'Something went wrong. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(subscription)/paywall');
  };

  if (isLoadingCustomerInfo) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
        <Text style={styles.loadingText}>Loading subscription info...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.sectionLabel}>Subscription Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>

          {isPro ? (
            <View style={styles.proDetails}>
              <InfoRow label="Plan" value={entitlement?.productIdentifier || 'Pro'} />

              {renewalDate && (
                <InfoRow
                  label={entitlement?.willRenew ? 'Renews on' : 'Expires on'}
                  value={renewalDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                />
              )}

              {entitlement?.billingIssueDetectedAt && (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningText}>
                    ⚠️ Billing issue detected. Please update your payment method.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.freeUserInfo}>
              <Text style={styles.freeUserText}>
                You're currently on the free plan. Upgrade to Pro for unlimited
                scans and advanced features.
              </Text>
            </View>
          )}
        </View>

        {/* Features Card (for free users) */}
        {!isPro && (
          <View style={styles.featuresCard}>
            <Text style={styles.sectionLabel}>Pro Features</Text>
            <FeatureItem icon="✓" text="Unlimited skin scans" />
            <FeatureItem icon="✓" text="Advanced facial area analysis" />
            <FeatureItem icon="✓" text="Track progress over time" />
            <FeatureItem icon="✓" text="Priority support" />
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {isPro ? (
            <ActionButton
              title="Manage in App Store"
              subtitle={`Cancel or change your subscription`}
              onPress={handleManageSubscriptions}
            />
          ) : (
            <ActionButton
              title="Upgrade to Pro"
              subtitle="Unlock all premium features"
              onPress={handleUpgrade}
              highlighted
            />
          )}

          <ActionButton
            title="Restore Purchases"
            subtitle="Already purchased? Restore your subscription"
            onPress={handleRestore}
            loading={isRestoring}
          />
        </View>

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            Having trouble with your subscription? Contact us at support@betterskin.com
            or visit our help center.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

interface FeatureItemProps {
  icon: string;
  text: string;
}

function FeatureItem({ icon, text }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Text style={styles.featureIconText}>{icon}</Text>
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

interface ActionButtonProps {
  title: string;
  subtitle: string;
  onPress: () => void;
  highlighted?: boolean;
  loading?: boolean;
}

function ActionButton({
  title,
  subtitle,
  onPress,
  highlighted = false,
  loading = false,
}: ActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, highlighted && styles.actionButtonHighlighted]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={loading}
    >
      <View style={styles.actionContent}>
        <Text style={[styles.actionTitle, highlighted && styles.actionTitleHighlighted]}>
          {title}
        </Text>
        <Text style={[styles.actionSubtitle, highlighted && styles.actionSubtitleHighlighted]}>
          {subtitle}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={highlighted ? Colors.white : Colors.brandPrimary} />
      ) : (
        <Text style={[styles.actionArrow, highlighted && styles.actionArrowHighlighted]}>›</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenMarginHorizontal,
    paddingTop: Spacing.large,
    paddingBottom: Spacing.xxl,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.screenMarginHorizontal,
  },

  // Status Card
  statusCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.large,
    padding: Spacing.medium,
    marginBottom: Spacing.default,
    ...Shadows.card,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.base,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.default,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.small,
  },
  statusText: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  proDetails: {
    marginTop: Spacing.small,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.small,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
  },
  infoLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  warningBanner: {
    backgroundColor: Colors.warningOrange,
    borderRadius: BorderRadius.small,
    padding: Spacing.base,
    marginTop: Spacing.default,
  },
  warningText: {
    ...Typography.bodySmall,
    color: Colors.white,
  },
  freeUserInfo: {
    marginTop: Spacing.small,
  },
  freeUserText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Features Card
  featuresCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.large,
    padding: Spacing.medium,
    marginBottom: Spacing.default,
    ...Shadows.card,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.base,
  },
  featureIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  featureIconText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  featureText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },

  // Actions
  actionsContainer: {
    marginBottom: Spacing.large,
  },
  actionButton: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.large,
    padding: Spacing.medium,
    marginBottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.cardLight,
  },
  actionButtonHighlighted: {
    backgroundColor: Colors.brandPrimary,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  actionTitleHighlighted: {
    color: Colors.white,
  },
  actionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  actionSubtitleHighlighted: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionArrow: {
    fontSize: 32,
    color: Colors.textTertiary,
    marginLeft: Spacing.base,
  },
  actionArrowHighlighted: {
    color: Colors.white,
  },

  // Help Section
  helpSection: {
    marginTop: Spacing.large,
  },
  helpTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  helpText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Loading
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.default,
  },
});
