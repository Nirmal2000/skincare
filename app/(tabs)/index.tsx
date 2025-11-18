import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { Colors, Spacing, Typography, Layout } from '@/constants/Tokens';
import { useAuthStore } from '@/features/auth/stores/auth-store';

export default function HomeScreen() {
  const session = useAuthStore((state) => state.session);

  const handleScanPress = () => {
    router.push('/(tabs)/scan');
  };

  // TODO: Phase 5 - Add scan store integration:
  // - Get recent scans from useScanStore
  // - Display last scan summary
  // - Add formatDate, getStatusColor, getStatusLabel helpers

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Welcome back{session?.user?.user_metadata?.full_name ? `, ${session.user.user_metadata.full_name.split(' ')[0]}` : ''}
        </Text>
        <Text style={styles.subtitle}>
          Your skincare journey starts here
        </Text>
      </View>

      {/* Hero Scan CTA */}
      <View style={styles.heroSection}>
        <View style={styles.scanIconContainer}>
          <Ionicons name="camera" size={48} color={Colors.brandPink} />
        </View>
        <Text style={styles.heroTitle}>Ready for your skin scan?</Text>
        <Text style={styles.heroDescription}>
          Get personalized insights about your skin in seconds
        </Text>
        <Button
          title="Start Scan"
          onPress={handleScanPress}
          variant="primary"
          style={styles.scanButton}
        />
      </View>

      {/* TODO: Phase 5 - Last Scan Summary section will be added here */}

      {/* Empty state (no scans yet) */}
      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={64} color={Colors.textTertiary} />
        <Text style={styles.emptyStateTitle}>No scans yet</Text>
        <Text style={styles.emptyStateDescription}>
          Start your first scan to begin tracking your skin health
        </Text>
      </View>

      {/* Quick Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Tips for best results</Text>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <Ionicons name="sunny-outline" size={20} color={Colors.brandPink} />
            <Text style={styles.tipText}>Scan in natural lighting</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="water-outline" size={20} color={Colors.brandPink} />
            <Text style={styles.tipText}>Clean face before scanning</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="camera-outline" size={20} color={Colors.brandPink} />
            <Text style={styles.tipText}>Center your face in the frame</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundBlush,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenMarginHorizontal,
    paddingTop: Spacing.large,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.tiny,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
  },
  heroSection: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    marginBottom: Spacing.large,
  },
  scanIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.backgroundBlush,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.medium,
  },
  heroTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
    textAlign: 'center',
  },
  heroDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.large,
    textAlign: 'center',
  },
  scanButton: {
    width: '100%',
  },
  // TODO: Phase 5 - Add lastScanSection styles when scan store is implemented
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyStateTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
  },
  emptyStateDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  tipsSection: {
    marginTop: Spacing.large,
  },
  tipsList: {
    marginTop: Spacing.default,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  tipText: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginLeft: Spacing.default,
  },
});
