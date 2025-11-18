import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { handleOAuthRedirect } from '@/features/auth/oauth';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useOnboardingComplete } from '@/features/onboarding/stores/onboarding-store';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const session = useAuthStore((state) => state.session);
  const onboardingComplete = useOnboardingComplete();
  const router = useRouter();
  const segments = useSegments();

  // Handle OAuth redirect from deep link
  useEffect(() => {
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      try {
        const handled = await handleOAuthRedirect(url);
        if (handled) {
          console.log('OAuth redirect handled successfully');
        }
      } catch (error) {
        console.error('Error handling OAuth redirect:', error);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Auth gate - route based on session and onboarding state
  useEffect(() => {
    // Wait until navigation is ready (segments populated)
    if (segments.length < 1 || !segments[0]) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    // Not authenticated → redirect to sign in
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/signin');
      return;
    }

    // Authenticated but onboarding not complete → redirect to onboarding
    if (session && !onboardingComplete && !inOnboardingGroup) {
      router.replace('/(onboarding)/welcome');
      return;
    }

    // Authenticated and onboarding complete → redirect to tabs
    if (session && onboardingComplete && !inTabsGroup) {
      router.replace('/(tabs)');
      return;
    }
  }, [session, onboardingComplete, segments, router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Slot />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
