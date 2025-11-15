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
  routine_markdown?: string | null;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_FACE_API_BASE_URL ?? "http://localhost:8000";

const BASE = API_BASE_URL.replace(/\/$/, "");
const START_TASK_ENDPOINT = `${BASE}/start-task`;
const TASKS_ENDPOINT = `${BASE}/tasks`;
const RECOMMEND_ENDPOINT = `${BASE}/recommend`;
const RECOMMEND_STREAM_ENDPOINT = `${BASE}/recommend/stream`;

export type RoutineIntake = {
  sensitivity?: "low" | "medium" | "high" | "unsure";
  pregnancy?: "yes" | "no" | "unsure";
  rx_topical?: "yes" | "no" | "unsure";
  allergies?: string[];
  current_actives?: string[];
  fitzpatrick?: string;
};

export type RoutineResponse = {
  task_id: string;
  stream_path: string;
};

export type RoutineStreamCallbacks = {
  onChunk: (markdown: string) => void;
  onDone: () => void;
  onError?: (error: Error) => void;
};

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
): Promise<RoutineResponse> {
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

  return (await response.json()) as RoutineResponse;
}

export async function subscribeToRoutineStream(
  taskId: string,
  callbacks: RoutineStreamCallbacks,
): Promise<() => void> {
  const token = await requireAccessToken();
  const url = `${RECOMMEND_STREAM_ENDPOINT}/${encodeURIComponent(taskId)}`;
  return openEventStream(url, token, callbacks);
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

function openEventStream(
  url: string,
  token: string,
  callbacks: RoutineStreamCallbacks,
) {
  const xhr = new XMLHttpRequest();
  let buffer = "";
  let closed = false;
  let processedLength = 0;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    try {
      xhr.abort();
    } catch {
      // Ignore abort errors
    }
  };

  const emitError = (message: string) => {
    callbacks.onError?.(new Error(message));
  };

  const handleChunk = (chunk: string) => {
    buffer += chunk.replace(/\r\n/g, "\n");
    let delimiterIndex;
    while ((delimiterIndex = buffer.indexOf("\n\n")) >= 0) {
      const rawEvent = buffer.slice(0, delimiterIndex);
      buffer = buffer.slice(delimiterIndex + 2);
      if (!rawEvent.trim()) {
        continue;
      }
      const dataLines = rawEvent
        .split("\n")
        .filter((line) => line.startsWith("data:"));
      if (!dataLines.length) {
        continue;
      }
      const payload = dataLines
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (!payload) {
        continue;
      }
      if (payload === "[DONE]") {
        callbacks.onDone();
        cleanup();
        return;
      }
      if (payload.startsWith("[ERROR]")) {
        const detail = payload.slice(7).trim() || "Routine stream reported an error.";
        const error = new Error(detail) as Error & { isRoutineStreamServerError?: boolean };
        error.name = "RoutineStreamServerError";
        error.isRoutineStreamServerError = true;
        callbacks.onError?.(error);
        cleanup();
        return;
      }
      callbacks.onChunk(payload);
    }
  };

  xhr.onreadystatechange = () => {
    if (closed) return;
    if (xhr.readyState >= 3) {
      const text = xhr.responseText ?? "";
      if (text.length > processedLength) {
        const chunk = text.slice(processedLength);
        processedLength = text.length;
        handleChunk(chunk);
      }
    }
    if (xhr.readyState === 4 && xhr.status >= 400) {
      emitError(`Stream failed with status ${xhr.status}`);
      cleanup();
    }
  };

  xhr.onerror = () => {
    if (closed) return;
    emitError("Stream connection error");
    cleanup();
  };

  xhr.open("GET", url, true);
  xhr.setRequestHeader("Accept", "text/event-stream");
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.send();

  return cleanup;
}
