import {
  FaceDetectionProvider,
  RNMLKitFaceDetectorOptions,
} from '@infinitered/react-native-mlkit-face-detection';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { handleOAuthRedirect } from '@/features/auth/oauth';
import { useColorScheme } from '@/hooks/use-color-scheme';

const FACE_OPTIONS: RNMLKitFaceDetectorOptions = {
  performanceMode: 'accurate',
  landmarkMode: true,
  contourMode: true, 
  classificationMode: false,
  minFaceSize: 0.01, 
  isTrackingEnabled: false,
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();


  // Handle OAuth redirect from deep link
  useEffect(() => {
    console.log('[Root Layout] Setting up deep link listener');

    const subscription = Linking.addEventListener('url', async ({ url }) => {
      console.log('[Root Layout] DEEP LINK RECEIVED:', url);
      try {
        const handled = await handleOAuthRedirect(url);
        if (handled) {
          console.log('[Root Layout] OAuth redirect handled successfully');
        } else {
          console.log('[Root Layout] Deep link was not an OAuth redirect');
        }
      } catch (error) {
        console.error('[Root Layout] Error handling OAuth redirect:', error);
      }
    });

    return () => {
      console.log('[Root Layout] Deep link listener cleaned up');
      subscription.remove();
    };
  }, []);



  return (
    <FaceDetectionProvider options={FACE_OPTIONS}>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Slot />
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </FaceDetectionProvider>
  );
}
