import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, Typography, Layout } from '@/constants/Tokens';

/**
 * Track Screen
 * Placeholder for future longitudinal insights feature
 */
export default function TrackScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="analytics" size={64} color={Colors.textTertiary} />
        </View>
        <Text style={styles.title}>Track Your Progress</Text>
        <Text style={styles.description}>
          Longitudinal skin insights and tracking features coming soon
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundBlush,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.screenMarginHorizontal,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    marginBottom: Spacing.large,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.default,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
