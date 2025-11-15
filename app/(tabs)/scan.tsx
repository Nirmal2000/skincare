// app/(tabs)/scan.tsx
import { Text, View } from "react-native";

import {
  PrimaryButton,
  SecondaryButton,
} from "@/lib/ui/facefit-components";

import { CameraStage } from "./scan/CameraStage";
import { OVAL_H, TABBAR_CLEARANCE } from "./scan/constants";
import { scanStyles as styles } from "./scan/styles";
import { useScanLineAnimation } from "./scan/useScanLineAnimation";
import { useScanWorkflow } from "./scan/useScanWorkflow";

export default function ScanScreen() {
  const {
    profile,
    loading,
    requireAuth,
    permissions,
    isFocused,
    cameraRef,
    previewUri,
    statusMessage,
    takingPhoto,
    scanning,
    faceStatus,
    canCapture,
    handleFaceDetectionStatus,
    handleTakePhoto,
    handleScan,
    handleReset,
    requestCameraPermission,
  } = useScanWorkflow();

  const lineY = useScanLineAnimation(OVAL_H);
  const captureLabel = (() => {
    if (takingPhoto) return "Capturing...";
    switch (faceStatus) {
      case "ready":
        return "Take photo";
      case "no-face":
        return "Waiting for face...";
      case "multi-face":
        return "One face at a time";
      default:
        return "Align with oval";
    }
  })();

  const faceHint = (() => {
    switch (faceStatus) {
      case "ready":
        return "Face detected. Hold still and tap capture.";
      case "off-target":
        return "Move closer until your face fills the oval.";
      case "multi-face":
        return "Only one face should be in the frame.";
      default:
        return "We can’t see your face yet—step into the frame.";
    }
  })();

  return (
    <View style={styles.safeArea}>
      <View
        style={[
          styles.container,
          { paddingBottom: TABBAR_CLEARANCE },
        ]}
      >
        <Text style={styles.heading}>Put your face in the oval</Text>
        <Text style={styles.subhead}>Make sure you’re well-lit and makeup-free.</Text>

        <View style={styles.stage}>
          <CameraStage
            profile={profile}
            loading={loading}
            previewUri={previewUri}
            isFocused={isFocused}
            cameraSupported={permissions.cameraSupported}
            cameraGranted={permissions.camera.granted}
            cameraRef={cameraRef}
            lineY={lineY}
            onRequireAuth={requireAuth}
            onRequestCameraPermission={() => {
              void requestCameraPermission();
            }}
            onFaceDetectionChange={handleFaceDetectionStatus}
          />
        </View>

        {!previewUri ? (
          <Text
            style={[
              styles.detectionHint,
              faceStatus === "ready" ? styles.detectionHintReady : null,
            ]}
          >
            {faceHint}
          </Text>
        ) : null}

        {previewUri ? (
          <View style={styles.inlineActions}>
            <SecondaryButton
              label="Retake"
              onPress={handleReset}
              disabled={scanning}
              style={styles.inlineButton}
            />
            <PrimaryButton
              label={scanning ? "Scanning..." : "Run scan"}
              onPress={handleScan}
              disabled={scanning}
              style={[styles.inlineButton, styles.captureButton]}
            />
          </View>
        ) : (
          <View style={styles.inlineActions}>
            <PrimaryButton
              label={captureLabel}
              onPress={handleTakePhoto}
              disabled={takingPhoto || scanning || !canCapture}
              style={[styles.inlineButton, styles.captureButton]}
            />
          </View>
        )}

        {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
      </View>
    </View>
  );
}
