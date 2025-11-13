import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image as RNImage,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import {
  fetchTaskStatus,
  type FaceAnalysisResult,
  type FaceAnalysisTaskStatus,
} from "@/features/scans/face-analysis-api";
import {
  saveScan,
  type ScanSource,
  type StoredFaceAnalysis,
} from "@/features/scans/scan-store";
import { useSettings } from "@/features/settings/settings-store";
import type {
  FaceLandmarkId,
  FaceLandmarkMap,
  FaceLandmarkPoint,
} from "@/features/scans/landmark-points";
import { PrimaryButton } from "@/lib/ui/facefit-components";

import {
  FaceIssueOverlay,
  type IssueMarker,
} from "./result/components/FaceIssueOverlay";

type Params = {
  taskId?: string | string[];
  imageUri?: string | string[];
  source?: string | string[];
  readonly?: string | string[];
  initialResult?: string | string[];
  initialText?: string | string[];
  landmarks?: string | string[];
};

type IssueEntry = {
  region: string;
  intensity?: number;
  area?: number;
  description?: string;
};

type IssueSummary = {
  key: string;
  label: string;
  averageIntensity: number;
  entries: IssueEntry[];
};

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const { settings } = useSettings();
  const { height: screenHeight } = useWindowDimensions();

  const taskId = toSingle(params.taskId);
  const encodedImageUri = toSingle(params.imageUri);
  const decodedImageUri = useMemo(() => decodeMaybe(encodedImageUri), [encodedImageUri]);
  const sourceParam = toSingle(params.source);
  const source: ScanSource | null =
    sourceParam === "camera" || sourceParam === "gallery" ? sourceParam : null;
  const readOnly = toSingle(params.readonly) === "true";
  const initialStructured = useMemo(() => parseJsonParam(params.initialResult), [params.initialResult]);
  const initialText = useMemo(() => decodeMaybe(toSingle(params.initialText)), [params.initialText]);
  const landmarksParam = toSingle(params.landmarks);
  const landmarks = useMemo(() => parseLandmarksParam(landmarksParam), [landmarksParam]);

  const [status, setStatus] = useState<FaceAnalysisTaskStatus | null>(taskId ? "queued" : null);
  const [result, setResult] = useState<FaceAnalysisResult | null>(initialStructured);
  const [textResult, setTextResult] = useState<string | null>(initialText ?? null);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const hasLoggedRef = useRef(false);

  const issuesSummary = useMemo(() => buildIssueSummaries(result?.issues), [result]);
  const selectedIssue = useMemo(() => {
    if (!issuesSummary.length) return null;
    const match = issuesSummary.find((issue) => issue.key === selectedIssueKey);
    return match ?? issuesSummary[0] ?? null;
  }, [issuesSummary, selectedIssueKey]);

  useEffect(() => {
    if (!landmarks) return;
    try {
      console.log("[Result] landmarks", JSON.stringify(landmarks));
    } catch {
      console.log("[Result] landmarks", landmarks);
    }
  }, [landmarks]);

  useEffect(() => {
    if (!issuesSummary.length) {
      setSelectedIssueKey(null);
      return;
    }
    if (!selectedIssueKey || !issuesSummary.some((issue) => issue.key === selectedIssueKey)) {
      setSelectedIssueKey(issuesSummary[0].key);
    }
  }, [issuesSummary, selectedIssueKey]);

  useEffect(() => {
    if (!decodedImageUri) {
      setImageSize(null);
      return;
    }
    RNImage.getSize(
      decodedImageUri,
      (width, height) => setImageSize({ width, height }),
      () => setImageSize(null),
    );
  }, [decodedImageUri]);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const payload = await fetchTaskStatus(taskId);
        if (cancelled) return;
        setStatus(payload.status);
        if (payload.result) {
          setResult(payload.result);
          setTextResult(null);
        }
        if (payload.status === "completed") {
          if (!hasLoggedRef.current) {
            console.log("[FaceAnalysis] task completed", payload);
            hasLoggedRef.current = true;
          }
          setError(null);
          return;
        }
        if (payload.status === "failed") {
          setError(payload.error ?? "Task failed. Try again.");
          return;
        }
        timer = setTimeout(poll, 5000);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unable to fetch task.";
        setError(message);
        timer = setTimeout(poll, 5000);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [taskId]);

  useEffect(() => {
    if (readOnly) return;
    if (!decodedImageUri || !source) return;
    if (!result || status !== "completed") return;
    if (autoSaveStatus !== "idle") return;

    setAutoSaveStatus("saving");
    const faceAnalysis: StoredFaceAnalysis = { kind: "structured", data: result };
    saveScan({
      tempImageUri: decodedImageUri,
      faceAnalysis,
      retentionDays: settings.autoDeleteDays,
      source,
    })
      .then(() => {
        setAutoSaveStatus("saved");
      })
      .catch(() => {
        setAutoSaveStatus("error");
      });
  }, [autoSaveStatus, decodedImageUri, readOnly, result, settings.autoDeleteDays, source, status]);

  const heroHeight = Math.max(screenHeight * 0.75, 480);
  const markers: IssueMarker[] = useMemo(() => {
    if (!selectedIssue) return [];
    return selectedIssue.entries.map((entry, index) => {
      const intensity = entry.intensity ?? selectedIssue.averageIntensity ?? 0;
      const { normalized, raw } = computeMarkerCoords({
        region: entry.region,
        seed: index,
        landmarks,
        imageSize,
      });
      return {
        id: `${selectedIssue.key}-${index}`,
        x: normalized.x,
        y: normalized.y,
        color: intensityToColor(intensity),
        region: entry.region,
        rawX: raw?.x ?? null,
        rawY: raw?.y ?? null,
      } satisfies IssueMarker;
    });
  }, [imageSize, landmarks, selectedIssue]);

  useEffect(() => {
    if (!selectedIssue || !markers.length) return;
    console.log("[Result] issue markers", selectedIssue.key, "total", markers.length);
    markers.forEach((marker, index) => {
      const payload = {
        index,
        region: marker.region ?? null,
        rawX: marker.rawX ?? null,
        rawY: marker.rawY ?? null,
        normalizedX: Number(marker.x.toFixed(4)),
        normalizedY: Number(marker.y.toFixed(4)),
      };
      console.log("[Result] marker", payload);
    });
  }, [markers, selectedIssue?.key]);

  if (!taskId && !result && !textResult) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>No task in progress</Text>
          <Text style={styles.subtitle}>Start a new scan to see updates here.</Text>
          <PrimaryButton label="Back to Scan" onPress={() => router.replace("/(tabs)/scan")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Analysis Status</Text>
          <View style={styles.card}>
            <Text style={styles.statusText}>{`Status: ${status ?? "pending"}`}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {!readOnly && autoSaveStatus === "error" ? (
              <Text style={styles.error}>Unable to save locally.</Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.section, { paddingBottom: 8 }]}>
          <Text style={styles.sectionHeading}>Snapshot</Text>
          <View style={{ width: "100%" }}>
            <FaceIssueOverlay imageUri={decodedImageUri} height={heroHeight * 0.8} markers={markers} />
            <View style={[styles.issueCarousel, { minHeight: heroHeight * 0.2 }] }>
              {issuesSummary.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.issueCarouselContent}>
                  {issuesSummary.map((issue) => (
                    <TouchableOpacity
                      key={issue.key}
                      style={[styles.issueCircle, issue.key === selectedIssue?.key ? styles.issueCircleActive : null]}
                      onPress={() => setSelectedIssueKey(issue.key)}
                    >
                      <View style={[styles.issueCircleInner, { backgroundColor: intensityToColor(issue.averageIntensity) }] }>
                        <Text
                          style={[
                            styles.issueCircleValue,
                            issue.averageIntensity > 0.6 ? styles.issueCircleValueOnDark : null,
                          ]}
                        >
                          {Math.round(clamp(issue.averageIntensity, 0, 1) * 100)}
                        </Text>
                      </View>
                      <Text style={styles.issueCircleLabel}>{issue.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyIssues}>
                  <Text style={styles.subtitle}>Gathering issue data…</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {textResult ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Summary</Text>
            <View style={styles.card}>
              <Text style={styles.bodyText}>{textResult}</Text>
            </View>
          </View>
        ) : null}

        {result?.global_profile ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Global Overview</Text>
            <GlobalProfile profile={result.global_profile} />
          </View>
        ) : null}

        {issuesSummary.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Issue Details</Text>
            {issuesSummary.map((issue) => (
              <IssueDetailCard key={issue.key} issue={issue} isActive={issue.key === selectedIssue?.key} />
            ))}
          </View>
        ) : null}

        <PrimaryButton label="Back to Scan" onPress={() => router.replace("/(tabs)/scan")} />
      </ScrollView>
    </SafeAreaView>
  );
}

function GlobalProfile({ profile }: { profile: NonNullable<FaceAnalysisResult["global_profile"]> }) {
  const entries: Array<{ label: string; value: string }> = [];
  if (profile.skin_type?.label) {
    entries.push({ label: "Skin type", value: capitalize(profile.skin_type.label) });
  }
  if (profile.skin_tone?.lightness || profile.skin_tone?.undertone) {
    const toneParts = [profile.skin_tone.lightness, profile.skin_tone.undertone].filter(Boolean);
    entries.push({ label: "Skin tone", value: toneParts.join(" · ") });
  }
  if (profile.skin_age?.estimated_age) {
    const relative = profile.skin_age.relative_to_real_age
      ? ` (${profile.skin_age.relative_to_real_age})`
      : "";
    entries.push({ label: "Skin age", value: `${profile.skin_age.estimated_age}${relative}` });
  }

  return (
    <View style={styles.card}>
      {profile.summary_description ? (
        <Text style={[styles.bodyText, { marginBottom: 16 }]}>{profile.summary_description}</Text>
      ) : null}
      <View style={styles.profileGrid}>
        {entries.map((entry) => (
          <View key={entry.label} style={styles.profileItem}>
            <Text style={styles.profileLabel}>{entry.label}</Text>
            <Text style={styles.profileValue}>{entry.value}</Text>
          </View>
        ))}
      </View>
      {profile.scores ? (
        <View style={styles.scoreRow}>
          {Object.entries(profile.scores).map(([key, value]) => (
            <View key={key} style={styles.scoreChip}>
              <Text style={styles.scoreLabel}>{formatIssueLabel(key)}</Text>
              <Text style={styles.scoreValue}>{Math.round(value)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function IssueDetailCard({
  issue,
  isActive,
}: {
  issue: IssueSummary;
  isActive: boolean;
}) {
  const averagePercent = Math.round(clamp(issue.averageIntensity, 0, 1) * 100);
  return (
    <View style={[styles.card, { borderColor: isActive ? "#F18A1B" : "transparent", borderWidth: 1 }] }>
      <Text style={styles.issueTitle}>{issue.label}</Text>
      <Text style={styles.issueIntensity}>{`Average intensity ${averagePercent} / 100`}</Text>
      {issue.entries.map((entry, index) => (
        <View key={`${issue.key}-${index}`} style={styles.issueEntry}>
          <Text style={styles.entryRegion}>{formatRegionLabel(entry.region)}</Text>
          {typeof entry.intensity === "number" ? (
            <Text style={styles.entryMeta}>{`Intensity ${Math.round(
              clamp(entry.intensity, 0, 1) * 100,
            )}%`}</Text>
          ) : null}
          {entry.description ? (
            <Text style={styles.entryDescription}>{entry.description}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

type MarkerComputationInput = {
  region?: string | null;
  seed: number;
  landmarks: FaceLandmarkMap | null;
  imageSize: { width: number; height: number } | null;
};

function computeMarkerCoords({
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

function buildIssueSummaries(issues?: FaceAnalysisResult["issues"]): IssueSummary[] {
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
        normalized.reduce((sum, entry) => sum + (entry.intensity ?? 0), 0) /
        normalized.length;
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

function intensityToColor(value: number) {
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

function normalizeRegionKey(value?: string | null) {
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatIssueLabel(key: string) {
  return key
    .split("_")
    .map((part) => capitalize(part))
    .join(" ");
}

function formatRegionLabel(region: string) {
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

function toSingle(value?: string | string[] | null) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
}

function decodeMaybe(value: string | null) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseJsonParam(raw: string | string[] | undefined) {
  const single = toSingle(raw);
  const decoded = decodeMaybe(single);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded) as FaceAnalysisResult;
  } catch {
    return null;
  }
}

function parseLandmarksParam(raw: string | string[] | undefined) {
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  scrollContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  section: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0A0A0A",
  },
  error: {
    color: "#C03515",
    fontSize: 14,
  },
  issueCarousel: {
    marginTop: 12,
  },
  issueCarouselContent: {
    gap: 12,
    alignItems: "flex-start",
  },
  issueCircle: {
    width: 96,
    alignItems: "center",
    gap: 6,
  },
  issueCircleActive: {
    transform: [{ scale: 1.05 }],
  },
  issueCircleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  issueCircleValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0A0A0A",
  },
  issueCircleValueOnDark: {
    color: "#FFFFFF",
  },
  issueCircleLabel: {
    fontSize: 12,
    textAlign: "center",
    color: "#333333",
  },
  emptyIssues: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 12,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#2A2A2A",
  },
  profileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  profileItem: {
    width: "45%",
    gap: 4,
  },
  profileLabel: {
    fontSize: 12,
    color: "#7A7A7A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  profileValue: {
    fontSize: 16,
    color: "#0A0A0A",
    fontWeight: "500",
  },
  scoreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  scoreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F0F0F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scoreLabel: {
    fontSize: 12,
    color: "#555",
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  issueTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  issueIntensity: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  issueEntry: {
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ECECEC",
    paddingTop: 12,
    gap: 4,
  },
  entryRegion: {
    fontSize: 15,
    fontWeight: "500",
    color: "#0A0A0A",
  },
  entryMeta: {
    fontSize: 13,
    color: "#6B6B6B",
  },
  entryDescription: {
    fontSize: 14,
    color: "#3A3A3A",
    lineHeight: 20,
  },
});
