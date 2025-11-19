import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

import { Button } from '@/components/Button';
import { Colors, Spacing, Typography } from '@/constants/Tokens';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useOnboardingStore } from '@/features/onboarding/stores/onboarding-store';
import { generateRoutine, pollTaskStatus } from '@/features/scans/face-analysis-api';
import { ScanRun, useScanStore } from '@/features/scans/stores/scan-store';
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
  intensity: number;
  description: string;
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
  const [isGeneratingRoutine, setIsGeneratingRoutine] = useState(false);
  const [routineError, setRoutineError] = useState<string | null>(null);
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);

  // Store access
  const session = useAuthStore((state) => state.session);
  const getIntake = useOnboardingStore((state) => state.getIntake);
  const updateRun = useScanStore((state) => state.updateRun);


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

    // Need dimensions for coordinate transformation
    if (!run.previewDimensions || !run.photoDimensions) {
      console.warn('[Issue Viz] Missing dimension data for coordinate transformation');
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

      // Transform coordinates: preview space → photo space → display space
      // Step 1: Scale from preview to photo coordinates
      const scaleX = run.photoDimensions.width / run.previewDimensions.width;
      const scaleY = run.photoDimensions.height / run.previewDimensions.height;

      const photoX = landmarkPosition.x * scaleX;
      const photoY = landmarkPosition.y * scaleY;

      // Step 2: Calculate how photo is displayed with resizeMode="cover"
      // Cover maintains aspect ratio and fills the view, cropping if necessary
      const photoAspect = run.photoDimensions.width / run.photoDimensions.height;
      const displayAspect = imageLayout.width / imageLayout.height;

      let displayScale: number;
      let offsetX = 0;
      let offsetY = 0;

      if (photoAspect > displayAspect) {
        // Photo is wider - will be cropped horizontally
        displayScale = imageLayout.height / run.photoDimensions.height;
        const scaledPhotoWidth = run.photoDimensions.width * displayScale;
        offsetX = (imageLayout.width - scaledPhotoWidth) / 2;
      } else {
        // Photo is taller - will be cropped vertically
        displayScale = imageLayout.width / run.photoDimensions.width;
        const scaledPhotoHeight = run.photoDimensions.height * displayScale;
        offsetY = (imageLayout.height - scaledPhotoHeight) / 2;
      }

      // Step 3: Transform to display coordinates
      const displayX = photoX * displayScale + offsetX;
      const displayY = photoY * displayScale + offsetY;

      positions.push({
        x: displayX,
        y: displayY,
        region,
        intensity: issueItem.intensity,
        description: issueItem.description,
      });
    }

    console.log(`[Issue Viz] Generated ${positions.length} markers for ${selectedCategory}`);
    console.log('[Issue Viz] Transformation:', {
      preview: run.previewDimensions,
      photo: run.photoDimensions,
      display: imageLayout,
      sample: positions[0]
    });
    return positions;
  }, [selectedCategory, run.result?.issues, run.landmarks, run.previewDimensions, run.photoDimensions, imageLayout]);

  const handleChipPress = useCallback((category: IssueCategory) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
    setSelectedMarkerIndex(null); // Close any open tooltip when changing category
  }, []);

  const handleMarkerPress = useCallback((index: number) => {
    setSelectedMarkerIndex((prev) => (prev === index ? null : index));
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

  const handleUnlockRoutine = useCallback(async () => {
    if (!run.taskId || !session) {
      console.error('[IssueViz] Missing taskId or session');
      return;
    }

    if (run.routine) {
      // Routine already exists, navigate directly
      router.push({
        pathname: '/(results)/routine/[runId]',
        params: { runId: run.id },
      });
      return;
    }

    try {
      setIsGeneratingRoutine(true);
      setRoutineError(null);

      // Update store status
      updateRun(run.id, { status: 'routine_pending' });

      // Get intake data from onboarding store
      const intake = getIntake();

      console.log('[IssueViz] Generating routine with intake:', intake);

      // Call /recommend endpoint
      await generateRoutine(run.taskId, intake, session.access_token);

      // Poll for routine completion
      const pollInterval = 1500; // 1.5 seconds
      const maxAttempts = 60; // 90 seconds max

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const taskStatus = await pollTaskStatus(run.taskId, session.access_token);

        if (taskStatus.routine_json) {
          // Success! Update store with routine
          updateRun(run.id, {
            status: 'routine_ready',
            routine: taskStatus.routine_json,
          });

          console.log('[IssueViz] Routine generated successfully');

          // Navigate to routine screen
          router.push({
            pathname: '/(results)/routine/[runId]',
            params: { runId: run.id },
          });

          return;
        }

        if (taskStatus.status === 'failed') {
          throw new Error(taskStatus.error || 'Routine generation failed');
        }

        console.log(`[IssueViz] Polling attempt ${attempt + 1}/${maxAttempts}, status: ${taskStatus.status}`);
      }

      throw new Error('Routine generation timeout - please try again');
    } catch (error) {
      console.error('[IssueViz] Routine generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate routine';
      setRoutineError(errorMessage);

      // Revert status
      updateRun(run.id, {
        status: 'completed',
        error: errorMessage,
      });
    } finally {
      setIsGeneratingRoutine(false);
    }
  }, [run.id, run.taskId, run.routine, session, getIntake, updateRun]);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View
        style={[
          styles.topBar,
          { paddingTop: 70 },
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
      <Pressable
        style={styles.imageContainer}
        onPress={() => setSelectedMarkerIndex(null)}
      >
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
            intensity={position.intensity}
            description={position.description}
            isSelected={selectedMarkerIndex === index}
            onPress={() => handleMarkerPress(index)}
            containerHeight={imageLayout.height}
            containerWidth={imageLayout.width}
          />
        ))}

        {/* Bottom Fade Gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.7)', '#000000']}
          style={styles.bottomGradient}
          pointerEvents="none"
        />
      </Pressable>

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

        {/* Unlock Routine Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={run.routine ? 'View Your Routine' : 'Unlock Your Routine'}
            onPress={handleUnlockRoutine}
            variant="primary"
            loading={isGeneratingRoutine}
            disabled={isGeneratingRoutine || !run.result}
          />
          {routineError && (
            <Text style={styles.errorText}>{routineError}</Text>
          )}
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.large,
    paddingBottom: Spacing.default,
    backgroundColor: Colors.darkBackground,
    position: 'relative',
  },
  fullReportButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 0.2,
    borderColor: Colors.white,
    paddingHorizontal: Spacing.default,
    paddingVertical: Spacing.small,
  },
  fullReportText: {
    ...Typography.bodyLarge,    
    color: Colors.white,
  },
  closeButton: {
    // width: 22,
    // height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    // backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 0,
    borderColor: Colors.white,
    position: 'absolute',
    right: Spacing.large,
    top: 75
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.black,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 1,
    marginBottom: 20,
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
    height: 100,
  },
  chipsContainer: {
    backgroundColor: Colors.darkBackground,
    paddingTop: 0,
  },
  chipsContent: {
    paddingHorizontal: Spacing.small,
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
  buttonContainer: {
    marginTop: Spacing.large,
    paddingHorizontal: Spacing.large,
  },
  errorText: {
    fontSize: 13,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: Spacing.small,
    fontWeight: '500',
  },
});
