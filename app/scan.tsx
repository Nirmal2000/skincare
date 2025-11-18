import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  CameraView,
  FaceDetectorMode,
  FaceDetectionResult,
  FaceDetectorClassifications,
  useCameraPermissions,
} from 'react-native-face-detector-camera';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { FaceDetectionOverlay } from '@/components/FaceDetectionOverlay';
import { Colors, Spacing } from '@/constants/Tokens';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useScanStore } from '@/features/scans/stores/scan-store';
import { startAnalysis } from '@/features/scans/face-analysis-api';

export default function ScanScreen() {
  // Hooks at top level
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const session = useAuthStore((state) => state.session);
  const createRun = useScanStore((state) => state.createRun);
  const updateRun = useScanStore((state) => state.updateRun);

  const [cameraReady, setCameraReady] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { isCentered, faceCount, handleFacesDetected } = useFaceDetection(
    viewportSize.width,
    viewportSize.height
  );

  const pulseScale = useSharedValue(1);

  // Callbacks
  const onFacesDetected = useCallback(
    (result: FaceDetectionResult) => {
      handleFacesDetected(result);
      if (result.faces.length > 0) {
        console.log(
          `[Scan Screen] Detected ${result.faces.length} face(s), centered: ${isCentered}`
        );
      }
    },
    [handleFacesDetected, isCentered]
  );

  const handleCameraLayout = useCallback(
    (event: any) => {
      const { width, height } = event.nativeEvent.layout;
      setViewportSize({ width, height });
    },
    []
  );

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || !session || !isCentered) return;

    try {
      setIsCapturing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo) {
        throw new Error('Failed to capture photo');
      }

      const runId = createRun(photo.uri, session.user.id);
      console.log('[Scan Screen] Created scan run:', runId);

      updateRun(runId, { status: 'uploading' });

      setIsUploading(true);
      const userAge = undefined;

      const response = await startAnalysis(
        photo.uri,
        userAge,
        session.access_token
      );

      console.log('[Scan Screen] Received task ID:', response.task_id);

      updateRun(runId, {
        taskId: response.task_id,
        status: 'queued',
      });

      router.push({
        pathname: '/(results)/[runId]',
        params: { runId },
      });
    } catch (error) {
      console.error('[Scan Screen] Capture error:', error);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );

      const runId = useScanStore.getState().currentRunId;
      if (runId) {
        updateRun(runId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } finally {
      setIsCapturing(false);
      setIsUploading(false);
    }
  }, [cameraRef, session, isCentered, createRun, updateRun]);

  const handleHomePress = useCallback(() => {
    router.back();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Effects
  useEffect(() => {
    if (isCentered && !isCapturing && !isUploading) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [isCentered, isCapturing, isUploading, pulseScale]);

  useEffect(() => {
    if (permission === null) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const pulseButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Loading state while checking permissions
  if (permission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brandPink} />
          <Text style={styles.loadingText}>Initializing camera...</Text>
        </View>
      </View>
    );
  }

  // Permission denied state
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="camera"
            size={48}
            color={Colors.textSecondary}
            style={{ marginBottom: Spacing.large }}
          />
          <Text style={styles.errorTitle}>Camera Permission Required</Text>
          <Text style={styles.errorMessage}>
            Please enable camera access in Settings to use the scan feature.
          </Text>
          <Pressable
            style={styles.settingsButton}
            onPress={() => router.back()}
          >
            <Text style={styles.settingsButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera always renders when permission is granted */}
      <CameraView
        ref={cameraRef}
        style={[StyleSheet.absoluteFill, styles.camera]}
        facing="front"
        faceDetectorSettings={{
          mode: FaceDetectorMode.fast,
          runClassifications: FaceDetectorClassifications.none,
          minDetectionInterval: 200,
        }}
        onFacesDetected={onFacesDetected}
        onCameraReady={() => {
          console.log('[Scan Screen] Camera ready');
          setCameraReady(true);
        }}
        onLayout={handleCameraLayout}
      />

      {/* Overlay only shows after camera is ready */}
      {cameraReady && (
        <FaceDetectionOverlay
          isCentered={isCentered}
          isDetecting={faceCount > 0}
        />
      )}

      <View
        style={[
          styles.topBar,
          { paddingTop: Math.max(insets.top, Spacing.large) },
        ]}
        pointerEvents="box-none"
      >
        <Pressable style={styles.homeButton} onPress={handleHomePress}>
          <Ionicons name="home" size={28} color={Colors.white} />
        </Pressable>

        <View style={styles.centerLabel}>
          <Text style={styles.angleText}>Front Angle</Text>
        </View>

        <View style={styles.referenceContainer}>
          <Image
            source={require('@/assets/images/facesample.png')}
            style={styles.referenceImage}
            resizeMode="cover"
          />
          <View style={styles.referenceOverlay} />
        </View>
      </View>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom + Spacing.large, Spacing.xl) },
        ]}
        pointerEvents="box-none"
      >
        <Animated.View style={pulseButtonStyle}>
          <Pressable
            style={[
              styles.captureButton,
              !isCentered && styles.captureButtonDisabled,
            ]}
            onPress={handleCapture}
            disabled={!isCentered || isCapturing || isUploading}
          >
            {isCapturing || isUploading ? (
              <>
                <ActivityIndicator
                  size="large"
                  color={Colors.white}
                  style={{ marginBottom: Spacing.small }}
                />
                <Text style={styles.captureButtonText}>
                  {isCapturing ? 'Capturing...' : 'Uploading...'}
                </Text>
              </>
            ) : (
              <>
                <View style={styles.captureButtonInner} />
                <Text style={styles.captureButtonText}>Take Photo</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        <View style={styles.statusContainer}>
          {!isCentered && faceCount === 0 && (
            <Text style={styles.statusText}>
              Move closer and center your face
            </Text>
          )}
          {!isCentered && faceCount > 1 && (
            <Text style={styles.statusText}>Only one face should be visible</Text>
          )}
          {isCentered && !isCapturing && !isUploading && (
            <Text style={[styles.statusText, styles.readyText]}>
              Face centered - tap to capture
            </Text>
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
  camera: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.large,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: Spacing.large,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.large,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  homeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  centerLabel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  angleText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: Spacing.default,
    paddingVertical: Spacing.small,
    borderRadius: 20,
  },
  referenceContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  referenceImage: {
    width: '100%',
    height: '100%',
  },
  referenceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.large,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  captureButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.brandPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.large,
    shadowColor: Colors.brandPink,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  captureButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    shadowOpacity: 0.2,
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.white,
    opacity: 0.9,
    marginBottom: Spacing.tiny,
  },
  captureButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: Spacing.large,
    minHeight: 20,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  readyText: {
    color: Colors.successGreen,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.large,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  settingsButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.default,
    backgroundColor: Colors.brandPink,
    borderRadius: 12,
  },
  settingsButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
});
