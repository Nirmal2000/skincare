// app/(tabs)/scan.tsx
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTabBarVisibility } from "@/features/navigation/tab-bar-visibility";

import { CameraStage } from "./scan/CameraStage";
import { scanStyles as styles } from "./scan/styles";
import { useScanWorkflow } from "./scan/useScanWorkflow";

const FACE_SAMPLE = require("@/assets/images/facesample.png");

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setTabHidden = useTabBarVisibility((state) => state.setHidden);
  const cameraFacing: "front" | "back" = "front";

  useFocusEffect(
    useCallback(() => {
      setTabHidden(true);
      return () => setTabHidden(false);
    }, [setTabHidden]),
  );

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
    pickingImage,
    scanning,
    faceStatus,
    canCapture,
    handleFaceDetectionStatus,
    handleTakePhoto,
    handlePickImage,
    handleScan,
    handleReset,
    requestCameraPermission,
  } = useScanWorkflow();

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
        return "Align with frame";
    }
  })();

  const faceHint = (() => {
    switch (faceStatus) {
      case "ready":
        return "Face detected. Hold still and tap capture.";
      case "off-target":
        return "Move closer until your face fills the frame.";
      case "multi-face":
        return "Only one face should be in the frame.";
      default:
        return "We can’t see your face yet—step into the frame.";
    }
  })();

  const captureDisabled = takingPhoto || scanning || !canCapture;
  const galleryDisabled = pickingImage || scanning || takingPhoto;

  function goHome() {
    setTabHidden(false);
    router.replace("/(tabs)/home");
  }

  return (
    <View style={styles.screen}>
      <View style={styles.cameraStage}>
        <CameraStage
          profile={profile}
          loading={loading}
          previewUri={previewUri}
          isFocused={isFocused}
          cameraSupported={permissions.cameraSupported}
          cameraGranted={permissions.camera.granted}
          cameraRef={cameraRef}
          facing={cameraFacing}
          onRequireAuth={requireAuth}
          onRequestCameraPermission={() => {
            void requestCameraPermission();
          }}
          onFaceDetectionChange={handleFaceDetectionStatus}
        />
      </View>
      <View
        pointerEvents="box-none"
        style={[
          styles.overlayLayer,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 32,
          },
        ]}
      >
        <View style={styles.topRow}>
          <Pressable style={styles.homeButton} onPress={goHome}>
            <Feather name="home" size={26} style={styles.iconButtonIcon} />
          </Pressable>
          <View style={styles.iconButton} />
          <Image source={FACE_SAMPLE} style={styles.sampleThumb} />
        </View>
        <View style={styles.spacer} />
        <View style={styles.bottomSection}>
          <Text style={styles.hintText}>{faceHint}</Text>
          {previewUri ? (
            <View style={styles.previewActions}>
              <Pressable
                style={styles.secondaryAction}
                onPress={handleReset}
                disabled={scanning}
              >
                <Text style={styles.secondaryLabel}>Retake</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryAction,
                  scanning ? styles.disabledAction : null,
                ]}
                onPress={handleScan}
                disabled={scanning}
              >
                <Text style={styles.primaryLabel}>
                  {scanning ? "Scanning..." : "Run scan"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.captureRow}>
              <Pressable
                style={[
                  styles.galleryButton,
                  galleryDisabled ? styles.disabledAction : null,
                ]}
                onPress={handlePickImage}
                disabled={galleryDisabled}
              >
                <Feather name="image" size={26} style={styles.galleryIcon} />
              </Pressable>
              <Pressable
                onPress={handleTakePhoto}
                disabled={captureDisabled}
                style={({ pressed }) => [
                  styles.captureButton,
                  captureDisabled && styles.captureButtonDisabled,
                  pressed && !captureDisabled ? styles.captureButtonPressed : null,
                ]}
              >
                <Text style={styles.captureLabel}>{captureLabel}</Text>
              </Pressable>
            </View>
          )}
          {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
        </View>
      </View>
    </View>
  );
}
