import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useOnboardingComplete, useOnboardingStore } from '@/features/onboarding/stores/onboarding-store';

/**
 * Onboarding Layout
 * Stack navigator for onboarding flow
 * Redirects based on auth and onboarding status
 *
 * TESTING MODE: Onboarding completion check is currently DISABLED
 * To restore normal flow, uncomment the onboardingComplete check below
 */
export default function OnboardingLayout() {
  const session = useAuthStore((state) => state.session);
  const authHydrated = useAuthStore((state) => state.hasHydrated);
  const onboardingHydrated = useOnboardingStore((state) => state.hasHydrated);
  const onboardingComplete = useOnboardingComplete();

  // Wait for hydration before redirecting
  if (!authHydrated || !onboardingHydrated) return null;

  // AUTH CHECK - Must be authenticated to access onboarding
  if (!session) {
    return <Redirect href="/(auth)/signin" />;
  }

  // TESTING: Force onboarding to always show
  // Comment out these lines to restore normal behavior:
  // if (onboardingComplete) {
  //   return <Redirect href="/(tabs)" />;
  // }

  // Uncomment the lines above to enable normal onboarding completion check

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
