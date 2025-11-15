import type { FaceAnalysisResult } from "@/features/scans/face-analysis-api";
import type { FaceLandmarkMap, FaceLandmarkPoint } from "@/features/scans/landmark-points";

import type { IssueEntry, IssueSummary } from "./types";

export function toSingle(value?: string | string[] | null) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
}

export function decodeMaybe(value: string | null) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseJsonParam(raw: string | string[] | undefined) {
  const single = toSingle(raw);
  const decoded = decodeMaybe(single);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded) as FaceAnalysisResult;
  } catch {
    return null;
  }
}

export function parseLandmarksParam(raw: string | string[] | undefined) {
  const single = toSingle(raw);
  const decoded = decodeMaybe(single);
  if (!decoded) return null;
  try {
    const parsed = JSON.parse(decoded) as FaceLandmarkMap;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function buildIssueSummaries(issues?: FaceAnalysisResult["issues"]): IssueSummary[] {
  if (!issues) return [];
  return Object.entries(issues)
    .map(([key, entries]) => {
      if (!entries || !entries.length) return null;
      const normalized = entries
        .filter((entry): entry is IssueEntry => Boolean(entry))
        .map((entry) => ({
          region: entry.region ?? key,
          intensity: typeof entry.intensity === "number" ? entry.intensity : undefined,
          area: entry.area,
          description: entry.description,
        }));
      if (!normalized.length) {
        return null;
      }
      const average =
        normalized.reduce((sum, entry) => sum + (entry.intensity ?? 0), 0) / normalized.length;
      return {
        key,
        label: formatIssueLabel(key),
        averageIntensity: Number.isFinite(average) ? average : 0,
        entries: normalized,
      } satisfies IssueSummary;
    })
    .filter(Boolean)
    .sort((a, b) => b!.averageIntensity - a!.averageIntensity) as IssueSummary[];
}

type MarkerComputationInput = {
  region?: string | null;
  seed: number;
  landmarks: FaceLandmarkMap | null;
  imageSize: { width: number; height: number } | null;
};

export function computeMarkerCoords({
  region,
  seed,
  landmarks,
  imageSize,
}: MarkerComputationInput) {
  const point = findLandmarkPoint(region, landmarks);
  if (point && imageSize?.width && imageSize.height) {
    const normalized = {
      x: clamp(point.x / imageSize.width, 0, 1),
      y: clamp(point.y / imageSize.height, 0, 1),
    };
    return { normalized, raw: point };
  }
  const fallback = resolveRegionPoint(region ?? undefined, seed);
  return { normalized: fallback, raw: null };
}

function findLandmarkPoint(
  region: string | null | undefined,
  landmarks: FaceLandmarkMap | null,
): FaceLandmarkPoint | null {
  if (!landmarks) return null;
  const normalized = normalizeRegionKey(region);
  if (!normalized) return null;
  if (normalized in landmarks) {
    return landmarks[normalized as keyof FaceLandmarkMap];
  }
  const alias = REGION_ALIASES[normalized];
  if (alias && alias in landmarks) {
    return landmarks[alias];
  }
  return null;
}

function resolveRegionPoint(region: string | undefined, seed: number) {
  const normalizedRegion = normalizeRegionKey(region);
  if (normalizedRegion) {
    const anchor = REGION_ANCHORS[normalizedRegion];
    if (anchor) {
      return anchor;
    }
  }

  const hash = hashString(normalizedRegion ?? String(seed));
  const x = 0.25 + ((hash % 50) / 100);
  const y = 0.25 + (((hash >> 3) % 50) / 100);
  return { x: clamp(x, 0.15, 0.85), y: clamp(y, 0.15, 0.9) };
}

const REGION_ANCHORS: Record<string, { x: number; y: number }> = {
  forehead: { x: 0.5, y: 0.18 },
  foreheadcenter: { x: 0.5, y: 0.2 },
  foreheadleft: { x: 0.35, y: 0.22 },
  foreheadright: { x: 0.65, y: 0.22 },
  templeleft: { x: 0.25, y: 0.28 },
  templeright: { x: 0.75, y: 0.28 },
  eyeleft: { x: 0.38, y: 0.32 },
  eyeright: { x: 0.62, y: 0.32 },
  undereyeleft: { x: 0.38, y: 0.4 },
  undereyeright: { x: 0.62, y: 0.4 },
  nosebridge: { x: 0.5, y: 0.45 },
  nosebase: { x: 0.5, y: 0.55 },
  cheekleft: { x: 0.32, y: 0.6 },
  cheekright: { x: 0.68, y: 0.6 },
  jawleft: { x: 0.28, y: 0.78 },
  jawright: { x: 0.72, y: 0.78 },
  chin: { x: 0.5, y: 0.86 },
  mouthleft: { x: 0.42, y: 0.7 },
  mouthright: { x: 0.58, y: 0.7 },
  upperlip: { x: 0.5, y: 0.64 },
  lowerlip: { x: 0.5, y: 0.72 },
  nasolabial: { x: 0.55, y: 0.62 },
};

const REGION_ALIASES: Record<string, keyof FaceLandmarkMap> = {
  nose: "nose_base",
  nosebase: "nose_base",
  nose_bridge: "nose_base",
  leftcheek: "left_cheek_pores",
  left_cheek: "left_cheek_pores",
  rightcheek: "right_cheek_pores",
  right_cheek: "right_cheek_pores",
  lefteye: "eye_left",
  left_eye: "eye_left",
  righteye: "eye_right",
  right_eye: "eye_right",
};

export function intensityToColor(value: number) {
  const clamped = clamp(value, 0, 1);
  if (clamped <= 0.5) {
    const ratio = clamped / 0.5;
    return mixColors("#2ECC71", "#F1C40F", ratio);
  }
  const ratio = (clamped - 0.5) / 0.5;
  return mixColors("#F1C40F", "#E74C3C", ratio);
}

function mixColors(start: string, end: string, ratio: number) {
  const sr = parseInt(start.slice(1, 3), 16);
  const sg = parseInt(start.slice(3, 5), 16);
  const sb = parseInt(start.slice(5, 7), 16);
  const er = parseInt(end.slice(1, 3), 16);
  const eg = parseInt(end.slice(3, 5), 16);
  const eb = parseInt(end.slice(5, 7), 16);
  const r = Math.round(sr + (er - sr) * ratio);
  const g = Math.round(sg + (eg - sg) * ratio);
  const b = Math.round(sb + (eb - sb) * ratio);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function toHex(value: number) {
  return value.toString(16).padStart(2, "0");
}

export function normalizeRegionKey(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const camelSeparated = trimmed.replace(/([a-z0-9])([A-Z])/g, "$1_$2");
  const normalized = camelSeparated
    .replace(/[^a-z0-9_\s-]/gi, "")
    .replace(/[\s-]+/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
  return normalized || null;
}

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatIssueLabel(key: string) {
  return key
    .split("_")
    .map((part) => capitalize(part))
    .join(" ");
}

export function formatRegionLabel(region: string) {
  if (!region) return "Region";
  return region
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((part) => capitalize(part.toLowerCase()))
    .join(" ");
}
