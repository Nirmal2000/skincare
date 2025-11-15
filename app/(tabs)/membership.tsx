import { useRouter } from "expo-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";

import {
  BETTERSKIN_PRO_ENTITLEMENT,
  ensureRevenueCatConfigured,
} from "@/features/membership/revenuecat";
import {
  Card,
  Chip,
  PrimaryButton,
  SecondaryButton,
} from "@/lib/ui/facefit-components";
import {
  ACCENT_COLOR,
  INTRO_BG,
  INTRO_CARD_STYLE,
  INTRO_SUBTEXT,
  INTRO_TEXT,
} from "../(onboarding)/welcome.constants";

const PLAN_COPY = [
  {
    title: "Unlimited BetterSkin scans",
    body: "Keep every analysis result and revisit improvements anytime.",
    icon: "repeat",
  },
  {
    title: "Personalized care streaks",
    body: "Track weekly, monthly, or yearly progress with tailored hydration nudges.",
    icon: "trending-up",
  },
  {
    title: "Priority feature drops",
    body: "Early access to new detectors and result surfaces as they roll out.",
    icon: "zap",
  },
] as const;

const PLAN_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  annual: "Yearly",
  yearly: "Yearly",
};

const SHOW_LEGACY_MEMBERSHIP_SCREEN = false;

export default function MembershipScreen() {
  if (SHOW_LEGACY_MEMBERSHIP_SCREEN) {
    return <LegacyMembershipScreen />;
  }
  return <HostedPaywallScreen />;
}

function HostedPaywallScreen() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureRevenueCatConfigured();
  }, []);

  return (
    <SafeAreaView style={styles.paywallSafeArea}>
      <View style={styles.paywallHeader}>
        <Text style={styles.paywallTitle}>BetterSkin Pro</Text>
        <Text style={styles.paywallSubtitle}>Manage or upgrade below</Text>
      </View>
      <View style={styles.paywallContainer}>
        <RevenueCatUI.Paywall
          options={{ displayCloseButton: false }}
          onPurchaseStarted={() => {
            setPending(true);
            setError(null);
          }}
          onPurchaseCompleted={() => {
            setPending(false);
            setError(null);
          }}
          onPurchaseError={({ error: purchaseError }) => {
            setPending(false);
            setError(purchaseError.message);
          }}
          onPurchaseCancelled={() => setPending(false)}
          onRestoreStarted={() => {
            setPending(true);
            setError(null);
          }}
          onRestoreCompleted={() => {
            setPending(false);
            setError(null);
          }}
          onRestoreError={({ error: restoreError }) => {
            setPending(false);
            setError(restoreError.message);
          }}
          onDismiss={() => setPending(false)}
        />
      </View>
      {pending ? (
        <View style={styles.paywallLoading}>
          <ActivityIndicator color="#FFFFFF" />
          <Text style={styles.paywallLoadingLabel}>Working with the store…</Text>
        </View>
      ) : null}
      {error ? (
        <View style={styles.paywallErrorBanner}>
          <Text style={styles.paywallErrorText}>{error}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function LegacyMembershipScreen() {
  const router = useRouter();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [manualPurchasePending, setManualPurchasePending] = useState(false);
  const [customerCenterPending, setCustomerCenterPending] = useState(false);

  const isWeb = Platform.OS === "web";
  const canEmbedPaywall = !isWeb;

  useEffect(() => {
    ensureRevenueCatConfigured();
    const listener = (info: CustomerInfo) => {
      setCustomerInfo(info);
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    loadOffering();
    Purchases.getCustomerInfo()
      .then(setCustomerInfo)
      .catch(() => null);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!offering || !offering.availablePackages.length) return;
    setSelectedPackageId((current) => current ?? offering.availablePackages[0]?.identifier ?? null);
  }, [offering]);

  const loadOffering = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offerings = await Purchases.getOfferings();
      setOffering(offerings.current ?? null);
    } catch (err) {
      console.warn("Failed to load RevenueCat offerings", err);
      setError(
        err instanceof Error
          ? err.message
          : "We couldn’t reach RevenueCat. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const selectedPackage: PurchasesPackage | undefined = useMemo(() => {
    if (!offering || !selectedPackageId) return undefined;
    return offering.availablePackages.find((pkg) => pkg.identifier === selectedPackageId);
  }, [offering, selectedPackageId]);

  const entitlementActive = Boolean(
    customerInfo?.entitlements.active[BETTERSKIN_PRO_ENTITLEMENT],
  );

  const statusCopy = entitlementActive
    ? "You’re on BetterSkin Pro. Enjoy all premium BetterSkin perks."
    : "Upgrade to BetterSkin Pro to unlock the full BetterSkin experience.";

  const handleManualPurchase = useCallback(async () => {
    if (!selectedPackage) return;
    setManualPurchasePending(true);
    try {
      await Purchases.purchasePackage(selectedPackage);
      setError(null);
    } catch (err: unknown) {
      const maybeCancelled = typeof err === "object" && err !== null && "userCancelled" in err;
      if (!maybeCancelled) {
        const message = err instanceof Error ? err.message : "Purchase failed. Try again.";
        setError(message);
      }
    } finally {
      setManualPurchasePending(false);
    }
  }, [selectedPackage]);

  const handleRestore = useCallback(async () => {
    setManualPurchasePending(true);
    try {
      await Purchases.restorePurchases();
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Restore failed. Try again.";
      setError(message);
    } finally {
      setManualPurchasePending(false);
    }
  }, []);

  const openCustomerCenter = useCallback(async () => {
    setCustomerCenterPending(true);
    try {
      await RevenueCatUI.presentCustomerCenter();
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to open Customer Center.";
      setError(message);
    } finally {
      setCustomerCenterPending(false);
    }
  }, []);

  const planPackages = offering?.availablePackages ?? [];
  const showManualFlow = !canEmbedPaywall || !planPackages.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color={INTRO_TEXT} />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          <Text style={styles.screenTitle}>Membership</Text>
        </View>

        <Card style={[styles.card, styles.heroCard]}>
          <Text style={styles.eyebrow}>BetterSkin Pro</Text>
          <Text style={styles.heroTitle}>Natural progress, on your terms.</Text>
          <Text style={styles.heroBody}>{statusCopy}</Text>
        </Card>

        <Card style={[styles.card, { gap: 20 }]}>
          {PLAN_COPY.map((item) => (
            <View key={item.title} style={styles.planRow}>
              <View style={styles.iconBadge}>
                <Feather name={item.icon as keyof typeof Feather.glyphMap} size={20} color={ACCENT_COLOR} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>{item.title}</Text>
                <Text style={styles.planBody}>{item.body}</Text>
              </View>
            </View>
          ))}
        </Card>

        <Card style={[styles.card, { gap: 16 }]}>
          <Text style={styles.sectionTitle}>Plans</Text>
          {planPackages.length ? (
            <>
              <View style={styles.chipRow}>
                {planPackages.map((pkg) => (
                  <Chip
                    key={pkg.identifier}
                    label={PLAN_LABELS[pkg.identifier] ?? pkg.packageType ?? pkg.identifier}
                    selected={selectedPackageId === pkg.identifier}
                    onPress={() => setSelectedPackageId(pkg.identifier)}
                  />
                ))}
              </View>
              {selectedPackage ? (
                <View style={styles.packageSummary}>
                  <Text style={styles.packagePrice}>
                    {selectedPackage.product.priceString}
                    <Text style={styles.packageInterval}> / {PLAN_LABELS[selectedPackage.identifier] ?? selectedPackage.packageType}</Text>
                  </Text>
                  <Text style={styles.packageDescription}>{selectedPackage.product.description}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.subtitle}>
              Pricing will appear as soon as we load your RevenueCat offering.
            </Text>
          )}
        </Card>

        {error ? (
          <View style={[styles.card, styles.errorCard]}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <SecondaryButton label="Retry" onPress={loadOffering} />
          </View>
        ) : null}

        {loading ? (
          <View style={[styles.card, styles.loader]}>
            <ActivityIndicator color={ACCENT_COLOR} />
            <Text style={styles.subtitle}>Loading latest plans…</Text>
          </View>
        ) : canEmbedPaywall && offering ? (
          <View style={styles.paywallSurface}>
            <RevenueCatUI.Paywall
              options={{ offering, displayCloseButton: false }}
              onPurchaseStarted={() => setManualPurchasePending(true)}
              onPurchaseCompleted={({ customerInfo: nextInfo }) => {
                setManualPurchasePending(false);
                setCustomerInfo(nextInfo);
              }}
              onPurchaseError={({ error: purchaseError }) => {
                setManualPurchasePending(false);
                setError(purchaseError.message);
              }}
              onPurchaseCancelled={() => setManualPurchasePending(false)}
              onRestoreStarted={() => setManualPurchasePending(true)}
              onRestoreCompleted={({ customerInfo: restoredInfo }) => {
                setManualPurchasePending(false);
                setCustomerInfo(restoredInfo);
              }}
              onRestoreError={({ error: restoreError }) => {
                setManualPurchasePending(false);
                setError(restoreError.message);
              }}
            />
          </View>
        ) : (
          <Card style={[styles.card, { gap: 12 }]}>
            <Text style={styles.sectionTitle}>Upgrade</Text>
            <Text style={styles.subtitle}>
              {isWeb
                ? "RevenueCat purchases aren’t supported on the web preview. Use a device build to subscribe."
                : "Use the buttons below to manage your plan while the native paywall is unavailable."}
            </Text>
            <PrimaryButton
              label={
                manualPurchasePending
                  ? "Working..."
                  : selectedPackage
                    ? `Upgrade for ${selectedPackage.product.priceString}`
                    : "Upgrade"
              }
              onPress={handleManualPurchase}
              disabled={!selectedPackage || manualPurchasePending}
            />
            <SecondaryButton
              label="Restore purchases"
              onPress={handleRestore}
              disabled={manualPurchasePending}
            />
          </Card>
        )}

        <Card style={[styles.card, { gap: 12 }]}>
          <Text style={styles.sectionTitle}>Need help?</Text>
          <Text style={styles.subtitle}>
            Restore purchases or manage your subscription in RevenueCat Customer Center.
          </Text>
          <SecondaryButton
            label={customerCenterPending ? "Opening..." : "Open Customer Center"}
            onPress={openCustomerCenter}
            disabled={customerCenterPending}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: INTRO_BG,
  },
  content: {
    padding: 24,
    gap: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paywallSafeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  paywallHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  paywallTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  paywallSubtitle: {
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
    fontSize: 15,
  },
  paywallContainer: {
    flex: 1,
    overflow: "hidden",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: "#050505",
  },
  paywallLoading: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paywallLoadingLabel: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  paywallErrorBanner: {
    position: "absolute",
    top: 24,
    left: 24,
    right: 24,
    borderRadius: 12,
    backgroundColor: "rgba(192,53,21,0.9)",
    padding: 12,
  },
  paywallErrorText: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backLabel: {
    color: INTRO_TEXT,
    fontSize: 16,
    fontWeight: "500",
  },
  screenTitle: {
    flex: 1,
    textAlign: "right",
    fontSize: 18,
    fontWeight: "600",
    color: INTRO_TEXT,
  },
  card: {
    ...INTRO_CARD_STYLE,
    gap: 8,
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
  },
  eyebrow: {
    color: ACCENT_COLOR,
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: INTRO_TEXT,
  },
  heroBody: {
    fontSize: 16,
    color: INTRO_SUBTEXT,
  },
  planRow: {
    flexDirection: "row",
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(241,138,27,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  planTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: INTRO_TEXT,
  },
  planBody: {
    fontSize: 14,
    color: INTRO_SUBTEXT,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: INTRO_TEXT,
  },
  subtitle: {
    fontSize: 14,
    color: INTRO_SUBTEXT,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  packageSummary: {
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 16,
    padding: 16,
  },
  packagePrice: {
    fontSize: 22,
    fontWeight: "700",
    color: INTRO_TEXT,
  },
  packageInterval: {
    fontSize: 16,
    color: INTRO_SUBTEXT,
    fontWeight: "500",
  },
  packageDescription: {
    marginTop: 6,
    color: INTRO_SUBTEXT,
  },
  errorCard: {
    borderWidth: 1,
    borderColor: "rgba(192,53,21,0.3)",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C03515",
  },
  errorBody: {
    fontSize: 14,
    color: "#5C180A",
  },
  loader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  paywallSurface: {
    minHeight: 520,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#000",
  },
});
