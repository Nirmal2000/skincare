import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import * as Haptics from 'expo-haptics';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { Button } from '@/components/Button';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
} from '@/constants/Tokens';

export default function PaywallScreen() {
  const router = useRouter();
  const { offerings, isLoadingOfferings, purchasePackage, isPro } = useSubscription();
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Sort packages: Annual > Monthly > Weekly
  const packages = useMemo(() => {
    const currentOffering = offerings?.current;
    if (!currentOffering) return [];

    const all = currentOffering.availablePackages;
    const order = [
      Purchases.PACKAGE_TYPE.ANNUAL,
      Purchases.PACKAGE_TYPE.MONTHLY,
      Purchases.PACKAGE_TYPE.WEEKLY,
    ];

    return [...all].sort(
      (a, b) => order.indexOf(a.packageType) - order.indexOf(b.packageType)
    );
  }, [offerings]);

  // Auto-select the annual package (best value)
  React.useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      const annualPkg = packages.find((p) => p.packageType === Purchases.PACKAGE_TYPE.ANNUAL);
      setSelectedPackage(annualPkg || packages[0]);
    }
  }, [packages, selectedPackage]);

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    try {
      setIsPurchasing(true);
      const customerInfo = await purchasePackage(selectedPackage);

      if (customerInfo) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Welcome to Pro!',
          'You now have access to all premium features.',
          [{ text: 'Get Started', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleSelectPackage = (pkg: PurchasesPackage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPackage(pkg);
  };

  if (isPro) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>You&apos;re Already Pro!</Text>
          <Text style={styles.subtitle}>
            You have access to all premium features.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="primary"
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  if (isLoadingOfferings) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  if (!packages.length) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>
          No subscription packages available.{'\n'}
          Please check your connection and try again.
        </Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="secondary"
          style={styles.button}
        />
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Unlock Premium Features</Text>
          <Text style={styles.subtitle}>
            Get the most out of BetterSkin with advanced analytics and unlimited scans
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <FeatureItem icon="✓" text="Unlimited skin scans" />
          <FeatureItem icon="✓" text="Advanced facial area analysis" />
          <FeatureItem icon="✓" text="Track progress over time" />
          <FeatureItem icon="✓" text="Personalized skincare insights" />
          <FeatureItem icon="✓" text="Priority support" />
        </View>

        {/* Package Selection */}
        <View style={styles.packagesContainer}>
          {packages.map((pkg) => {
            const product = pkg.product;
            const isSelected = selectedPackage?.identifier === pkg.identifier;
            const isBestValue = pkg.packageType === Purchases.PACKAGE_TYPE.ANNUAL;
            const isPopular = pkg.packageType === Purchases.PACKAGE_TYPE.MONTHLY;

            const packageTitle =
              pkg.packageType === Purchases.PACKAGE_TYPE.ANNUAL
                ? 'Yearly'
                : pkg.packageType === Purchases.PACKAGE_TYPE.MONTHLY
                ? 'Monthly'
                : pkg.packageType === Purchases.PACKAGE_TYPE.WEEKLY
                ? 'Weekly'
                : product.title;

            return (
              <TouchableOpacity
                key={pkg.identifier}
                style={[
                  styles.packageCard,
                  isSelected && styles.packageCardSelected,
                  isBestValue && styles.packageCardBestValue,
                ]}
                onPress={() => handleSelectPackage(pkg)}
                activeOpacity={0.7}
              >
                {isBestValue && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>BEST VALUE</Text>
                  </View>
                )}
                {isPopular && !isBestValue && (
                  <View style={[styles.badge, styles.badgePopular]}>
                    <Text style={styles.badgeText}>POPULAR</Text>
                  </View>
                )}

                <View style={styles.packageContent}>
                  <View style={styles.packageHeader}>
                    <Text style={styles.packageTitle}>{packageTitle}</Text>
                    <View
                      style={[
                        styles.radioButton,
                        isSelected && styles.radioButtonSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioButtonInner} />}
                    </View>
                  </View>

                  <Text style={styles.packagePrice}>{product.priceString}</Text>

                  {product.subscriptionPeriod && (
                    <Text style={styles.packagePeriod}>
                      per {(() => {
                        switch (pkg.packageType) {
                          case Purchases.PACKAGE_TYPE.WEEKLY:
                            return 'week';
                          case Purchases.PACKAGE_TYPE.MONTHLY:
                            return 'month';
                          case Purchases.PACKAGE_TYPE.ANNUAL:
                            return 'year';
                          default:
                            return ''; // fallback
                        }
                      })()}
                    </Text>
                  )}

                  {/* Show intro price if available */}
                  {product.introPrice &&
                    product.introPrice.price &&
                    product.introPrice.price > 0 && (
                      <Text style={styles.introPrice}>
                        {product.introPrice.priceString} for{' '}
                        {product.introPrice.periodNumberOfUnits}{' '}
                        {product.introPrice.periodUnit.toLowerCase()}
                      </Text>
                    )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legal Text */}
        <Text style={styles.legalText}>
          Payment will be charged to your Apple ID account. Subscription
          automatically renews unless canceled at least 24 hours before the end
          of the current period. Manage or cancel anytime in Settings.
        </Text>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <Button
          title={isPurchasing ? 'Processing...' : 'Continue'}
          onPress={handlePurchase}
          variant="primary"
          disabled={!selectedPackage || isPurchasing}
          loading={isPurchasing}
          style={styles.ctaButton}
        />
      </View>
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
    paddingBottom: Spacing.xxl,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.screenMarginHorizontal,
  },

  // Header
  header: {
    marginTop: Spacing.large,
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    lineHeight: 24,
  },

  // Features
  featuresContainer: {
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.default,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  featureIconText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  featureText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },

  // Packages
  packagesContainer: {
    marginBottom: Spacing.large,
  },
  packageCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.large,
    padding: Spacing.medium,
    marginBottom: Spacing.base,
    borderWidth: 2,
    borderColor: Colors.borderSubtle,
    ...Shadows.cardLight,
    position: 'relative',
  },
  packageCardSelected: {
    borderColor: Colors.brandPrimary,
    borderWidth: 3,
  },
  packageCardBestValue: {
    backgroundColor: '#F8F9FF',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: Spacing.medium,
    backgroundColor: Colors.successGreen,
    paddingHorizontal: Spacing.base,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  badgePopular: {
    backgroundColor: Colors.brandPrimary,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  packageContent: {
    marginTop: Spacing.small,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  packageTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  packagePrice: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  packagePeriod: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  introPrice: {
    ...Typography.bodySmall,
    color: Colors.successGreen,
    marginTop: Spacing.tiny,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.brandPrimary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.brandPrimary,
  },

  // Legal
  legalText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: Spacing.default,
  },

  // Bottom Bar
  bottomBar: {
    paddingHorizontal: Layout.screenMarginHorizontal,
    paddingBottom: Spacing.large,
    paddingTop: Spacing.default,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
  },
  ctaButton: {
    width: '100%',
  },
  button: {
    marginTop: Spacing.large,
  },

  // Loading/Error states
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.default,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
