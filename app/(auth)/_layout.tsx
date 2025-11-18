import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useOnboardingComplete } from '@/features/onboarding/stores/onboarding-store';

/**
 * Auth Layout
 * Stack navigator for authentication flow
 * Redirects to tabs if authenticated and onboarded
 */
export default function AuthLayout() {
  const session = useAuthStore((state) => state.session);
  const authHydrated = useAuthStore((state) => state.hasHydrated);
  const onboardingComplete = useOnboardingComplete();

  console.log('[Auth Layout] Render:', {
    authHydrated,
    hasSession: !!session,
    userEmail: session?.user?.email,
    onboardingComplete
  });

  // Wait for hydration before redirecting
  if (!authHydrated) {
    console.log('[Auth Layout] Still hydrating, showing null');
    return null;
  }

  // // AUTH CHECK - Uncomment below to enable auth redirects:
  if (session && onboardingComplete) {
    console.log('[Auth Layout] Authenticated and onboarded, redirecting to tabs');
    return <Redirect href="/(tabs)" />;
  }

  // TEMPORARILY SKIP AUTH: Always show sign in, but clicking continues to onboarding
  console.log('[Auth Layout] Auth bypassed - showing auth stack');

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="signin" />
    </Stack>
  );
}
