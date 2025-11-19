import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  PurchasesOfferings,
} from 'react-native-purchases';
import { PRO_ENTITLEMENT_ID } from '../config/revenuecat-config';
import type { SubscriptionContextValue } from '../types';

const RevenueCatContext = createContext<SubscriptionContextValue | undefined>(undefined);

interface RevenueCatProviderProps {
  children: ReactNode;
}

export const RevenueCatProvider: React.FC<RevenueCatProviderProps> = ({ children }) => {
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoadingCustomerInfo, setIsLoadingCustomerInfo] = useState(true);

  /**
   * Load available offerings from RevenueCat
   */
  const loadOfferings = async () => {
    try {
      setIsLoadingOfferings(true);
      const result = await Purchases.getOfferings();
      setOfferings(result);
      console.log('Offerings loaded:', result.current?.availablePackages.length || 0, 'packages');
    } catch (error) {
      console.warn('Error fetching offerings:', error);
      setOfferings(null);
    } finally {
      setIsLoadingOfferings(false);
    }
  };

  /**
   * Refresh customer info from RevenueCat
   */
  const refreshCustomerInfo = async () => {
    try {
      setIsLoadingCustomerInfo(true);
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      console.log('Customer info refreshed, isPro:', !!info.entitlements.active[PRO_ENTITLEMENT_ID]);
    } catch (error) {
      console.warn('Error fetching customer info:', error);
    } finally {
      setIsLoadingCustomerInfo(false);
    }
  };

  /**
   * Initialize offerings and customer info on mount
   * Subscribe to customer info updates
   */
  useEffect(() => {
    loadOfferings();
    refreshCustomerInfo();

    // Subscribe to customer info changes (e.g., purchases on another device)
    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      console.log('Customer info updated via listener');
      setCustomerInfo(info);
    });

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  /**
   * Purchase a package
   */
  const purchasePackage = async (pkg: PurchasesPackage): Promise<CustomerInfo | null> => {
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(info);
      console.log('Purchase successful:', pkg.identifier);
      return info;
    } catch (error: any) {
      if (!error?.userCancelled) {
        console.error('Purchase failed:', error);
      } else {
        console.log('Purchase cancelled by user');
      }
      return null;
    }
  };

  /**
   * Restore previous purchases
   */
  const restorePurchases = async (): Promise<CustomerInfo | null> => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      console.log('Purchases restored');
      return info;
    } catch (error) {
      console.error('Restore failed:', error);
      return null;
    }
  };

  /**
   * Check if user has active Pro entitlement
   */
  const isPro =
    !!customerInfo?.entitlements?.active &&
    Object.prototype.hasOwnProperty.call(customerInfo.entitlements.active, PRO_ENTITLEMENT_ID);

  const value: SubscriptionContextValue = {
    offerings,
    isLoadingOfferings,
    customerInfo,
    isLoadingCustomerInfo,
    isPro,
    purchasePackage,
    restorePurchases,
    refreshCustomerInfo,
  };

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
};

/**
 * Hook to access RevenueCat context
 * @throws Error if used outside RevenueCatProvider
 */
export const useRevenueCat = (): SubscriptionContextValue => {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCat must be used within RevenueCatProvider');
  }
  return context;
};
