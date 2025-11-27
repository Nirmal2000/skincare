import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
} from '@/constants/Tokens';

const FEATURE_LIST = [
  'Advanced AI Skin Analysis',
  'Personalized Daily Skin Routine',
  'Adaptive Smart Sknly AI',
  'Skin-Friendly Products Suggestions',
];

const backgroundImage = require('@/assets/images/ob1.jpg');

function getPackageTitle(pkg: PurchasesPackage, fallback: string) {
  switch (pkg.packageType) {
    case Purchases.PACKAGE_TYPE.ANNUAL:
      return 'Sknly Yearly Pro';
    case Purchases.PACKAGE_TYPE.MONTHLY:
      return 'Sknly Monthly Pro';
    case Purchases.PACKAGE_TYPE.WEEKLY:
      return 'Sknly Weekly Pro';
    default:
      return fallback;
  }
}

function getPackagePeriod(pkg: PurchasesPackage) {
  switch (pkg.packageType) {
    case Purchases.PACKAGE_TYPE.ANNUAL:
      return 'year';
    case Purchases.PACKAGE_TYPE.MONTHLY:
      return 'month';
    case Purchases.PACKAGE_TYPE.WEEKLY:
      return 'week';
    default:
      return '';
  }
}

export default function PaywallScreen() {
  const router = useRouter();
  const {
    offerings,
    isLoadingOfferings,
    purchasePackage,
    isPro,
    restorePurchases,
  } = useSubscription();
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

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

  const handleRestorePurchases = async () => {
    try {
      const info = await restorePurchases();
      if (info) {
        Alert.alert('Restored', 'Your previous purchases have been restored.');
      } else {
        Alert.alert('Restore Failed', 'No purchases to restore.');
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Something went wrong. Please try again.');
    }
  };

  const renderBackground = (content: React.ReactNode) => (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(5, 5, 9, 0.1)', 'rgba(5, 5, 9, 0.85)', 'rgba(5, 5, 9, 0.95)']}
        style={styles.overlay}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {content}
      </SafeAreaView>
    </ImageBackground>
  );

  if (isPro) {
    return renderBackground(
      <>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={26} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>You&apos;re Already Pro!</Text>
          <Text style={styles.stateSubtitle}>
            You have access to every premium feature.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="white"
            style={styles.stateButton}
          />
        </View>
      </>
    );
  }

  if (isLoadingOfferings) {
    return renderBackground(
      <>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={26} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={Colors.white} />
          <Text style={styles.stateSubtitle}>Loading plans...</Text>
        </View>
      </>
    );
  }

  if (!packages.length) {
    return renderBackground(
      <>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={26} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>No plans available</Text>
          <Text style={styles.stateSubtitle}>
            Please check your connection and try again later.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="white"
            style={styles.stateButton}
          />
        </View>
      </>
    );
  }

  return renderBackground(
    <>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Start Your Glow-Up✨</Text>
          <View style={styles.featuresList}>
            {FEATURE_LIST.map((feature) => (
              <FeatureItem key={feature} text={feature} />
            ))}
          </View>
        </View>

        <View style={styles.planContainer}>
          {packages.map((pkg) => {
            const product = pkg.product;
            const isSelected = selectedPackage?.identifier === pkg.identifier;
            const planTitle = getPackageTitle(pkg, product.title);
            const planPeriod = getPackagePeriod(pkg);
            const priceCopy = planPeriod
              ? `${product.priceString}/${planPeriod}`
              : product.priceString;
            const isBestValue = pkg.packageType === Purchases.PACKAGE_TYPE.ANNUAL;

            return (
              <TouchableOpacity
                key={pkg.identifier}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                ]}
                onPress={() => handleSelectPackage(pkg)}
                activeOpacity={0.8}
              >
                {isBestValue && <Text style={styles.planBadge}>BEST VALUE</Text>}
                <View style={styles.planCardContent}>
                  <View>
                    <Text style={styles.planTitle}>{planTitle}</Text>
                    <Text style={styles.planPrice}>{priceCopy}</Text>
                  </View>
                  <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                    {isSelected && <View style={styles.radioButtonInner} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title={isPurchasing ? 'Processing...' : 'Continue'}
          onPress={handlePurchase}
          variant="primary"
          disabled={!selectedPackage || isPurchasing}
          loading={isPurchasing}
          style={styles.ctaButton}
        />

        <Text style={styles.promiseText}>No commitment, cancel anytime</Text>

        <View style={styles.footerLinks}>
          <Text style={styles.footerLinkText}>Privacy</Text>
          <View style={styles.footerDivider} />
          <TouchableOpacity onPress={handleRestorePurchases}>
            <Text style={styles.footerLinkText}>Restore</Text>
          </TouchableOpacity>
          <View style={styles.footerDivider} />
          <Text style={styles.footerLinkText}>Terms</Text>
        </View>
      </ScrollView>
    </>
  );
}

interface FeatureItemProps {
  text: string;
}

function FeatureItem({ text }: FeatureItemProps) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons name="checkmark" size={16} color={Colors.white} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.large,
  },
  topBar: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: Spacing.large,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  heroSection: {
    marginBottom: Spacing.xl,
  },
  heroTitle: {
    ...Typography.h1,
    color: Colors.white,
    marginBottom: Spacing.large,
  },
  featuresList: {
    gap: Spacing.small,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.successGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    ...Typography.bodyLarge,
    color: Colors.white,
    flex: 1,
  },
  planContainer: {
    gap: Spacing.small,
    marginBottom: Spacing.large,
  },
  planCard: {
    borderRadius: BorderRadius.large,
    padding: Spacing.medium,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  planCardSelected: {
    borderColor: Colors.white,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  planBadge: {
    ...Typography.caption,
    color: Colors.white,
    alignSelf: 'flex-start',
    marginBottom: Spacing.tiny,
    letterSpacing: 0.5,
  },
  planCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTitle: {
    ...Typography.h3,
    color: Colors.white,
    marginBottom: Spacing.tiny,
  },
  planPrice: {
    ...Typography.bodyLarge,
    color: 'rgba(255,255,255,0.8)',
  },
  radioButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.white,
  },
  radioButtonInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.white,
  },
  ctaButton: {
    width: '100%',
    marginBottom: Spacing.default,
  },
  promiseText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: Spacing.small,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.small,
  },
  footerLinkText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  footerDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.large,
  },
  stateTitle: {
    ...Typography.h1,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.small,
  },
  stateSubtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: Spacing.default,
  },
  stateButton: {
    marginTop: Spacing.xl,
    width: '60%',
  },
});
