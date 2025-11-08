import { useMemo } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { CameraType, CameraView } from "expo-camera";

import type { UserProfile } from "@/features/auth/useSupabaseSession";
import { Card, PrimaryButton } from "@/lib/ui/facefit-components";

import { OvalMask } from "./OvalMask";
import { scanStyles as styles } from "./styles";

type CameraStageProps = {
  profile: UserProfile | null;
  loading: boolean;
  previewUri: string | null;
  isFocused: boolean;
  cameraSupported: boolean;
  cameraGranted: boolean;
  cameraRef: React.RefObject<CameraView | null>;
  facing: CameraType;
  lineY: Animated.Value;
  onToggleFacing: () => void;
  onRequireAuth: () => void;
  onRequestCameraPermission: () => void;
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
  lineY,
  onToggleFacing,
  onRequireAuth,
  onRequestCameraPermission,
}: CameraStageProps) {
  const cameraArea = useMemo(() => {
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
      <View style={styles.ovalShadow}>
        <OvalMask>
          <CameraView ref={cameraRef} style={styles.fill} facing={facing} />
          <Animated.View
            pointerEvents="none"
            style={[styles.scanLine, { transform: [{ translateY: lineY }] }]}
          />
          <TouchableOpacity style={styles.facingButton} onPress={onToggleFacing}>
            <Text style={styles.facingButtonText}>
              {facing === "front" ? "Front" : "Back"}
            </Text>
          </TouchableOpacity>
        </OvalMask>
      </View>
    );
  }, [
    cameraGranted,
    cameraRef,
    cameraSupported,
    facing,
    isFocused,
    lineY,
    loading,
    onRequestCameraPermission,
    onRequireAuth,
    onToggleFacing,
    previewUri,
    profile,
  ]);

  return cameraArea;
}
