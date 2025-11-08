import type { FaceAnalysisResult } from "@/features/scans/face-analysis-api";

export type AnalysisPayload =
  | { kind: "structured"; data: FaceAnalysisResult }
  | { kind: "text"; data: string };

export function encodeAnalysisPayload(payload: AnalysisPayload) {
  return encodeURIComponent(JSON.stringify(payload));
}

export function decodeAnalysisPayload(raw: string | null | undefined) {
  if (!raw) {
    return null;
  }

  try {
    const decoded = safeDecodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as AnalysisPayload;
    if (
      parsed &&
      typeof parsed === "object" &&
      ("kind" in parsed && "data" in parsed)
    ) {
      return parsed;
    }
    return { kind: "text", data: decoded };
  } catch {
    const decoded = safeDecodeURIComponent(raw);
    return { kind: "text", data: decoded };
  }
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
