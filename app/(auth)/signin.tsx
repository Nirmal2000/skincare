import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Colors, Spacing, Typography } from '@/constants/Tokens';
import { signInWithApple, signInWithGoogle } from '@/features/auth/oauth';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    console.log('[SignIn Screen] Google sign-in button pressed');
    try {
      console.log('[SignIn Screen] Setting loading state to true');
      setLoading(true);
      console.log('[SignIn Screen] Calling signInWithGoogle()');
      await signInWithGoogle();
    } catch (error) {
      Alert.alert(
        'Sign In Failed',
        'Could not sign in with Google. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('[SignIn Screen] Google sign in error:', error);
    } finally {
      console.log('[SignIn Screen] Setting loading state to false');
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithApple();
    } catch (error) {
      Alert.alert(
        'Sign In Failed',
        'Could not sign in with Apple. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('Apple sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
          <Text style={styles.loadingText}>Signing you in...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.title}>Welcome to BETTERSKIN</Text>
          <Text style={styles.subtitle}>
            Personalized skincare analysis powered by AI
          </Text>
        </View>

        {/* Auth Buttons */}
        <View style={styles.authButtons}>
          <Button
            title="Continue with Email"
            onPress={() => router.push('/(auth)/email-signin')}
            variant="primary"
            disabled={loading}
          />
          <Button
            title="Continue with Google"
            onPress={handleGoogleSignIn}
            variant="secondary"
            disabled={loading}
            style={styles.blackButton}
            textStyle={styles.whiteText}
          />
          <Button
            title="Continue with Apple"
            onPress={handleAppleSignIn}
            variant="secondary"
            disabled={loading}
            style={styles.blackButton}
            textStyle={styles.whiteText}
          />
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          By continuing, you agree to our{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('https://www.thebetterskin.online/terms')}
          >
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('https://www.thebetterskin.online/privacy')}
          >
            Privacy Policy
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.xxl,
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.medium,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.base,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.small,
  },
  authButtons: {
    gap: Spacing.base,
  },
  blackButton: {
    backgroundColor: '#000000',
  },
  whiteText: {
    color: '#FFFFFF',
  },
  footer: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.large,
  },
  link: {
    color: Colors.brandPrimary,
    textDecorationLine: 'underline',
  },
});
