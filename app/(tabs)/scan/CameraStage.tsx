import { useCallback, useEffect, useRef } from "react";
import { Animated, LayoutChangeEvent, Text, View } from "react-native";
import { Image } from "expo-image";
import {
  CameraView,
  FaceDetectorClassifications,
  FaceDetectorMode,
  type FaceDetectionResult,
} from "react-native-face-detector-camera";

import type { UserProfile } from "@/features/auth/useSupabaseSession";
import { Card, PrimaryButton } from "@/lib/ui/facefit-components";

import { OVAL_H, OVAL_W } from "./constants";
import { OvalMask } from "./OvalMask";
import { scanStyles as styles } from "./styles";
import type { FaceDetectionStatus } from "./useScanWorkflow";

type CameraStageProps = {
  profile: UserProfile | null;
  loading: boolean;
  previewUri: string | null;
  isFocused: boolean;
  cameraSupported: boolean;
  cameraGranted: boolean;
  cameraRef: React.RefObject<CameraView | null>;
  lineY: Animated.Value;
  onRequireAuth: () => void;
  onRequestCameraPermission: () => void;
  onFaceDetectionChange: (status: FaceDetectionStatus) => void;
};

export function CameraStage({
  profile,
  loading,
  previewUri,
  isFocused,
  cameraSupported,
  cameraGranted,
  cameraRef,
  lineY,
  onRequireAuth,
  onRequestCameraPermission,
  onFaceDetectionChange,
}: CameraStageProps) {
  const maskLayoutRef = useRef({ width: OVAL_W, height: OVAL_H });
  const lastStatusRef = useRef<FaceDetectionStatus | null>(null);

  const emitFaceStatus = useCallback(
    (status: FaceDetectionStatus) => {
      if (lastStatusRef.current === status) return;
      lastStatusRef.current = status;
      onFaceDetectionChange(status);
    },
    [onFaceDetectionChange],
  );

  useEffect(() => {
    if (!profile || previewUri || !cameraSupported || !cameraGranted || !isFocused) {
      emitFaceStatus("no-face");
    }
  }, [
    cameraGranted,
    cameraSupported,
    emitFaceStatus,
    isFocused,
    previewUri,
    profile,
  ]);

  const handleMaskLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    maskLayoutRef.current = { width, height };
  }, []);

  const handleFacesDetected = useCallback(
    ({ faces }: FaceDetectionResult) => {
      if (!faces || faces.length === 0) {
        emitFaceStatus("no-face");
        return;
      }

      if (faces.length > 1) {
        emitFaceStatus("multi-face");
        return;
      }

      const [primaryFace] = faces;
      const centerX = primaryFace.bounds.origin.x + primaryFace.bounds.size.width / 2;
      const centerY = primaryFace.bounds.origin.y + primaryFace.bounds.size.height / 2;
      const { width, height } = maskLayoutRef.current;

      if (!width || !height) {
        emitFaceStatus("off-target");
        return;
      }

      const minWidth = width * 0.6;
      const minHeight = height * 0.6;
      if (
        primaryFace.bounds.size.width < minWidth ||
        primaryFace.bounds.size.height < minHeight
      ) {
        emitFaceStatus("off-target");
        return;
      }

      const radiusX = width / 2;
      const radiusY = height / 2;
      const normalized =
        (Math.pow(centerX - radiusX, 2) / Math.pow(radiusX, 2)) +
        (Math.pow(centerY - radiusY, 2) / Math.pow(radiusY, 2));

      emitFaceStatus(normalized <= 1 ? "ready" : "off-target");
    },
    [emitFaceStatus],
  );

  if (!profile) {
    return (
      <Card style={{ gap: 8 }}>
        <Text style={styles.cardTitle}>Sign in to capture</Text>
        <Text style={styles.cardCopy}>
          We need a signed-in account before enabling camera or gallery access. Your
          scans stay on this device.
        </Text>
        <PrimaryButton
          label={loading ? "Checking account..." : "Sign in"}
          onPress={onRequireAuth}
          disabled={loading}
        />
      </Card>
    );
  }

  if (previewUri) {
    return (
      <View style={styles.ovalShadow}>
        <OvalMask>
          <Image source={{ uri: previewUri }} style={styles.fill} />
        </OvalMask>
      </View>
    );
  }

  if (!cameraSupported) {
    return (
      <Card style={{ gap: 8 }}>
        <Text style={styles.cardTitle}>Camera unavailable</Text>
        <Text style={styles.cardCopy}>
          Browser builds do not support live preview. Upload from your gallery instead.
        </Text>
      </Card>
    );
  }

  if (!cameraGranted) {
    return (
      <Card style={{ gap: 8 }}>
        <Text style={styles.cardTitle}>Enable camera</Text>
        <Text style={styles.cardCopy}>
          Grant camera permission so we can show a live preview.
        </Text>
        <PrimaryButton
          label="Allow camera access"
          onPress={onRequestCameraPermission}
        />
      </Card>
    );
  }

  if (!isFocused) {
    return (
      <Card style={{ gap: 8 }}>
        <Text style={styles.cardTitle}>Paused</Text>
        <Text style={styles.cardCopy}>
          Camera is paused while another screen is open.
        </Text>
      </Card>
    );
  }

  return (
    <View style={styles.ovalShadow} onLayout={handleMaskLayout}>
      <OvalMask>
        <CameraView
          ref={cameraRef}
          style={styles.fill}
          facing="front"
          faceDetectorSettings={{
            mode: FaceDetectorMode.fast,
            runClassifications: FaceDetectorClassifications.none,
            minDetectionInterval: 250,
            tracking: true,
          }}
          onFacesDetected={handleFacesDetected}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.scanLine, { transform: [{ translateY: lineY }] }]}
        />
      </OvalMask>
    </View>
  );
}
