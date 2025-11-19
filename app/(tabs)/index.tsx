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
              <Svg width="125" height="125" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9,3A1,1,0,0,1,8,4H5A1,1,0,0,0,4,5V8A1,1,0,0,1,2,8V5A3,3,0,0,1,5,2H8A1,1,0,0,1,9,3ZM2,19a3,3,0,0,0,3,3H8a1,1,0,0,0,0-2H5a1,1,0,0,1-1-1V16a1,1,0,0,0-2,0Zm19-4a1,1,0,0,0-1,1v3a1,1,0,0,1-1,1H16a1,1,0,0,0,0,2h3a3,3,0,0,0,3-3V16A1,1,0,0,0,21,15ZM19,2H16a1,1,0,0,0,0,2h3a1,1,0,0,1,1,1V8a1,1,0,0,0,2,0V5A3,3,0,0,0,19,2ZM8,9V8A1,1,0,0,0,6,8V9A1,1,0,0,0,8,9ZM18,9V8a1,1,0,0,0-2,0V9a1,1,0,0,0,2,0ZM8.775,14.368a1,1,0,0,0-1.55,1.264,6,6,0,0,0,9.55,0,1,1,0,1,0-1.55-1.264,4,4,0,0,1-6.45,0ZM11,7a1,1,0,0,0-1,1v3.01A3,3,0,0,0,13,14a1,1,0,0,0-.01-2,.991.991,0,0,1-.99-.99V8A1,1,0,0,0,11,7Z"
                  fill={Colors.textPrimary}
                />
              </Svg>
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
    marginTop: -110,
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
