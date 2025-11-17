import { Platform } from "react-native";

import { supabase } from "@/features/auth/supabase-client";

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
    {
      region: string;
      intensity?: number;
      area?: number;
      description?: string;
    }[]
  >;
}

export interface FaceAnalysisTaskResponse {
  task_id: string;
  status: FaceAnalysisTaskStatus;
  result: FaceAnalysisResult | null;
  error: string | null;
  routine_json?: Record<string, unknown> | null;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_FACE_API_BASE_URL ?? "http://localhost:8000";

const BASE = API_BASE_URL.replace(/\/$/, "");
const START_TASK_ENDPOINT = `${BASE}/start-task`;
const TASKS_ENDPOINT = `${BASE}/tasks`;
const RECOMMEND_ENDPOINT = `${BASE}/recommend`;

export type RoutineIntake = {
  sensitivity?: "low" | "medium" | "high" | "unsure";
  pregnancy?: "yes" | "no" | "prefer_not_to_say";
  rx_topical?: "yes" | "no" | "unsure";
  allergies?: string[];
  current_actives?: string[];
  fitzpatrick?: string;
  country?: string;
  budget_preference?: string;
};

export interface RoutineInstruction {
  how: string;
  frequency: string;
  timing: string;
}

export type RoutineStepType =
  | "cleanser"
  | "active"
  | "moisturizer"
  | "sunscreen"
  | "refresh"
  | "other";

export interface RoutineProduct {
  id: string | null;
  brand: string;
  name: string;
  tier: "budget" | "mid" | "premium";
  url: string;
  why: string;
}

export interface RoutineStep {
  type: RoutineStepType | string;
  instructions: RoutineInstruction;
  products: RoutineProduct[];
}

export interface RoutineSection {
  am?: RoutineStep[];
  midday?: RoutineStep[];
  pm?: RoutineStep[];
  [key: string]: RoutineStep[] | undefined;
}

export interface RoutineConcern {
  key: string;
  severity: "mild" | "moderate" | "severe";
  why: string;
}

export interface RoutineReasons {
  prioritized_concerns: RoutineConcern[];
  notes?: string;
}

export interface RoutineLifestyle {
  sleep?: string;
  stress?: string;
  sun?: string;
  habits?: string;
  routine_hygiene?: string;
  diet?: {
    increase?: string[];
    limit?: string[];
    supplements?: string[];
  };
}

export interface RoutineRichText {
  id: string;
  text: string;
  spans?: { start: number; end: number; ref_product_id: string }[];
}

export interface RoutineRecommendationResponse {
  task_id: string;
  poll_path: string;
}

export interface RoutineRecommendationResult {
  task_id: string;
  ready: boolean;
  intake?: RoutineIntake;
  routine?: RoutineSection | null;
  reasons?: RoutineReasons | null;
  warnings?: string[];
  lifestyle?: RoutineLifestyle | null;
  rich_text?: RoutineRichText[];
  error?: string | null;
}

export async function startAnalysisTask(
  imageUri: string,
  signal?: AbortSignal,
  realAge?: number,
): Promise<string> {
  const body = await buildFormData(imageUri, signal);
  if (typeof realAge === "number" && Number.isFinite(realAge)) {
    body.append("real_age", String(Math.round(realAge)));
  }
  const token = await requireAccessToken();
  const response = await fetch(START_TASK_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
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
  const token = await requireAccessToken();
  const response = await fetch(`${TASKS_ENDPOINT}/${taskId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!response.ok) {
    const payload = await safeJson(response);
    const detail = payload?.detail ?? "Unable to fetch task";
    throw new Error(detail);
  }

  return (await response.json()) as FaceAnalysisTaskResponse;
}

export async function listRecentTasks(limit = 10) {
  const token = await requireAccessToken();
  const url = `${TASKS_ENDPOINT}?limit=${encodeURIComponent(String(limit))}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const payload = await safeJson(response);
    console.log("Payload", payload);
    const detail = payload?.detail ?? "Unable to fetch tasks";
    throw new Error(detail);
  }
  const result = await response.json();
  console.log("List recent tasks response", result);
  return result as FaceAnalysisTaskResponse[];
}

export async function requestRoutineRecommendation(
  taskId: string,
  intake: RoutineIntake,
): Promise<RoutineRecommendationResponse> {
  const token = await requireAccessToken();
  const response = await fetch(RECOMMEND_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ task_id: taskId, intake }),
  });

  if (response.status !== 202 && !response.ok) {
    const payload = await safeJson(response);
    const detail = payload?.detail ?? "Unable to request routine";
    throw new Error(detail);
  }

  return (await response.json()) as RoutineRecommendationResponse;
}

export async function fetchRoutineRecommendationResult(
  taskId: string,
  signal?: AbortSignal,
): Promise<RoutineRecommendationResult> {
  const token = await requireAccessToken();
  const response = await fetch(`${RECOMMEND_ENDPOINT}/${encodeURIComponent(taskId)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!response.ok) {
    const payload = await safeJson(response);
    const detail = payload?.detail ?? "Unable to fetch routine";
    throw new Error(detail);
  }

  return (await response.json()) as RoutineRecommendationResult;
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

async function requireAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn("Failed to read Supabase session", error);
  }
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("You need to sign in again before scanning.");
  }
  return token;
}
