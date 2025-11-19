Nice, Expo + RevenueCat is a great combo. I’ll stick to code + short explanations.

Below is a **complete, generic setup** you can drop into any Expo React Native app that uses:

* RevenueCat
* 1 entitlement: `pro`
* 1 offering: `default` with packages `$rc_weekly`, `$rc_monthly`, `$rc_annual` (like in your screenshot)

> ⚠️ Assumes you’ve already:
>
> * Installed `react-native-purchases` and created an **Expo dev build** (RevenueCat doesn’t work in Expo Go). ([revenuecat.com][1])
> * Set up products + offerings in RevenueCat and they’re all **active** on App Store Connect.

---

## 1. RevenueCat initialization (run once)

`src/revenuecat/config.ts`

```ts
// src/revenuecat/config.ts
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesConfiguration } from 'react-native-purchases';

// TODO: replace with your real keys from RevenueCat dashboard
// Project Settings → API keys → App-specific keys :contentReference[oaicite:1]{index=1}
const REVENUECAT_IOS_API_KEY = 'appl_xxxxxxxxxxxxxxxxxx';
const REVENUECAT_ANDROID_API_KEY = 'goog_xxxxxxxxxxxxxxxxxx';

export async function initRevenueCat(appUserId?: string | null) {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG); // turn to INFO or ERROR for production

  const apiKey =
    Platform.OS === 'ios' ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;

  const config: PurchasesConfiguration = {
    apiKey,
    appUserID: appUserId ?? null,
    observerMode: false,
  };

  Purchases.configure(config); // initialize SDK :contentReference[oaicite:2]{index=2}
}
```

Call this **once** near app startup:

```ts
// App.tsx
import React, { useEffect } from 'react';
import { initRevenueCat } from './src/revenuecat/config';

export default function App() {
  useEffect(() => {
    // if you have auth, pass your user id instead of null
    initRevenueCat(null);
  }, []);

  return (
    // your navigation / screens
  );
}
```

---

## 2. Small hook + context for offerings & customer info

This keeps the rest of your code clean.

`src/revenuecat/RevenueCatProvider.tsx`

```ts
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  Offerings,
} from 'react-native-purchases';

type RevenueCatContextValue = {
  offerings: Offerings | null;
  isLoadingOfferings: boolean;
  customerInfo: CustomerInfo | null;
  isPro: boolean;
  purchasePackage: (pack: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
};

const RevenueCatContext = createContext<RevenueCatContextValue | undefined>(
  undefined
);

export const RevenueCatProvider = ({ children }: { children: ReactNode }) => {
  const [offerings, setOfferings] = useState<Offerings | null>(null);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const PRO_ENTITLEMENT_ID = 'pro';

  const loadOfferings = async () => {
    try {
      setIsLoadingOfferings(true);
      const result = await Purchases.getOfferings(); // fetch configured offerings :contentReference[oaicite:3]{index=3}
      setOfferings(result);
    } catch (e) {
      console.warn('Error fetching offerings', e);
      setOfferings(null);
    } finally {
      setIsLoadingOfferings(false);
    }
  };

  const refreshCustomerInfo = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (e) {
      console.warn('Error fetching customer info', e);
    }
  };

  useEffect(() => {
    loadOfferings();
    refreshCustomerInfo();

    // Subscribe to changes (e.g. after purchase on another device)
    const listener = Purchases.addCustomerInfoUpdateListener(setCustomerInfo);
    return () => Purchases.removeCustomerInfoUpdateListener(listener);
  }, []);

  const purchasePackage = async (pack: PurchasesPackage) => {
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pack); // start purchase flow :contentReference[oaicite:4]{index=4}
      setCustomerInfo(info);
    } catch (e: any) {
      if (!e?.userCancelled) {
        console.warn('Purchase failed', e);
      }
    }
  };

  const restorePurchases = async () => {
    try {
      const info = await Purchases.restorePurchases(); // restore based on App Store receipt :contentReference[oaicite:5]{index=5}
      setCustomerInfo(info);
    } catch (e) {
      console.warn('Restore failed', e);
    }
  };

  const isPro =
    !!customerInfo?.entitlements?.active &&
    Object.prototype.hasOwnProperty.call(
      customerInfo.entitlements.active,
      PRO_ENTITLEMENT_ID
    );

  const value: RevenueCatContextValue = {
    offerings,
    isLoadingOfferings,
    customerInfo,
    isPro,
    purchasePackage,
    restorePurchases,
    refreshCustomerInfo,
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCat = () => {
  const ctx = useContext(RevenueCatContext);
  if (!ctx) {
    throw new Error('useRevenueCat must be used inside RevenueCatProvider');
  }
  return ctx;
};
```

Wrap your app:

```tsx
// App.tsx (simplified)
import { RevenueCatProvider } from './src/revenuecat/RevenueCatProvider';

export default function App() {
  useEffect(() => { initRevenueCat(null); }, []);

  return (
    <RevenueCatProvider>
      {/* your NavigationContainer / screens */}
    </RevenueCatProvider>
  );
}
```

---

## 3. Custom paywall screen (weekly / monthly / yearly)

This uses your **default** offering and the three packages it contains.

`src/screens/PaywallScreen.tsx`

```tsx
import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useRevenueCat } from '../revenuecat/RevenueCatProvider';

export const PaywallScreen = () => {
  const { offerings, isLoadingOfferings, purchasePackage, restorePurchases } =
    useRevenueCat();

  const packages = useMemo(() => {
    const currentOffering = offerings?.current;
    if (!currentOffering) return [];

    // You can also sort by packageType instead of hardcoding ids
    const all = currentOffering.availablePackages; // from RC offerings API :contentReference[oaicite:6]{index=6}

    // (Optional) sort so annual > monthly > weekly
    const order = [
      Purchases.PACKAGE_TYPE.ANNUAL,
      Purchases.PACKAGE_TYPE.MONTHLY,
      Purchases.PACKAGE_TYPE.WEEKLY,
    ];

    return [...all].sort(
      (a, b) => order.indexOf(a.packageType) - order.indexOf(b.packageType)
    );
  }, [offerings]);

  const handleSelect = async (pack: PurchasesPackage) => {
    await purchasePackage(pack);
    // After success, your navigation logic (e.g. go back or show success)
  };

  if (isLoadingOfferings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.text}>Loading plans…</Text>
      </View>
    );
  }

  if (!packages.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>
          No subscription packages available. Check RevenueCat config.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* header */}
      <Text style={styles.title}>Go Pro</Text>
      <Text style={styles.subtitle}>Unlock all premium features.</Text>

      {/* feature bullets – placeholder text */}
      <View style={styles.features}>
        <Text style={styles.feature}>• Unlimited usage</Text>
        <Text style={styles.feature}>• Priority support</Text>
        <Text style={styles.feature}>• All upcoming features</Text>
      </View>

      {/* packages */}
      {packages.map((pack) => {
        const product = pack.storeProduct;
        const isBestValue = pack.packageType === Purchases.PACKAGE_TYPE.ANNUAL;
        const isPopular = pack.packageType === Purchases.PACKAGE_TYPE.MONTHLY;

        return (
          <TouchableOpacity
            key={pack.identifier}
            style={[
              styles.card,
              isBestValue && styles.cardBestValue,
              isPopular && styles.cardPopular,
            ]}
            onPress={() => handleSelect(pack)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {pack.packageType === Purchases.PACKAGE_TYPE.ANNUAL
                  ? 'Yearly'
                  : pack.packageType === Purchases.PACKAGE_TYPE.MONTHLY
                  ? 'Monthly'
                  : pack.packageType === Purchases.PACKAGE_TYPE.WEEKLY
                  ? 'Weekly'
                  : product.title}
              </Text>
              {isBestValue && <Text style={styles.badge}>Best value</Text>}
              {isPopular && !isBestValue && (
                <Text style={styles.badgeSecondary}>Most popular</Text>
              )}
            </View>

            <Text style={styles.price}>
              {product.priceString}{' '}
              <Text style={styles.period}>
                / {product.subscriptionPeriod?.unit.toLowerCase() ?? 'period'}
              </Text>
            </Text>

            {/* show free trial / intro price if configured */}
            {product.introPrice &&
              product.introPrice.price &&
              product.introPrice.price > 0 && (
                <Text style={styles.trial}>
                  {product.introPrice.priceString} for{' '}
                  {product.introPrice.periodNumberOfUnits}{' '}
                  {product.introPrice.periodUnit.toLowerCase()} then
                  renews at {product.priceString}.
                </Text>
              )}
          </TouchableOpacity>
        );
      })}

      {/* primary CTA could also go inside each card */}
      <Text style={styles.legal}>
        Payment will be charged to your Apple ID account. Subscription renews
        automatically unless canceled at least 24 hours before the end of the
        period. Manage or cancel anytime in your subscription settings.
      </Text>

      {/* restore */}
      <TouchableOpacity style={styles.restoreBtn} onPress={restorePurchases}>
        <Text style={styles.restoreText}>Restore Purchases</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 16, opacity: 0.7, marginBottom: 16 },
  features: { marginBottom: 16 },
  feature: { fontSize: 14, marginVertical: 2 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
    padding: 14,
    marginBottom: 10,
  },
  cardBestValue: { borderColor: '#4caf50' },
  cardPopular: { borderColor: '#2196f3' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '600', flex: 1 },
  badge: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#4caf50',
    color: 'white',
    borderRadius: 999,
  },
  badgeSecondary: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#2196f3',
    color: 'white',
    borderRadius: 999,
  },
  price: { fontSize: 20, fontWeight: '700', marginTop: 6 },
  period: { fontSize: 14, fontWeight: '400' },
  trial: { fontSize: 12, marginTop: 4, opacity: 0.8 },
  legal: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 14,
  },
  restoreBtn: {
    marginTop: 16,
    alignSelf: 'center',
    padding: 8,
  },
  text: { fontSize: 14, textAlign: 'center' },
  restoreText: { fontSize: 14, textDecorationLine: 'underline' },
});
```

This screen:

* Dynamically pulls your three packages from the default offering (so you can reuse it for other apps).
* Calls `purchasePackage()` and `restorePurchases()` from the context.

---

## 4. Membership / “Manage Subscription” screen

Show current status (active / not), plan info, and link the user to system subscription management.

There is no dedicated RN API for `showManageSubscriptions`, so on iOS we usually deep-link to the subscription management page or explain how to reach it. ([Stack Overflow][2])

`src/screens/SubscriptionScreen.tsx`

```tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useRevenueCat } from '../revenuecat/RevenueCatProvider';

export const SubscriptionScreen = () => {
  const { customerInfo, isPro, restorePurchases } = useRevenueCat();
  const entitlement = customerInfo?.entitlements.active['pro'];

  const renewalDate = entitlement?.expirationDate
    ? new Date(entitlement.expirationDate)
    : null;

  const statusLabel = !entitlement
    ? 'Free user'
    : entitlement.willRenew
    ? 'Active (auto-renew)'
    : 'Active (will expire)';

  const openManageSubscriptions = async () => {
    if (Platform.OS === 'ios') {
      // Deep link to Apple subscription management page in App Store / Settings :contentReference[oaicite:8]{index=8}
      const url = 'https://apps.apple.com/account/subscriptions';
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Manage Subscription',
          'Open the Settings app → [your name] → Subscriptions.'
        );
      }
    } else {
      // For Android you might open "market://details?id=your.package" or Google Play subscriptions page
      const url = 'https://play.google.com/store/account/subscriptions';
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Manage Subscription',
          'Open Google Play → your profile → Payments & subscriptions.'
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscription</Text>
      <Text style={styles.status}>{statusLabel}</Text>

      {entitlement && (
        <>
          <Text style={styles.label}>Product ID</Text>
          <Text style={styles.value}>{entitlement.productIdentifier}</Text>

          {renewalDate && (
            <>
              <Text style={styles.label}>
                {entitlement.willRenew ? 'Renews on' : 'Expires on'}
              </Text>
              <Text style={styles.value}>{renewalDate.toDateString()}</Text>
            </>
          )}
        </>
      )}

      {!entitlement && (
        <Text style={styles.info}>
          You don’t have an active Pro subscription. Subscribe from the paywall
          to unlock all features.
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, styles.manageButton]}
        onPress={openManageSubscriptions}
      >
        <Text style={styles.buttonText}>Manage Subscription</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.restoreButton]}
        onPress={restorePurchases}
      >
        <Text style={styles.buttonText}>Restore Purchases</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  status: { fontSize: 16, marginBottom: 16 },
  label: { fontSize: 12, opacity: 0.7, marginTop: 8 },
  value: { fontSize: 14 },
  info: { marginTop: 16, fontSize: 14 },
  button: {
    marginTop: 18,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  manageButton: { backgroundColor: '#333' },
  restoreButton: { backgroundColor: '#555' },
  buttonText: { color: 'white', fontSize: 15, fontWeight: '500' },
});
```

---

## 5. How to wire all this into navigation

Example with React Navigation:

```tsx
// App.tsx (sketch)
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RevenueCatProvider } from './src/revenuecat/RevenueCatProvider';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { SubscriptionScreen } from './src/screens/SubscriptionScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => { initRevenueCat(null); }, []);

  return (
    <RevenueCatProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {/* your regular screens */}
          <Stack.Screen name="Paywall" component={PaywallScreen} />
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </RevenueCatProvider>
  );
}
```

* When user hits a locked feature → `navigation.navigate('Paywall')`.
* Profile / settings → link to `Subscription` screen.

---

If you paste this structure into your Expo app and plug in your **API keys** + `pro` entitlement id, you’ll have:

* Custom paywall (weekly/monthly/yearly pulled from RevenueCat offerings).
* Restore purchases.
* Display of current membership, renewal date, status.
* Link out to platform subscription management so users can upgrade/downgrade/cancel there.

If you want, next step I can help you **adapt the paywall UI** to match your app’s design (e.g. different copy/feature bullets, highlighting a specific plan, handling free trials differently).

[1]: https://www.revenuecat.com/blog/engineering/expo-in-app-purchase-tutorial/?utm_source=chatgpt.com "In-App Purchases with Expo React Native"
[2]: https://stackoverflow.com/questions/15530794/link-to-app-manage-subscriptions-in-app-store?utm_source=chatgpt.com "Link to app manage subscriptions in app store"
