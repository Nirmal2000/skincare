import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Colors, Layout, Spacing, Typography } from '@/constants/Tokens';
import { useScanStore } from '@/features/scans/stores/scan-store';
import LatestScanSummary from '@/features/results/LatestScanSummary';
const LogoImage = require('@/assets/images/bfflogo.png');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const latestScan = useScanStore((state) => state.getLatestCompletedScan());

  const handleScanPress = () => {
    router.push('/scan');
  };

  // Show centered logo when no scan data exists
  if (!latestScan) {
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

        {/* Centered Logo Button */}
        <View style={styles.centeredContent}>
          <TouchableOpacity style={styles.scanButtonTouchable} onPress={handleScanPress}>
            <View style={styles.scanButton}>
              <Text style={styles.scanButtonText}>BETTERSKIN</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.tagline}>Scan, Understand, React</Text>
        </View>
      </View>
    );
  }

  // Show normal layout with scan summary when data exists
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

  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -80,
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
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  },
  scanButtonText: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scanLogo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  tagline: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    marginTop: Spacing.base,
    textAlign: 'center',
  },
});
