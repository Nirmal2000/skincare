// app/(tabs)/scan.tsx
import { ActivityIndicator, SafeAreaView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  PrimaryButton,
  SecondaryButton,
} from "@/lib/ui/facefit-components";

import { CameraStage } from "./scan/CameraStage";
import { TABBAR_CLEARANCE, OVAL_H } from "./scan/constants";
import { scanStyles as styles } from "./scan/styles";
import { useScanLineAnimation } from "./scan/useScanLineAnimation";
import { useScanWorkflow } from "./scan/useScanWorkflow";

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile,
    loading,
    requireAuth,
    permissions,
    isFocused,
    cameraRef,
    facing,
    previewUri,
    statusMessage,
    takingPhoto,
    pickingImage,
    scanning,
    toggleFacing,
    handleTakePhoto,
    handlePickImage,
    handleScan,
    handleReset,
    requestCameraPermission,
  } = useScanWorkflow();

  const lineY = useScanLineAnimation(OVAL_H);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={[
          styles.container,
          { paddingBottom: TABBAR_CLEARANCE + insets.bottom },
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
            facing={facing}
            lineY={lineY}
            onToggleFacing={toggleFacing}
            onRequireAuth={requireAuth}
            onRequestCameraPermission={() => {
              void requestCameraPermission();
            }}
          />
        </View>

        {previewUri ? (
          <View style={styles.inlineActions}>
            <PrimaryButton
              label={scanning ? "Scanning..." : "Run scan"}
              onPress={handleScan}
              disabled={scanning}
              style={styles.inlineButton}
            />
            <SecondaryButton
              label="Retake"
              onPress={handleReset}
              disabled={scanning}
              style={styles.inlineButton}
            />
          </View>
        ) : (
          <View style={styles.inlineActions}>
            <SecondaryButton
              label={pickingImage ? "Opening gallery..." : "From gallery"}
              onPress={handlePickImage}
              disabled={pickingImage || scanning}
              style={styles.inlineButton}
            />
            <PrimaryButton
              label={takingPhoto ? "Capturing..." : "Take photo"}
              onPress={handleTakePhoto}
              disabled={takingPhoto || scanning}
              style={[styles.inlineButton, styles.captureButton]}
            />
          </View>
        )}

        {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}

        {scanning ? (
          <View style={styles.overlay}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.overlayText}>Analyzing skin tone...</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
