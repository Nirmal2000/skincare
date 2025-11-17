import { useCallback, useEffect, useState } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Alert, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useAuthGate } from "@/features/auth/useAuthGate";
import { useScanPermissions } from "@/features/scans/permissions";

const ACCENT = "#F18A1B";
const LOGO_SIZE = 220;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const FACE_IMAGE = require("../../assets/images/face.png");

export default function Home() {
  const router = useRouter();
  const { requireAuth } = useAuthGate();
  const permissions = useScanPermissions();
  const pressProgress = useSharedValue(0);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState(false);

  const closePermissionModal = useCallback(() => {
    if (requestingAccess) return;
    setPermissionModalVisible(false);
    setPendingNavigation(false);
    setPermissionError(null);
  }, [requestingAccess]);

  const handleRequestPermission = useCallback(() => {
    setPermissionError(null);
    setRequestingAccess(true);
    void permissions
      .requestCameraPermission()
      .then((response) => {
        if (!response?.granted && response?.canAskAgain === false) {
          setPermissionError("Camera access is blocked. Open Settings to enable it.");
        } else if (!response?.granted) {
          setPermissionError("We need camera access to start your scan.");
        }
      })
      .catch(() => {
        setPermissionError("Unable to open the camera prompt. Try again in a moment.");
      })
      .finally(() => setRequestingAccess(false));
  }, [permissions]);

  const handleOpenSettings = useCallback(() => {
    setPermissionError(null);
    Linking.openSettings().catch(() => {
      Alert.alert(
        "Open Settings",
        "Please open your device settings manually and enable the camera for BetterSkin.",
      );
    });
  }, []);

  useEffect(() => {
    if (pendingNavigation && permissions.camera.granted) {
      setPermissionModalVisible(false);
      setPendingNavigation(false);
      setPermissionError(null);
      router.push("/(tabs)/scan");
    }
  }, [pendingNavigation, permissions.camera.granted, router]);

  const handleStartScan = useCallback(() => {
    requireAuth(() => {
      if (!permissions.cameraSupported) {
        Alert.alert(
          "Camera not supported",
          "Live scanning is unavailable on this device. Try uploading a photo from another device.",
        );
        return;
      }
      if (permissions.camera.granted) {
        router.push("/(tabs)/scan");
        return;
      }
      setPermissionError(null);
      setPendingNavigation(true);
      setPermissionModalVisible(true);
    });
  }, [permissions.cameraSupported, permissions.camera.granted, requireAuth, router]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 - pressProgress.value * 0.04 },
      { translateY: pressProgress.value * 6 },
    ],
  }));

  return (
    <View style={styles.safeArea}>
      <View style={styles.center}>
        <View style={styles.logoShell}>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel="Scan your skin"
            hitSlop={16}
            style={[styles.logoButton, logoAnimatedStyle]}
            onPressIn={() => {
              pressProgress.value = withTiming(1, { duration: 90 });
            }}
            onPressOut={() => {
              pressProgress.value = withTiming(0, { duration: 140 });
            }}
            onPress={handleStartScan}
          >
            <View style={styles.logo}>
              <Image
                source={FACE_IMAGE}
                style={styles.faceImage}
                contentFit="contain"
              />
            </View>
          </AnimatedPressable>
        </View>

        {/* Tagline + micro-hint */}
        <View style={styles.copyBlock}>
          <Text style={styles.tagline}>Scan. Understand. Improve.</Text>
          <Text style={styles.hint}>Tap the circle to start</Text>
        </View>

        <Modal
          visible={permissionModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closePermissionModal}
        >
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={closePermissionModal} />
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Allow camera access</Text>
              <Text style={styles.modalMessage}>
                {permissions.camera.canAskAgain === false && !permissions.camera.granted
                  ? "Camera access is currently blocked. Open your device settings to enable it and continue."
                  : "We’ll need access to your camera to capture a close-up of your skin before scanning."}
              </Text>
              {permissionError ? (
                <Text style={styles.modalError}>{permissionError}</Text>
              ) : null}
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.modalSecondary]}
                  onPress={closePermissionModal}
                >
                  <Text style={styles.modalSecondaryLabel}>Not now</Text>
                </Pressable>
                {permissions.camera.canAskAgain === false && !permissions.camera.granted ? (
                  <Pressable
                    style={[styles.modalButton, styles.modalPrimary]}
                    onPress={handleOpenSettings}
                  >
                    <Text style={styles.modalPrimaryLabel}>Open settings</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[
                      styles.modalButton,
                      styles.modalPrimary,
                      requestingAccess ? styles.modalPrimaryDisabled : null,
                    ]}
                    onPress={handleRequestPermission}
                    disabled={requestingAccess}
                  >
                    <Text style={styles.modalPrimaryLabel}>
                      {requestingAccess ? "Requesting..." : "Allow camera"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9F5EF",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logoShell: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 18,
  },
  logoButton: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0, 0, 0, 0.15)",
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 36,
    shadowOpacity: 1,
    elevation: 18,
  },
  logo: {
    alignItems: "center",
    justifyContent: "center",
  },
  faceImage: {
    width: LOGO_SIZE * 0.65,
    height: LOGO_SIZE * 0.65,
  },

  // New styles for text block
  copyBlock: {
    marginTop: 24,
    alignItems: "center",
  },
  tagline: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C2C2C",
    textAlign: "center",
  },
  hint: {
    marginTop: 6,
    fontSize: 14,
    color: "#8A7F74",
    opacity: 0.9,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#22170D",
  },
  modalMessage: {
    fontSize: 15,
    color: "#4E4338",
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButton: {
    minWidth: 120,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  modalSecondary: {
    backgroundColor: "rgba(13, 7, 2, 0.08)",
  },
  modalSecondaryLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4E4338",
  },
  modalPrimary: {
    backgroundColor: ACCENT,
  },
  modalPrimaryDisabled: {
    opacity: 0.6,
  },
  modalPrimaryLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalError: {
    color: "#B42318",
    fontSize: 13,
  },
});
