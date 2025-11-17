import { useCallback, useState } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
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

  const promptForCameraAccess = useCallback(async () => {
    if (!permissions.cameraSupported) {
      Alert.alert(
        "Camera not supported",
        "Live scanning is unavailable on this device. Try uploading a photo from another device.",
      );
      return false;
    }
    if (permissions.camera.granted) {
      return true;
    }
    const response = await permissions.requestCameraPermission();
    if (!response?.granted) {
      Alert.alert(
        "Camera access needed",
        "Please allow camera permission to scan your skin.",
      );
      return false;
    }
    return true;
  }, [permissions]);

  const handleStartScan = useCallback(() => {
    requireAuth(() => {
      if (requestingAccess) {
        return;
      }
      setRequestingAccess(true);
      void promptForCameraAccess()
        .then((granted) => {
          if (granted) {
            router.push("/(tabs)/scan");
          }
        })
        .finally(() => setRequestingAccess(false));
    });
  }, [promptForCameraAccess, requireAuth, requestingAccess, router]);

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
            disabled={requestingAccess}
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
});
