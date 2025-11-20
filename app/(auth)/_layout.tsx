import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useOnboardingComplete, useOnboardingStore } from '@/features/onboarding/stores/onboarding-store';

/**
 * Auth Layout
 * Stack navigator for authentication flow
 * Redirects to tabs if authenticated and onboarded
 *
 * TESTING MODE: Hero redirect is currently DISABLED
 * To restore normal flow, uncomment the hasSeenHero check below
 */
export default function AuthLayout() {
  const session = useAuthStore((state) => state.session);
  const authHydrated = useAuthStore((state) => state.hasHydrated);
  const onboardingHydrated = useOnboardingStore((state) => state.hasHydrated);
  const hasSeenHero = useOnboardingStore((state) => state.hasSeenHero);
  const onboardingComplete = useOnboardingComplete();

  console.log('[Auth Layout] Render:', {
    authHydrated,
    onboardingHydrated,
    hasSession: !!session,
    userEmail: session?.user?.email,
    hasSeenHero,
    onboardingComplete
  });

  // Wait for hydration before redirecting
  if (!authHydrated || !onboardingHydrated) {
    console.log('[Auth Layout] Still hydrating, showing null');
    return null;
  }

  // TESTING: Disabled hero redirect for easier testing
  // Uncomment these lines to restore normal behavior:
  // if (!hasSeenHero) {
  //   console.log('[Auth Layout] Hero not seen, redirecting to hero');
  //   return <Redirect href="/hero" />;
  // }

  // If authenticated but onboarding not complete, redirect to onboarding
  if (session && !onboardingComplete) {
    console.log('[Auth Layout] Authenticated but not onboarded, redirecting to onboarding');
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // If authenticated and onboarded, redirect to tabs
  if (session && onboardingComplete) {
    console.log('[Auth Layout] Authenticated and onboarded, redirecting to tabs');
    return <Redirect href="/(tabs)" />;
  }

  // Not authenticated, show auth stack
  console.log('[Auth Layout] Not authenticated - showing auth stack');

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="signin" />
      <Stack.Screen name="email-entry" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="set-password" />
      <Stack.Screen name="email-signin" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
