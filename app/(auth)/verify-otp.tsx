import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Colors, Spacing, Typography } from '@/constants/Tokens';
import {
  sendEmailOtp,
  verifyEmailOtp,
  getAuthErrorMessage,
} from '@/features/auth/email-auth';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email address is missing. Please go back and try again.');
      return;
    }

    try {
      setLoading(true);
      const session = await verifyEmailOtp(email, otp.trim());

      if (session) {
        // Check if user already has a password set
        // If user_metadata doesn't have a password flag, assume they need to set one
        // Navigate to set password screen for new users
        router.replace({
          pathname: '/(auth)/set-password',
          params: { email },
        });
      }
    } catch (error: any) {
      console.error('[Verify OTP] Error verifying OTP:', error);
      Alert.alert('Verification Failed', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || !email) return;

    try {
      setCanResend(false);
      setResendCooldown(60);
      await sendEmailOtp(email);
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error: any) {
      console.error('[Verify OTP] Error resending OTP:', error);
      Alert.alert('Error', getAuthErrorMessage(error));
      // Reset cooldown on error so user can try again
      setCanResend(true);
      setResendCooldown(0);
    }
  };

  const handleOtpChange = (text: string) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 6) {
      setOtp(numericText);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
          <Text style={styles.loadingText}>Verifying code...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor={Colors.textTertiary}
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
              autoFocus
            />

            {/* Resend Link */}
            <View style={styles.resendContainer}>
              {canResend ? (
                <TouchableOpacity onPress={handleResendOtp}>
                  <Text style={styles.resendLink}>Resend code</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendDisabled}>
                  Resend code in {resendCooldown}s
                </Text>
              )}
            </View>
          </View>

          {/* Verify Button */}
          <View style={styles.buttonContainer}>
            <Button
              title="Verify Code"
              onPress={handleVerify}
              variant="primary"
              disabled={loading || otp.length !== 6}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.large,
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
  header: {
    gap: Spacing.small,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.small,
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.primary,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.small,
  },
  emailText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    paddingTop: Spacing.xl,
    gap: Spacing.medium,
  },
  input: {
    ...Typography.h3,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
    letterSpacing: 8,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: Spacing.small,
  },
  resendLink: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  resendDisabled: {
    ...Typography.body,
    color: Colors.textTertiary,
  },
  buttonContainer: {
    marginBottom: Spacing.large,
  },
});
