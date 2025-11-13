import { Platform } from "react-native";

export type FaceAnalysisTaskStatus =
  | "queued"
  | "global_profile_complete"
  | "texture_complete"
  | "pigmentation_complete"
  | "acne_complete"
  | "aging_complete"
  | "completed"
  | "failed";

export interface FaceAnalysisResult {
  global_profile?: {
    skin_type?: {
      label: string;
      confidence: number;
      details?: {
        oily?: number;
        dry?: number;
        normal?: number;
        mixed?: number;
      };
    };
    skin_tone?: {
      lightness?: string;
      undertone?: string;
    };
    skin_age?: {
      estimated_age?: number;
      relative_to_real_age?: string;
    };
    scores?: Record<string, number>;
    summary_description?: string;
  };
  issues?: Record<
    string,
    Array<{
      region: string;
      intensity?: number;
      area?: number;
      description?: string;
    }>
  >;
}

export interface FaceAnalysisTaskResponse {
  task_id: string;
  status: FaceAnalysisTaskStatus;
  result: FaceAnalysisResult | null;
  error: string | null;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_FACE_API_BASE_URL ?? "http://localhost:8000";

const BASE = API_BASE_URL.replace(/\/$/, "");
const START_TASK_ENDPOINT = `${BASE}/start-task`;
const TASKS_ENDPOINT = `${BASE}/tasks`;

export async function startAnalysisTask(
  imageUri: string,
  signal?: AbortSignal,
): Promise<string> {
  const body = await buildFormData(imageUri, signal);
  const response = await fetch(START_TASK_ENDPOINT, {
    method: "POST",
    headers: { Accept: "application/json" },
    body,
    signal,
  });

  if (!response.ok) {
    const payload = await safeJson(response);
    const detail = payload?.detail ?? "Unable to start analysis";
    throw new Error(detail);
  }

  const payload = (await response.json()) as { task_id?: string };
  if (!payload.task_id) {
    throw new Error("Missing task id");
  }
  return payload.task_id;
}

export async function fetchTaskStatus(
  taskId: string,
  signal?: AbortSignal,
): Promise<FaceAnalysisTaskResponse> {
  const response = await fetch(`${TASKS_ENDPOINT}/${taskId}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    const payload = await safeJson(response);
    const detail = payload?.detail ?? "Unable to fetch task";
    throw new Error(detail);
  }

  return (await response.json()) as FaceAnalysisTaskResponse;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
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
