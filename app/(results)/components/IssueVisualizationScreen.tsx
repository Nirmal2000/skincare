import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/Tokens';
import { ScanRun } from '@/features/scans/stores/scan-store';
import {
  ISSUE_REGION_TO_LANDMARK,
  IssueCategory,
  IssueItem,
} from '@/types/api';

import { IssueChip } from './IssueChip';
import { IssueMarker } from './IssueMarker';

interface IssueVisualizationScreenProps {
  run: ScanRun;
}

interface MarkerPosition {
  x: number;
  y: number;
  region: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

// Human-readable labels for issue categories
const ISSUE_LABELS: Record<IssueCategory, string> = {
  oily_shine: 'Oily Shine',
  dryness_dehydration: 'Dryness',
  enlarged_pores_texture: 'Visible Pores',
  blackheads: 'Blackheads',
  acne_active: 'Active Acne',
  acne_scars_post_inflammatory: 'Acne Scars',
  pigmentation_brown_spots: 'Brown Spots',
  freckles: 'Freckles',
  melasma_like_patches: 'Melasma',
  redness_sensitivity: 'Redness',
  wrinkles_and_fine_lines: 'Wrinkles',
  eye_bags: 'Eye Bags',
  dark_circles: 'Dark Circles',
  moles_or_nevi: 'Moles',
};

export function IssueVisualizationScreen({ run }: IssueVisualizationScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | null>(null);
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });


  // Filter to only detected issues
  const detectedIssues = useMemo(() => {
    if (!run.result?.issues) return [];

    return (Object.entries(run.result.issues) as [IssueCategory, IssueItem[]][])
      .filter(([_, items]) => items.length > 0)
      .map(([category]) => category);
  }, [run.result?.issues]);

  // Calculate marker positions for selected issue
  const markerPositions = useMemo<MarkerPosition[]>(() => {
    if (!selectedCategory || !run.result?.issues || !run.landmarks || !imageLayout.width) {
      return [];
    }

    const issueItems = run.result.issues[selectedCategory];
    const landmarks = run.landmarks[0]; // First face

    if (!issueItems || !landmarks) {
      return [];
    }

    const positions: MarkerPosition[] = [];

    for (const issueItem of issueItems) {
      const region = issueItem.region;
      const landmarkKey = ISSUE_REGION_TO_LANDMARK[region as keyof typeof ISSUE_REGION_TO_LANDMARK];

      if (!landmarkKey) {
        console.warn(`[Issue Viz] No landmark mapping for region: ${region}`);
        continue;
      }

      const landmarkPosition = landmarks[landmarkKey];

      if (!landmarkPosition || typeof landmarkPosition.x !== 'number' || typeof landmarkPosition.y !== 'number') {
        console.warn(`[Issue Viz] No position data for landmark: ${landmarkKey}`);
        continue;
      }

      // For now, use coordinates as-is since they're in the same space as the image
      // In future, we may need to scale if camera preview size != photo size
      positions.push({
        x: landmarkPosition.x,
        y: landmarkPosition.y,
        region,
      });
    }

    console.log(`[Issue Viz] Generated ${positions.length} markers for ${selectedCategory}`);
    return positions;
  }, [selectedCategory, run.result?.issues, run.landmarks, imageLayout]);

  const handleChipPress = useCallback((category: IssueCategory) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
  }, []);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)');
  }, []);

  const handleImageLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setImageLayout({ width, height });
  }, []);

  const handleFullReportPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(results)/full-report/[runId]',
      params: { runId: run.id },
    });
  }, [run.id]);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View
        style={[
          styles.topBar,
          { paddingTop: Math.max(insets.top, Spacing.large) },
        ]}
      >
        <Pressable style={styles.fullReportButton} onPress={handleFullReportPress}>
          <Text style={styles.fullReportText}>Full Report</Text>
        </Pressable>
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color={Colors.white} />
        </Pressable>
      </View>

      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: run.photoUri }}
          style={styles.image}
          resizeMode="cover"
          onLayout={handleImageLayout}
        />

        {/* Markers */}
        {markerPositions.map((position, index) => (
          <IssueMarker
            key={`${position.region}-${index}`}
            x={position.x}
            y={position.y}
            index={index}
          />
        ))}

        {/* Bottom Fade Gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.7)', '#000000']}
          style={styles.bottomGradient}
          pointerEvents="none"
        />
      </View>

      {/* Issue Chips Section */}
      <View
        style={[
          styles.chipsContainer,
          { paddingBottom: Math.max(insets.bottom, Spacing.large) },
        ]}
      >
        {detectedIssues.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}
          >
            {detectedIssues.map((category) => (
              <IssueChip
                key={category}
                label={ISSUE_LABELS[category]}
                isSelected={selectedCategory === category}
                onPress={() => handleChipPress(category)}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noIssuesContainer}>
            <Text style={styles.noIssuesText}>No issues detected</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.large,
    paddingBottom: Spacing.default,
    backgroundColor: Colors.darkBackground,
  },
  fullReportButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.white,
    paddingHorizontal: Spacing.default,
    paddingVertical: Spacing.small,
  },
  fullReportText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.black,
    borderRadius: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  chipsContainer: {
    backgroundColor: Colors.darkBackground,
    paddingTop: 10,
  },
  chipsContent: {
    paddingHorizontal: Spacing.large,
  },
  noIssuesContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noIssuesText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
