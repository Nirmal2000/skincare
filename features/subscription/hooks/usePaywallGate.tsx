import React from 'react';
import { useRouter } from 'expo-router';
import { useSubscription } from './useSubscription';
import type { PaywallGateProps } from '../types';

/**
 * Hook to check if a feature is gated and navigate to paywall
 * @param featureName - Name of the feature being gated (for analytics)
 * @returns Object with isPro status and showPaywall function
 */
export const usePaywallGate = (featureName?: string) => {
  const { isPro } = useSubscription();
  const router = useRouter();

  const showPaywall = () => {
    console.log(`Feature gate triggered: ${featureName || 'unknown'}`);
    router.push('/(subscription)/paywall');
  };

  return {
    isPro,
    showPaywall,
    isGated: !isPro,
  };
};

/**
 * Component that gates content behind Pro subscription
 * Shows fallback or redirects to paywall if user is not Pro
 *
 * @example
 * <PaywallGate featureName="advanced-analytics">
 *   <AdvancedAnalytics />
 * </PaywallGate>
 */
export const PaywallGate: React.FC<PaywallGateProps> = ({
  children,
  fallback,
  featureName,
}) => {
  const { isPro, showPaywall } = usePaywallGate(featureName);

  if (isPro) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Auto-redirect to paywall if no fallback provided
  React.useEffect(() => {
    showPaywall();
  }, []);

  return null;
};
