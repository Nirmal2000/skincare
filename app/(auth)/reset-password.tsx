import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Colors, Spacing, Typography } from '@/constants/Tokens';
import {
  requestPasswordReset,
  verifyEmailOtp,
  setInitialPassword,
  getAuthErrorMessage,
} from '@/features/auth/email-auth';
import { router } from 'expo-router';
import { useState } from 'react';
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

type Step = 'email' | 'otp' | 'password';

export default function ResetPasswordScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      await requestPasswordReset(email.trim().toLowerCase());
      Alert.alert('Code Sent', 'Check your email for the verification code.');
      setStep('otp');
    } catch (error: any) {
      console.error('[Reset Password] Error sending OTP:', error);
      Alert.alert('Error', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      await verifyEmailOtp(email.trim().toLowerCase(), otp.trim());
      setStep('password');
    } catch (error: any) {
      console.error('[Reset Password] Error verifying OTP:', error);
      Alert.alert('Verification Failed', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Password Required', 'Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        'Password Too Short',
        'Password must be at least 6 characters long.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        'Passwords Don\'t Match',
        'Please make sure both passwords match.'
      );
      return;
    }

    try {
      setLoading(true);
      await setInitialPassword(newPassword);
      Alert.alert(
        'Password Reset',
        'Your password has been reset successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/signin'),
          },
        ]
      );
    } catch (error: any) {
      console.error('[Reset Password] Error resetting password:', error);
      Alert.alert('Error', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string) => {
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
          <Text style={styles.loadingText}>
            {step === 'email' && 'Sending code...'}
            {step === 'otp' && 'Verifying code...'}
            {step === 'password' && 'Resetting password...'}
          </Text>
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
            <Text style={styles.title}>
              {step === 'email' && 'Reset your password'}
              {step === 'otp' && 'Enter verification code'}
              {step === 'password' && 'Create new password'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'email' &&
                'Enter your email to receive a verification code'}
              {step === 'otp' && `We sent a code to ${email}`}
              {step === 'password' && 'Enter your new password'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {step === 'email' && (
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={Colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={!loading}
              />
            )}

            {step === 'otp' && (
              <TextInput
                style={styles.otpInput}
                placeholder="000000"
                placeholderTextColor={Colors.textTertiary}
                value={otp}
                onChangeText={handleOtpChange}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                autoFocus
              />
            )}

            {step === 'password' && (
              <>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="New password"
                    placeholderTextColor={Colors.textTertiary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password-new"
                    textContentType="newPassword"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeText}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm new password"
                    placeholderTextColor={Colors.textTertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password-new"
                    textContentType="newPassword"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.eyeText}>
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.requirements}>
                  <Text style={styles.requirementText}>
                    • At least 6 characters
                  </Text>
                  <Text
                    style={[
                      styles.requirementText,
                      newPassword === confirmPassword &&
                        newPassword.length > 0 &&
                        styles.requirementMet,
                    ]}
                  >
                    • Passwords match
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Action Button */}
          <View style={styles.buttonContainer}>
            {step === 'email' && (
              <Button
                title="Send Code"
                onPress={handleSendOtp}
                variant="primary"
                disabled={loading || !email.trim()}
              />
            )}
            {step === 'otp' && (
              <Button
                title="Verify Code"
                onPress={handleVerifyOtp}
                variant="primary"
                disabled={loading || otp.length !== 6}
              />
            )}
            {step === 'password' && (
              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                variant="primary"
                disabled={
                  loading ||
                  !newPassword.trim() ||
                  !confirmPassword.trim() ||
                  newPassword.length < 6
                }
              />
            )}
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
  form: {
    flex: 1,
    paddingTop: Spacing.xl,
    gap: Spacing.base,
  },
  input: {
    ...Typography.body,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  otpInput: {
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
  inputContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: Spacing.medium,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  eyeText: {
    fontSize: 20,
  },
  requirements: {
    gap: Spacing.xs,
    marginTop: Spacing.small,
    paddingHorizontal: Spacing.xs,
  },
  requirementText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  requirementMet: {
    color: Colors.success,
  },
  buttonContainer: {
    marginBottom: Spacing.large,
  },
});
