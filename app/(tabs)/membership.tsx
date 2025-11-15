import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 1. Make sure this file has your REAL 'appl_...' key
import {
  BETTERSKIN_PRO_ENTITLEMENT,
  ensureRevenueCatConfigured,
} from "@/features/membership/revenuecat";
import { useTabBarAutoHideScrollHandler } from "@/features/navigation/tab-bar-visibility";
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

// 2. This is the original feature list from your code
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

// 3. This will map the identifiers from RevenueCat
const PLAN_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  annual: "Yearly",
  yearly: "Yearly",
  // Add your real product IDs if they are different
  "src_weekly": "Weekly",
  "src_monthly": "Monthly",
  "src_annual": "Yearly",
};

// 4. Set this to true to use your custom UI
const SHOW_LEGACY_MEMBERSHIP_SCREEN = true;

export default function MembershipScreen() {
  if (SHOW_LEGACY_MEMBERSHIP_SCREEN) {
    return <LegacyMembershipScreen />;
  }
  return <HostedPaywallScreen />;
}

// This is the hosted UI, leave it as-is
function HostedPaywallScreen() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    ensureRevenueCatConfigured();
  }, []);

  return (
    <View style={styles.paywallSafeArea}>
      <View style={[styles.paywallHeader, { paddingTop: insets.top + 24 }]}>
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
    </View>
  );
}

//
// 5. THIS IS YOUR REAL, DYNAMIC LEGACY SCREEN
//
function LegacyMembershipScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [manualPurchasePending, setManualPurchasePending] = useState(false);
  const [customerCenterPending, setCustomerCenterPending] = useState(false);
  const scrollHandler = useTabBarAutoHideScrollHandler();

  const isWeb = Platform.OS === "web";
  
  // This is no longer needed, we will always show the manual flow
  // const canEmbedPaywall = !isWeb; 

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
    // Default to monthly if available, otherwise the first one
    const monthlyPkg = offering.availablePackages.find(pkg => pkg.identifier.includes("monthly"));
    setSelectedPackageId(monthlyPkg?.identifier ?? offering.availablePackages[0]?.identifier ?? null);
  }, [offering]);

  const loadOffering = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
         setOffering(offerings.current);
      } else {
        setError("No subscription plans are currently available.");
      }
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
      // Check if the user cancelled
      const maybeCancelled = typeof err === "object" && err !== null && "userCancelled" in err && err.userCancelled;
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
      const restoredInfo = await Purchases.restorePurchases();
      // Check if they got the entitlement
      if (restoredInfo.entitlements.active[BETTERSKIN_PRO_ENTITLEMENT]) {
         Alert.alert("Success", "Your purchase has been restored.");
      } else {
         Alert.alert("No Purchases Found", "We couldn't find any active subscriptions to restore.");
      }
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

  return (
    <View style={styles.safeArea}>
      <Animated.ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
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

        {/* This is the new, cleaner "Plans" card */}
        <Card style={[styles.card, { gap: 20 }]}>
          <Text style={styles.sectionTitle}>Plans</Text>
          {loading ? (
             <View style={styles.loader}>
              <ActivityIndicator color={ACCENT_COLOR} />
              <Text style={styles.subtitle}>Loading latest plans…</Text>
            </View>
          ) : (
            <>
              <View style={styles.chipRow}>
                {planPackages.map((pkg) => (
                  <Chip
                    key={pkg.identifier}
                    label={PLAN_LABELS[pkg.product.identifier] ?? pkg.product.identifier}
                    selected={selectedPackageId === pkg.identifier}
                    onPress={() => setSelectedPackageId(pkg.identifier)}
                  />
                ))}
              </View>
              {selectedPackage ? (
                <View style={styles.packageSummary}>
                  <Text style={styles.packagePrice}>
                    {selectedPackage.product.priceString}
                    <Text style={styles.packageInterval}> / {PLAN_LABELS[selectedPackage.product.identifier] ?? selectedPackage.packageType}</Text>
                  </Text>
                  <Text style={styles.packageDescription}>{selectedPackage.product.description}</Text>
                </View>
              ) : null}
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
            </>
          )}
        </Card>

        {/* Restore button is now outside the card */}
        <Pressable 
          onPress={handleRestore} 
          style={styles.restoreButton}
          disabled={manualPurchasePending}
        >
          <Text style={styles.restoreButtonText}>Restore purchases</Text>
        </Pressable>


        {error ? (
          <View style={[styles.card, styles.errorCard]}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <SecondaryButton label="Retry" onPress={loadOffering} />
          </View>
        ) : null}

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
      </Animated.ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------
// All your original styles + NEW STYLES
// ---------------------------------------------------------------

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
    gap: 4, 
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
    padding: 24,
    justifyContent: "center",
  },
  paywallSurface: {
    minHeight: 520,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  // STYLES FOR THE RESTORE BUTTON
  restoreButton: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  restoreButtonText: {
    color: INTRO_SUBTEXT,
    fontSize: 15,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
