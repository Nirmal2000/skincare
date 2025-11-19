import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Layout, Spacing, Typography } from '@/constants/Tokens';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import LatestScanSummary from '@/features/results/LatestScanSummary';
const LogoImage = require('@/assets/images/logoda.png');

export default function HomeScreen() {
  const session = useAuthStore((state) => state.session);
  const insets = useSafeAreaInsets();

  const handleScanPress = () => {
    router.push('/scan');
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={[styles.header, { paddingTop: 12 }]}>
          <Text style={styles.greeting}>
            Good day!
          </Text>
          <Text style={styles.subtitle}>
            Your skincare journey starts here
          </Text>
        </View>
      </SafeAreaView>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Layout.screenMarginHorizontal,
          paddingBottom: Math.max(insets.bottom, Spacing.xxl),
        }}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        {/* Latest Scan Summary Card */}
        <LatestScanSummary />

        {/* Scan Button */}
        <View style={[styles.scanButtonContainer, styles.scanButtonWithScans]}>
          <TouchableOpacity style={styles.scanButtonTouchable} onPress={handleScanPress}>
            <View style={styles.scanButton}>
              <Image source={LogoImage} style={styles.scanLogo} />
            </View>
          </TouchableOpacity>
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

  headerArea: {
    backgroundColor: Colors.appBackground,
    paddingHorizontal: Layout.screenMarginHorizontal,
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

  scanButtonContainer: {
    paddingHorizontal: Layout.screenMarginHorizontal,
    marginBottom: Spacing.xl,
  },
  scanButtonWithScans: {
    alignItems: 'flex-start',
  },
  scanButtonTouchable: {
    alignItems: 'center',
  },
  scanButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  },
  scanLogo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
});
