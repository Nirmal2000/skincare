import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useOnboardingComplete, useOnboardingStore } from '@/features/onboarding/stores/onboarding-store';

/**
 * Onboarding Layout
 * Stack navigator for onboarding flow
 * Redirects based on auth and onboarding status
 */
export default function OnboardingLayout() {
  const session = useAuthStore((state) => state.session);
  const authHydrated = useAuthStore((state) => state.hasHydrated);
  const onboardingHydrated = useOnboardingStore((state) => state.hasHydrated);
  const onboardingComplete = useOnboardingComplete();

  // Wait for hydration before redirecting
  if (!authHydrated || !onboardingHydrated) return null;

  // // AUTH CHECK - Uncomment to enable auth redirect:
  if (!session) {
    return <Redirect href="/(auth)/signin" />;
  }

  // TEMPORARILY SKIP AUTH: Allow access even without auth
  // Keep onboarding completion redirect
  if (onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

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
