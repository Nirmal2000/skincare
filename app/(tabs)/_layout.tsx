import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import * as Haptics from 'expo-haptics';

import { TabBarIcon } from '@/components/TabBarIcon';
import { Colors, Spacing } from '@/constants/Tokens';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useOnboardingComplete, useOnboardingStore } from '@/features/onboarding/stores/onboarding-store';
import { StyleSheet, Platform } from 'react-native';

/**
 * Tabs Layout
 * Main app tabs with navigation protection
 * Redirects based on auth and onboarding status
 *
 * Tabs: Home, History, Track, Settings
 */
export default function TabLayout() {
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

  // Auth check
  if (!session) {
    console.log('[Tabs Layout] Not authenticated, redirecting to auth');
    return <Redirect href="/(auth)/signin" />;
  }

  // If onboarding not completed, redirect to onboarding
  if (!onboardingComplete) {
    console.log('[Tabs Layout] Onboarding not completed, redirecting to onboarding');
    return <Redirect href="/(onboarding)/welcome" />;
  }

  console.log('[Tabs Layout] Showing tabs (authenticated and onboarded)');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.brandPink,
        tabBarInactiveTintColor: Colors.textTertiary,
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
      }}
      screenListeners={{
        tabPress: () => {
          // Haptic feedback on tab press (iOS standard)
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="home-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="time-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="analytics-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="settings-outline" focused={focused} />
          ),
        }}
      />
      {/* Hidden tabs for scan and other screens */}
      <Tabs.Screen
        name="scan"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide from tab bar (leftover from template)
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lavender,
    height: Platform.select({
      ios: 88, // Account for safe area on iOS (standard iOS tab bar height with home indicator)
      android: 70,
    }),
    paddingBottom: Platform.select({
      ios: Spacing.large, // Extra padding for iOS home indicator
      android: Spacing.small,
    }),
    paddingTop: Spacing.small,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});
