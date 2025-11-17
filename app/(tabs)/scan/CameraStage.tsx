import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { LayoutChangeEvent, Text, View } from "react-native";
import {
  CameraView,
  FaceDetectorClassifications,
  FaceDetectorMode,
  type FaceDetectionResult,
} from "react-native-face-detector-camera";

import type { UserProfile } from "@/features/auth/useSupabaseSession";
import { Card } from "@/lib/ui/facefit-components";

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
  facing: "front" | "back";
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
  facing,
  onFaceDetectionChange,
}: CameraStageProps) {
  const maskLayoutRef = useRef({ width: 0, height: 0 });
  const lastStatusRef = useRef<FaceDetectionStatus | null>(null);
  const faceDetectorSettings = useMemo(
    () => ({
      mode: FaceDetectorMode.fast,
      runClassifications: FaceDetectorClassifications.none,
      minDetectionInterval: 250,
      tracking: true,
    }),
    [],
  );

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

      const minWidth = width * 0.5
      const minHeight = height * 0.5;
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
  
  if (previewUri) {
    return (
      <View style={styles.cameraLayer} onLayout={handleMaskLayout}>
        <Image source={{ uri: previewUri }} style={styles.previewImage} />
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
          Go back to the home screen to allow camera access, then return to scan.
        </Text>
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
    <View style={styles.cameraLayer} onLayout={handleMaskLayout}>
      <CameraView
        ref={cameraRef}
        style={styles.cameraFill}
        facing={facing}
        faceDetectorSettings={faceDetectorSettings}
        onFacesDetected={handleFacesDetected}
      />
    </View>
  );
}
