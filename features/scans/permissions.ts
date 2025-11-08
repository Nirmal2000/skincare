import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import {
  type PermissionResponse,
  useCameraPermissions,
} from "react-native-face-detector-camera";
import type { PermissionStatus } from "expo-modules-core";
import * as ImagePicker from "expo-image-picker";

export type PermissionState =
  | (Pick<PermissionResponse, "granted" | "canAskAgain" | "status"> & {
      status: PermissionStatus;
    })
  | {
      granted: boolean;
      canAskAgain: boolean;
      status: "unknown" | "unavailable";
    };

function normalizePermission(
  response?: PermissionResponse | ImagePicker.PermissionResponse | null,
): PermissionState {
  if (!response) {
    return { granted: false, canAskAgain: true, status: "unknown" };
  }

  return {
    granted: response.granted,
    canAskAgain: response.canAskAgain,
    status: response.status,
  } as PermissionState;
}

export function useScanPermissions() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, setMediaPermission] =
    useState<ImagePicker.PermissionResponse | null>(null);
  const [mediaLoading, setMediaLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    ImagePicker.getMediaLibraryPermissionsAsync()
      .then((response) => {
        if (!mounted) return;
        setMediaPermission(response);
      })
      .finally(() => {
        if (mounted) {
          setMediaLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const askCamera = useCallback(async () => {
    const response = await requestCameraPermission();
    return response;
  }, [requestCameraPermission]);

  const askMedia = useCallback(async () => {
    setMediaLoading(true);
    try {
      const response = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setMediaPermission(response);
      return response;
    } finally {
      setMediaLoading(false);
    }
  }, []);

  const cameraState = useMemo(() => {
    if (Platform.OS === "web") {
      return { granted: false, canAskAgain: false, status: "unavailable" } as PermissionState;
    }
    return normalizePermission(cameraPermission);
  }, [cameraPermission]);

  const mediaState = useMemo(
    () => normalizePermission(mediaPermission),
    [mediaPermission],
  );

  const cameraReady = Platform.OS === "web" ? true : Boolean(cameraPermission);

  return {
    camera: cameraState,
    media: mediaState,
    requestCameraPermission: askCamera,
    requestMediaPermission: askMedia,
    mediaLoading,
    cameraSupported: Platform.OS !== "web",
    ready: cameraReady && !mediaLoading,
  };
}
