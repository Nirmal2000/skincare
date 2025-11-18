import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useOnboardingComplete, useOnboardingStore } from '@/features/onboarding/stores/onboarding-store';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Tabs Layout
 * Main app tabs with navigation protection
 * Redirects based on auth and onboarding status
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();

  const session = useAuthStore((state) => state.session);
  const authHydrated = useAuthStore((state) => state.hasHydrated);
  const onboardingHydrated = useOnboardingStore((state) => state.hasHydrated);
  const onboardingComplete = useOnboardingComplete();

  console.log('[Tabs Layout] Render:', {
    authHydrated,
    onboardingHydrated,
    hasSession: !!session,
    userEmail: session?.user?.email,
    onboardingComplete
  });

  // Wait for hydration before redirecting
  if (!authHydrated || !onboardingHydrated) {
    console.log('[Tabs Layout] Still hydrating, showing null');
    return null;
  }

  // // AUTH CHECK - Uncomment to enable auth redirect:
  if (!session) {
    console.log('[Tabs Layout] Not authenticated, redirecting to auth');
    return <Redirect href="/(auth)/signin" />;
  }

  // TEMPORARILY SKIP AUTH: Allow access even without auth

  // If onboarding not completed, redirect to onboarding
  if (!onboardingComplete) {
    console.log('[Tabs Layout] Onboarding not completed, redirecting to onboarding');
    return <Redirect href="/(onboarding)/welcome" />;
  }

  console.log('[Tabs Layout] Showing tabs (authenticated and onboarded)');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
