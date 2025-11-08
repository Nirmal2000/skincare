import { useIsFocused } from "@react-navigation/native";
import { CameraView } from "react-native-face-detector-camera";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthGate } from "@/features/auth/useAuthGate";
import { encodeAnalysisPayload } from "@/features/scans/analysis-payload";
import { analyzeFaceImage } from "@/features/scans/face-analysis-api";
import { useScanPermissions } from "@/features/scans/permissions";
import type { ScanSource } from "@/features/scans/scan-store";

export type FaceDetectionStatus = "no-face" | "off-target" | "ready" | "multi-face";

function useMountedRef() {
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return mountedRef;
}

export function useScanWorkflow() {
  const router = useRouter();
  const { profile, loading, requireAuth } = useAuthGate();
  const permissions = useScanPermissions();
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView | null>(null);
  const analysisController = useRef<AbortController | null>(null);
  const mountedRef = useMountedRef();

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<ScanSource | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [takingPhoto, setTakingPhoto] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [faceStatus, setFaceStatus] = useState<FaceDetectionStatus>("no-face");

  useEffect(() => {
    return () => {
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
      setStatusMessage(
        "Camera preview is unavailable on this platform. Use gallery upload instead.",
      );
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
    if (!ensureSignedIn()) return;
    const permissionOk = await ensureCameraPermission();
    if (!permissionOk) return;

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
      if (!mountedRef.current) return;
      setPreviewUri(picture.uri);
      setPreviewSource("camera");
    } catch (error) {
      console.warn("Camera capture failed", error);
      if (mountedRef.current) {
        setStatusMessage("We couldn't take that photo. Adjust lighting and retry.");
      }
    } finally {
      if (mountedRef.current) setTakingPhoto(false);
    }
  }, [ensureCameraPermission, ensureSignedIn, mountedRef]);

  const handlePickImage = useCallback(async () => {
    setStatusMessage(null);
    if (!ensureSignedIn()) return;
    const permissionOk = await ensureMediaPermission();
    if (!permissionOk) return;

    setPickingImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!mountedRef.current) return;
      if (!result.canceled && result.assets.length > 0) {
        setPreviewUri(result.assets[0].uri);
        setPreviewSource("gallery");
      }
    } catch {
      if (mountedRef.current) {
        setStatusMessage("Unable to open your gallery right now.");
      }
    } finally {
      if (mountedRef.current) setPickingImage(false);
    }
  }, [ensureMediaPermission, ensureSignedIn, mountedRef]);

  const handleScan = useCallback(async () => {
    if (!previewUri || !previewSource) return;
    setStatusMessage(null);
    if (!ensureSignedIn()) return;

    setScanning(true);
    const controller = new AbortController();
    analysisController.current = controller;
    try {
      const result = await analyzeFaceImage(previewUri, controller.signal);
      if (!mountedRef.current) return;
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
      const message =
        error instanceof Error
          ? error.message
          : "Scan failed. Check your connection and try again.";
      if (mountedRef.current) setStatusMessage(message);
    } finally {
      analysisController.current = null;
      if (mountedRef.current) setScanning(false);
    }
  }, [ensureSignedIn, previewSource, previewUri, router, mountedRef]);

  const handleReset = useCallback(() => {
    setPreviewUri(null);
    setPreviewSource(null);
    setStatusMessage(null);
  }, []);

  const handleFaceDetectionStatus = useCallback((status: FaceDetectionStatus) => {
    setFaceStatus(status);
  }, []);

  const canCapture = faceStatus === "ready";

  return {
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
    requestCameraPermission: ensureCameraPermission,
  };
}
