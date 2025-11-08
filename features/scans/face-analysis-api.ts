import { Platform } from "react-native";

export type FaceAnalysisAttribute = {
  value: number;
  confidence: number;
};

export type SkinTypeBreakdown = {
  oily: number;
  dry: number;
  normal: number;
  mixed: number;
};

export type SkinTypeAttribute = FaceAnalysisAttribute & {
  details: SkinTypeBreakdown;
};

export interface FaceAnalysisResult {
  skin_type: SkinTypeAttribute;
  [attribute: string]: FaceAnalysisAttribute | SkinTypeAttribute;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_FACE_API_BASE_URL ?? "http://localhost:8000";

const ANALYZE_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/analyze`;

export async function analyzeFaceImage(
  imageUri: string,
  signal?: AbortSignal,
): Promise<FaceAnalysisResult> {
  const body = await buildFormData(imageUri, signal);

  const response = await fetch(ANALYZE_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body,
    signal,
  });

  if (!response.ok) {
    let detail = "Scan failed. Please try again.";
    try {
      const payload = await response.json();
      if (payload?.detail) {
        detail = payload.detail;
      }
    } catch {
      // ignore JSON parse failures and fall back to default detail
    }
    throw new Error(detail);
  }

  const result = (await response.json()) as FaceAnalysisResult;
  return result;
}

async function buildFormData(imageUri: string, signal?: AbortSignal) {
  const form = new FormData();
  const fileName = inferFileName(imageUri);
  const mimeType = inferMimeType(fileName);

  if (Platform.OS === "web") {
    const blobResponse = await fetch(imageUri, { signal });
    const blob = await blobResponse.blob();
    const file = new File([blob], fileName, {
      type: blob.type || mimeType,
    });
    form.append("image", file);
  } else {
    form.append("image", {
      uri: imageUri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
  }

  return form;
}

function inferFileName(uri: string) {
  const segments = uri.split(/[\\/]/).filter(Boolean);
  const last = segments[segments.length - 1];
  if (last) {
    return last.includes(".") ? last : `${last}.jpg`;
  }
  return `facefit_${Date.now()}.jpg`;
}

function inferMimeType(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "png":
      return "image/png";
    case "heic":
    case "heif":
      return "image/heic";
    case "webp":
      return "image/webp";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}
