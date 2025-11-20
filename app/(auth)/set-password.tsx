import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Colors, Spacing, Typography } from '@/constants/Tokens';
import { setInitialPassword, getAuthErrorMessage } from '@/features/auth/email-auth';
import { router, useLocalSearchParams } from 'expo-router';
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

export default function SetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = () => {
    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter a password.');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters long.');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords Don\'t Match', 'Please make sure both passwords match.');
      return false;
    }

    return true;
  };

  const handleCreateAccount = async () => {
    if (!validatePassword()) return;

    try {
      setLoading(true);
      await setInitialPassword(password);

      // Password set successfully, navigate to onboarding
      // The auth state listener will handle the redirect
      router.replace('/(onboarding)/welcome');
    } catch (error: any) {
      console.error('[Set Password] Error setting password:', error);
      Alert.alert('Error', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
          <Text style={styles.loadingText}>Creating your account...</Text>
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
            <Text style={styles.title}>Create your password</Text>
            <Text style={styles.subtitle}>
              Set a password to secure your account{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
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
                <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
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

            {/* Password Requirements */}
            <View style={styles.requirements}>
              <Text style={styles.requirementText}>
                • At least 6 characters
              </Text>
              <Text
                style={[
                  styles.requirementText,
                  password === confirmPassword &&
                    password.length > 0 &&
                    styles.requirementMet,
                ]}
              >
                • Passwords match
              </Text>
            </View>
          </View>

          {/* Create Account Button */}
          <View style={styles.buttonContainer}>
            <Button
              title="Create Account"
              onPress={handleCreateAccount}
              variant="primary"
              disabled={
                loading ||
                !password.trim() ||
                !confirmPassword.trim() ||
                password.length < 6
              }
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
    gap: Spacing.base,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    ...Typography.body,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    paddingRight: 50, // Make room for eye icon
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
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
