import { useCallback, useState } from 'react';
import { FaceDetectionResult } from 'react-native-face-detector-camera';

/**
 * Face detection centering validation state
 */
export interface FaceDetectionState {
  isCentered: boolean;
  faceCount: number;
  faceSize: number | null; // Percentage of viewport filled (0-100)
}

/**
 * Configuration for face detection centering validation
 */
export interface FaceDetectionConfig {
  /** Horizontal centering threshold: face must be within this % of viewport (0.2 = center 60%) */
  horizontalCenterThreshold?: number;
  /** Vertical centering threshold: face must be within this % of viewport (0.2 = center 60%) */
  verticalCenterThreshold?: number;
  /** Minimum fill ratio for face size (0.3 = must fill at least 30% of viewport) */
  minFaceSize?: number;
  /** Whether to require exactly one face (no multiple faces) */
  requireSingleFace?: boolean;
}

/**
 * Custom hook for face detection with centering validation
 *
 * Returns whether a face is detected and properly centered for capture.
 * Used in scan screen to enable/disable capture button.
 *
 * @param viewportWidth - Camera viewport width in pixels
 * @param viewportHeight - Camera viewport height in pixels
 * @param config - Optional configuration for centering validation
 * @returns Face detection state and handler for camera callback
 */
export function useFaceDetection(
  viewportWidth: number,
  viewportHeight: number,
  config: FaceDetectionConfig = {}
) {
  const {
    horizontalCenterThreshold = 0.2,
    verticalCenterThreshold = 0.2,
    minFaceSize = 0.3,
    requireSingleFace = true,
  } = config;

  const [detectionState, setDetectionState] = useState<FaceDetectionState>({
    isCentered: false,
    faceCount: 0,
    faceSize: null,
  });

  /**
   * Process detected faces and validate centering
   */
  const handleFacesDetected = useCallback(
    (result: FaceDetectionResult) => {
      const { faces } = result;

      // No faces detected
      if (faces.length === 0) {
        setDetectionState({
          isCentered: false,
          faceCount: 0,
          faceSize: null,
        });
        return;
      }

      // Get the first (or only) face
      const face = faces[0];
      const { bounds } = face;

      if (!bounds || !bounds.origin || !bounds.size) {
        setDetectionState({
          isCentered: false,
          faceCount: faces.length,
          faceSize: null,
        });
        return;
      }

      const { origin, size } = bounds;

      // Calculate face center position
      const centerX = origin.x + size.width / 2;
      const centerY = origin.y + size.height / 2;

      // Check horizontal centering
      const isHorizontallyCentered =
        centerX > viewportWidth * horizontalCenterThreshold &&
        centerX < viewportWidth * (1 - horizontalCenterThreshold);

      // Check vertical centering
      const isVerticallyCentered =
        centerY > viewportHeight * verticalCenterThreshold &&
        centerY < viewportHeight * (1 - verticalCenterThreshold);

      // Check face size (fill ratio)
      const faceArea = size.width * size.height;
      const viewportArea = viewportWidth * viewportHeight;
      const fillRatio = faceArea / viewportArea;
      const fillsEnoughSpace = fillRatio > minFaceSize;
      const faceSizePercent = Math.round(fillRatio * 100);

      // Check single face requirement
      const isOnlyFace = !requireSingleFace || faces.length === 1;

      // All conditions must be met
      const isCentered =
        isHorizontallyCentered &&
        isVerticallyCentered &&
        fillsEnoughSpace &&
        isOnlyFace;

      setDetectionState({
        isCentered,
        faceCount: faces.length,
        faceSize: faceSizePercent,
      });

      if (isCentered) {
        console.log('[Face Detection] Face centered and ready to capture');
      }
    },
    [
      viewportWidth,
      viewportHeight,
      horizontalCenterThreshold,
      verticalCenterThreshold,
      minFaceSize,
      requireSingleFace,
    ]
  );

  return {
    ...detectionState,
    handleFacesDetected,
  };
}

/**
 * Utility function to get a human-readable message about face detection status
 */
export function getFaceDetectionMessage(state: FaceDetectionState): string {
  if (state.faceCount === 0) {
    return 'Move closer and center your face';
  }

  if (state.faceCount > 1) {
    return 'Only one face should be visible';
  }

  if (state.faceSize !== null && state.faceSize < 30) {
    return 'Move closer to the camera';
  }

  if (state.isCentered) {
    return 'Face centered - tap to capture';
  }

  return 'Center your face in the frame';
}
