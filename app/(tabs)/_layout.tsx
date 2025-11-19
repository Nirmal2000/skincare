import { TabBarIcon } from '@/components/TabBarIcon';
import { Colors, Spacing } from '@/constants/Tokens';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

import { useOnboardingComplete, useOnboardingStore } from '@/features/onboarding/stores/onboarding-store';
import * as Haptics from 'expo-haptics';
import { Redirect, Tabs } from 'expo-router';
import React,  { useRef } from 'react';
import { Platform, StyleSheet, Animated, Pressable, GestureResponderEvent } from 'react-native';
/**
 * Tabs Layout
 * Main app tabs with navigation protection
 * Redirects based on auth and onboarding status
 *
 * Tabs: Home, History, Track, Settings
 */

const AnimatedTabBarButton: React.FC<BottomTabBarButtonProps> = ({
  children,
  onPress,
  onPressIn,
  onPressOut,
  style,
  ...rest
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: GestureResponderEvent) => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 6,
      tension: 200,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 200,
    }).start();
    onPressOut?.(e);
  };

  const handlePress = (e: GestureResponderEvent) => {
    onPress?.(e);
  };

  return (
    <Animated.View style={[{ flex: 1, transform: [{ scale }] }, style]}>
      <Pressable
        {...rest}               // <— forward accessibility / etc
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};


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
          tabBarActiveTintColor: Colors.brandPrimary,
          tabBarInactiveTintColor: Colors.textTertiary,
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarShowLabel: true,
          tabBarHideOnKeyboard: true,
          tabBarButton: (props) => <AnimatedTabBarButton {...props} />, // 👈 add this
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
  backgroundColor: `${Colors.appBackground}`,
  borderTopWidth: 0,
  height: 64,
  elevation: 0,
  shadowColor: 'transparent',
},
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
});
