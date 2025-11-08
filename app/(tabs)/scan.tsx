import { useIsFocused } from "@react-navigation/native";
import { CameraType, CameraView } from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuthGate } from "@/features/auth/useAuthGate";
import { encodeAnalysisPayload } from "@/features/scans/analysis-payload";
import { analyzeFaceImage } from "@/features/scans/face-analysis-api";
import { useScanPermissions } from "@/features/scans/permissions";
import type { ScanSource } from "@/features/scans/scan-store";
import {
  Card,
  PrimaryButton,
  SecondaryButton,
} from "@/lib/ui/facefit-components";

export default function ScanScreen() {
  const router = useRouter();
  const { profile, loading, requireAuth } = useAuthGate();
  const permissions = useScanPermissions();
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView | null>(null);
  const analysisController = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const [facing, setFacing] = useState<CameraType>("front");
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<ScanSource | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [takingPhoto, setTakingPhoto] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      analysisController.current?.abort();
    };
  }, []);

  const ensureSignedIn = useCallback(() => {
    if (loading) {
      setStatusMessage("Checking your account. Try again in a second.");
      return false;
    }
    if (!profile) {
      requireAuth();
      return false;
    }
    return true;
  }, [loading, profile, requireAuth]);

  const ensureCameraPermission = useCallback(async () => {
    if (!permissions.cameraSupported) {
      setStatusMessage("Camera preview is unavailable on this platform. Use gallery upload instead.");
      return false;
    }
    if (!permissions.camera.granted) {
      const response = await permissions.requestCameraPermission();
      if (!response?.granted) {
        setStatusMessage("Camera access is required before you can capture a photo.");
        return false;
      }
    }
    return true;
  }, [permissions]);

  const ensureMediaPermission = useCallback(async () => {
    if (!permissions.media.granted) {
      const response = await permissions.requestMediaPermission();
      if (!response?.granted) {
        setStatusMessage("Gallery access is required to choose an existing photo.");
        return false;
      }
    }
    return true;
  }, [permissions]);

  const handleTakePhoto = useCallback(async () => {
    setStatusMessage(null);
    if (!ensureSignedIn()) {
      return;
    }
    const permissionOk = await ensureCameraPermission();
    if (!permissionOk) {
      return;
    }
    const camera = cameraRef.current;
    if (!camera) {
      setStatusMessage("Camera is still warming up. Try again in a moment.");
      return;
    }

    setTakingPhoto(true);
    try {
      const picture = await camera.takePictureAsync({
        quality: 0.85,
        skipProcessing: true,
      });
      if (!mountedRef.current) {
        return;
      }
      setPreviewUri(picture.uri);
      setPreviewSource("camera");
    } catch (error) {
      console.warn("Camera capture failed", error);
      if (mountedRef.current) {
        setStatusMessage("We couldn't take that photo. Adjust lighting and retry.");
      }
    } finally {
      if (mountedRef.current) {
        setTakingPhoto(false);
      }
    }
  }, [ensureCameraPermission, ensureSignedIn]);

  const handlePickImage = useCallback(async () => {
    setStatusMessage(null);
    if (!ensureSignedIn()) {
      return;
    }
    const permissionOk = await ensureMediaPermission();
    if (!permissionOk) {
      return;
    }

    setPickingImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!mountedRef.current) {
        return;
      }
      if (!result.canceled && result.assets.length > 0) {
        setPreviewUri(result.assets[0].uri);
        setPreviewSource("gallery");
      }
    } catch (error) {
      console.warn("Image pick failed", error);
      if (mountedRef.current) {
        setStatusMessage("Unable to open your gallery right now.");
      }
    } finally {
      if (mountedRef.current) {
        setPickingImage(false);
      }
    }
  }, [ensureMediaPermission, ensureSignedIn]);

  const handleScan = useCallback(async () => {
    if (!previewUri || !previewSource) {
      return;
    }
    setStatusMessage(null);
    if (!ensureSignedIn()) {
      return;
    }
    setScanning(true);
    const controller = new AbortController();
    analysisController.current = controller;
    try {
      const result = await analyzeFaceImage(previewUri, controller.signal);
      if (!mountedRef.current) {
        return;
      }
      const analysisParam = encodeAnalysisPayload({
        kind: "structured",
        data: result,
      });
      router.push({
        pathname: "/(tabs)/result",
        params: {
          imageUri: encodeURIComponent(previewUri),
          analysis: analysisParam,
          source: previewSource,
        },
      });
    } catch (error) {
      console.warn("Face analysis failed", error);
      if (mountedRef.current) {
        const message =
          error instanceof Error
            ? error.message
            : "Scan failed. Check your connection and try again.";
        setStatusMessage(message);
      }
    } finally {
      analysisController.current = null;
      if (mountedRef.current) {
        setScanning(false);
      }
    }
  }, [ensureSignedIn, previewSource, previewUri, router]);

  const handleReset = useCallback(() => {
    setPreviewUri(null);
    setPreviewSource(null);
    setStatusMessage(null);
  }, []);

  const toggleFacing = useCallback(() => {
    setFacing((current) => (current === "front" ? "back" : "front"));
  }, []);

  const renderCameraArea = () => {
    if (!profile) {
      return (
        <Card style={{ gap: 8 }}>
          <Text style={styles.cardTitle}>Sign in to capture</Text>
          <Text style={styles.cardCopy}>
            We need a signed-in account before enabling camera or gallery
            access. Your scans stay on this device.
          </Text>
          <PrimaryButton
            label={loading ? "Checking account..." : "Sign in"}
            onPress={() => requireAuth()}
            disabled={loading}
          />
        </Card>
      );
    }

    if (previewUri) {
      return (
        <View style={styles.previewShell}>
          <Image source={{ uri: previewUri }} style={styles.previewImage} />
        </View>
      );
    }

    if (!permissions.cameraSupported) {
      return (
        <Card style={{ gap: 8 }}>
          <Text style={styles.cardTitle}>Camera unavailable</Text>
          <Text style={styles.cardCopy}>
            Browser builds do not support live preview. Upload from your gallery
            instead.
          </Text>
        </Card>
      );
    }

    if (!permissions.camera.granted) {
      return (
        <Card style={{ gap: 8 }}>
          <Text style={styles.cardTitle}>Enable camera</Text>
          <Text style={styles.cardCopy}>
            Grant camera permission so we can show a live preview.
          </Text>
          <PrimaryButton
            label="Allow camera access"
            onPress={ensureCameraPermission}
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
      <View style={styles.cameraShell}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          enableTorch={false}
        />
        <TouchableOpacity style={styles.facingButton} onPress={toggleFacing}>
          <Text style={styles.facingButtonText}>
            {facing === "front" ? "Front" : "Back"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={{ gap: 8 }}>
          <Text style={styles.title}>Makeup-free face only</Text>
          <Text style={styles.subtitle}>
            Good lighting, one person, no filters. We will guide you through the
            capture or let you upload an existing photo.
          </Text>
        </View>

        <View style={styles.stage}>{renderCameraArea()}</View>

        {previewUri ? (
          <View style={styles.actions}>
            <PrimaryButton
              label={scanning ? "Scanning..." : "Run scan"}
              onPress={handleScan}
              disabled={scanning}
            />
            <SecondaryButton
              label="Retake"
              onPress={handleReset}
              disabled={scanning}
            />
          </View>
        ) : (
          <View style={styles.actions}>
            <PrimaryButton
              label={takingPhoto ? "Capturing..." : "Take photo"}
              onPress={handleTakePhoto}
              disabled={takingPhoto || scanning}
            />
            <SecondaryButton
              label={pickingImage ? "Opening gallery..." : "Upload from gallery"}
              onPress={handlePickImage}
              disabled={pickingImage || scanning}
            />
          </View>
        )}

        {statusMessage ? (
          <Text style={styles.status}>{statusMessage}</Text>
        ) : null}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B6B6B",
  },
  stage: {
    flex: 1,
  },
  cameraShell: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#0A0A0A",
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  facingButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  facingButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  previewShell: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#0A0A0A",
  },
  previewImage: {
    flex: 1,
  },
  actions: {
    gap: 12,
  },
  status: {
    color: "#C03515",
    fontSize: 14,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "rgba(10,10,10,0.9)",
  },
  overlayText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  cardCopy: {
    color: "#6B6B6B",
    fontSize: 14,
  },
});
