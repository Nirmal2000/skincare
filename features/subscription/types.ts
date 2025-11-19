import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';

export interface SubscriptionContextValue {
  // Offerings data
  offerings: PurchasesOfferings | null;
  isLoadingOfferings: boolean;

  // Customer info
  customerInfo: CustomerInfo | null;
  isLoadingCustomerInfo: boolean;

  // Subscription status
  isPro: boolean;

  // Actions
  purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo | null>;
  restorePurchases: () => Promise<CustomerInfo | null>;
  refreshCustomerInfo: () => Promise<void>;
}

export interface PaywallGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  featureName?: string;
}
