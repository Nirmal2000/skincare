import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Colors, Layout, Spacing, Typography } from '@/constants/Tokens';
import { useAuthStore, useCurrentUser } from '@/features/auth/stores/auth-store';
import { useOnboardingStore } from '@/features/onboarding/stores/onboarding-store';
import { useScanStore } from '@/features/scans/stores/scan-store';
import { useTrackingStore } from '@/features/tracking/stores/tracking-store';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useCurrentUser();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const resetOnboarding = useOnboardingStore((state) => state.reset);
  const clearAllScans = useScanStore((state) => state.clearAll);
  const clearAllTracking = useTrackingStore((state) => state.clearAll);
  const { isPro, isLoadingCustomerInfo } = useSubscription();

  const [isSigningOut, setIsSigningOut] = useState(false);

  // Get user display info
  const fullName = session?.user?.user_metadata?.full_name || 'User';
  const email = session?.user?.email || '';
  const avatarUrl = session?.user?.user_metadata?.avatar_url;
  const provider = session?.user?.user_metadata?.provider;

  // Get initials for fallback avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleResetPreferences = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Reset Preferences',
      'This will clear your onboarding preferences and you will need to complete the questionnaire again. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetOnboarding();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Your preferences have been reset.');
          },
        },
      ]
    );
  }, [resetOnboarding]);

  const handleDeleteAccount = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all local data
              clearAllScans();
              clearAllTracking();
              resetOnboarding();

              // Sign out (in production, this would also call API to delete account)
              await signOut();

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Delete account error:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  }, [signOut, clearAllScans, clearAllTracking, resetOnboarding]);

  const handleManageMembership = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(subscription)/manage');
  }, [router]);

  const handleUpgradeToPro = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(subscription)/paywall');
  }, [router]);

  const handleRemoveAllRuns = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Remove All Scans',
      'This will delete all your saved skin scans. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            clearAllScans();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'All scans have been removed.');
          },
        },
      ]
    );
  }, [clearAllScans]);

  const handleSignOut = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsSigningOut(true);
            await signOut();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  }, [signOut]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
        <View style={{ paddingTop: 12 }} />
      </SafeAreaView>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, Spacing.large) },
        ]}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.header}>Settings</Text>

        {/* Profile Card */}
        <Card variant="standard" style={styles.profileCard}>
          <View style={styles.profileContent}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{getInitials(fullName)}</Text>
                </View>
              )}
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{fullName}</Text>
              <Text style={styles.userEmail}>{email}</Text>
              {provider && (
                <View style={styles.providerBadge}>
                  <Ionicons
                    name={provider === 'google' ? 'logo-google' : 'logo-apple'}
                    size={12}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.providerText}>
                    {provider === 'google' ? 'Google' : 'Apple'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Data & Privacy Section */}
        <Text style={styles.sectionHeader}>Data & Privacy</Text>

        <Pressable onPress={handleResetPreferences}>
          <Card variant="listItem">
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="refresh-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.settingTitle}>Reset Preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
            </View>
          </Card>
        </Pressable>

        <Pressable onPress={handleRemoveAllRuns}>
          <Card variant="listItem">
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="trash-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.settingTitle}>Remove All Saved Scans</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
            </View>
          </Card>
        </Pressable>

        {/* Membership Section */}
        <Text style={styles.sectionHeader}>Membership</Text>

        {/* Show subscription status badge */}
        {!isLoadingCustomerInfo && (
          <View style={styles.membershipBadge}>
            <View style={[styles.statusDot, isPro && styles.statusDotPro]} />
            <Text style={styles.membershipStatus}>
              {isPro ? 'Pro Member' : 'Free Plan'}
            </Text>
          </View>
        )}

        {/* Show Upgrade button for free users, Manage for Pro users */}
        {!isPro ? (
          <Pressable onPress={handleUpgradeToPro}>
            <Card variant="listItem" style={styles.upgradeCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="star-outline" size={20} color={Colors.brandPrimary} />
                  <View style={styles.upgradeTextContainer}>
                    <Text style={[styles.settingTitle, styles.upgradeTitle]}>
                      Upgrade to Pro
                    </Text>
                    <Text style={styles.upgradeSubtitle}>
                      Unlock all premium features
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.brandPrimary} />
              </View>
            </Card>
          </Pressable>
        ) : null}

        <Pressable onPress={handleManageMembership}>
          <Card variant="listItem">
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="card-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.settingTitle}>Manage Membership</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
            </View>
          </Card>
        </Pressable>

        {/* Account Section */}
        <Text style={styles.sectionHeader}>Account</Text>

        <Pressable onPress={handleDeleteAccount}>
          <Card variant="listItem">
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
                <Text style={[styles.settingTitle, styles.destructiveText]}>
                  Delete Account
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
            </View>
          </Card>
        </Pressable>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="secondary"
            loading={isSigningOut}
            disabled={isSigningOut}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
  safeAreaTop: {
    backgroundColor: Colors.appBackground,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Layout.screenMarginHorizontal,
  },
  header: {
    ...Typography.h1,
    marginBottom: Spacing.large,
  },
  profileCard: {
    marginBottom: Spacing.xl,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: Spacing.default,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.brandSecondary,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.brandSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.h2,
    fontSize: 20,
    marginBottom: 4,
  },
  userEmail: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.appBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  providerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  sectionHeader: {
    ...Typography.caption,
    textTransform: 'uppercase',
    color: Colors.textTertiary,
    marginBottom: Spacing.small,
    marginTop: Spacing.default,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    ...Typography.bodyLarge,
    marginLeft: Spacing.default,
    color: Colors.textPrimary,
  },
  destructiveText: {
    color: '#FF3B30',
  },
  signOutContainer: {
    marginTop: Spacing.xl,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.tiny,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textTertiary,
    marginRight: Spacing.small,
  },
  statusDotPro: {
    backgroundColor: Colors.successGreen,
  },
  membershipStatus: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  upgradeCard: {
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    backgroundColor: 'rgba(77, 124, 255, 0.05)',
  },
  upgradeTextContainer: {
    marginLeft: Spacing.default,
    flex: 1,
  },
  upgradeTitle: {
    color: Colors.brandPrimary,
    marginLeft: 0,
  },
  upgradeSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
