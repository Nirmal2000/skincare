import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image as RNImage,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTabBarAutoHideScrollHandler } from "@/features/navigation/tab-bar-visibility";
import {
  fetchTaskStatus,
  requestRoutineRecommendation,
  type FaceAnalysisResult,
  type FaceAnalysisTaskResponse,
  type FaceAnalysisTaskStatus,
} from "@/features/scans/face-analysis-api";
import { unmarkTaskPending } from "@/features/scans/pending-task-store";
import { useRoutineIntake, type RoutineIntakeAnswers } from "@/features/scans/routine-intake-store";
import { deleteScan, type ScanSource } from "@/features/scans/scan-store";
import { PrimaryButton } from "@/lib/ui/facefit-components";

import {
  FaceIssueOverlay,
  type IssueMarker,
} from "./components/FaceIssueOverlay";
import { GlobalProfile } from "./components/GlobalProfile";
import { IssueDetailCard } from "./components/IssueDetailCard";
import { convertAnswersToPayload } from "./components/RoutineIntakeForm";
import { resultStyles as styles } from "./styles";
import {
  buildIssueSummaries,
  clamp,
  computeMarkerCoords,
  decodeMaybe,
  intensityToColor,
  parseLandmarksParam,
  toSingle,
} from "./utils";

function extractFailureToken(message: string | null | undefined) {
  if (!message) return null;
  const match = message.match(/\[ERROR\]\s*([A-Za-z0-9_-]+)/);
  return match?.[1] ?? null;
}

type Params = {
  taskId?: string | string[];
  imageUri?: string | string[];
  source?: string | string[];
  landmarks?: string | string[];
};

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const { height: screenHeight } = useWindowDimensions();
  const scrollHandler = useTabBarAutoHideScrollHandler();
  const insets = useSafeAreaInsets();

  const taskId = toSingle(params.taskId);
  const encodedImageUri = toSingle(params.imageUri);
  const decodedImageUri = useMemo(() => decodeMaybe(encodedImageUri), [encodedImageUri]);
  const sourceParam = toSingle(params.source);
  const source: ScanSource | null =
    sourceParam === "camera" || sourceParam === "gallery" ? sourceParam : null;
  const landmarksParam = toSingle(params.landmarks);
  const landmarks = useMemo(() => parseLandmarksParam(landmarksParam), [landmarksParam]);

  const [status, setStatus] = useState<FaceAnalysisTaskStatus | null>(null);
  const [result, setResult] = useState<FaceAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskPayload, setTaskPayload] = useState<FaceAnalysisTaskResponse | null>(null);
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [routineStatus, setRoutineStatus] = useState<
    "idle" | "requesting" | "polling" | "done" | "error"
  >("idle");
  const [routineError, setRoutineError] = useState<string | null>(null);

  const failureToken = useMemo(() => extractFailureToken(error), [error]);
  const {
    intake: storedIntake,
    completed: intakeCompleted,
    ready: intakeReady,
  } = useRoutineIntake();

  const hasLoggedRef = useRef(false);
  const routinePollControllerRef = useRef<AbortController | null>(null);
  const markdownTheme = useMemo(
    () => ({
      base: "light" as const,
      colors: {
        backgroundColor: "transparent",
        textColor: "#2A2A2A",
        mutedTextColor: "#6B6B6B",
        linkColor: "#F18A1B",
        quoteBorderColor: "#F18A1B",
      },
    }),
    [],
  );
  const issuesSummary = useMemo(() => buildIssueSummaries(result?.issues), [result]);
  const selectedIssue = useMemo(() => {
    if (!issuesSummary.length) return null;
    const match = issuesSummary.find((issue) => issue.key === selectedIssueKey);
    return match ?? issuesSummary[0] ?? null;
  }, [issuesSummary, selectedIssueKey]);

  const routineJson = taskPayload?.routine_json ?? null;

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
    routinePollControllerRef.current?.abort();
    setError(null);
    setSelectedIssueKey(null);
    setRoutineStatus("idle");
    setRoutineError(null);
    setStatus(null);
    setResult(null);
    setTaskPayload(null);
    hasLoggedRef.current = false;
    return () => {
      routinePollControllerRef.current?.abort();
    };
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const payload = await fetchTaskStatus(taskId);
        if (cancelled) return;
        setTaskPayload(payload);
        setStatus(payload.status);
        setResult(payload.result ?? null);
        setError(payload.error ?? null);
        if (payload.status === "completed" || payload.status === "failed") {
          if (payload.status === "completed" && !hasLoggedRef.current) {
            console.log("[FaceAnalysis] task completed", payload);
            hasLoggedRef.current = true;
          }
          await unmarkTaskPending(taskId).catch(() => null);
          return;
        }
        timer = setTimeout(poll, 1500);
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

  const handleFailureRetry = useCallback(async () => {
    if (!taskId) return;
    try {
      await deleteScan(taskId);
    } catch (scanError) {
      console.warn("Failed to delete scan after failure", scanError);
    }
    await unmarkTaskPending(taskId).catch(() => null);
    router.replace("/(tabs)/home");
  }, [router, taskId]);

  const pollRoutineJson = useCallback(async () => {
    if (!taskId) return;
    routinePollControllerRef.current?.abort();
    const controller = new AbortController();
    routinePollControllerRef.current = controller;
    setRoutineStatus("polling");
    setRoutineError(null);
    try {
      while (true) {
        const payload = await fetchTaskStatus(taskId, controller.signal);
        if (controller.signal.aborted) {
          return;
        }
        setTaskPayload(payload);
        setStatus(payload.status);
        setResult(payload.result ?? null);
        setError(payload.error ?? null);
        if (payload.error) {
          setRoutineStatus("error");
          setRoutineError(payload.error);
          return;
        }
        if (payload.routine_json) {
          setRoutineStatus("done");
          setRoutineError(null);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }
      const message = err instanceof Error ? err.message : "Unable to fetch routine.";
      setRoutineStatus("error");
      setRoutineError(message);
    } finally {
      if (routinePollControllerRef.current === controller) {
        routinePollControllerRef.current = null;
      }
    }
  }, [taskId]);

  const startRoutineWithAnswers = useCallback(
    async (answers: RoutineIntakeAnswers) => {
      if (!taskId) return false;
      if (routineStatus === "requesting" || routineStatus === "polling") {
        return false;
      }
      setRoutineStatus("requesting");
      setRoutineError(null);
      try {
        const payload = convertAnswersToPayload(answers);
        await requestRoutineRecommendation(taskId, payload);
        void pollRoutineJson();
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to request routine.";
        setRoutineStatus("error");
        setRoutineError(message);
        return false;
      }
    },
    [pollRoutineJson, routineStatus, taskId],
  );
  const handleOpenRoutine = useCallback(async () => {
    if (!taskId || status !== "completed") return;
    const needsIntake = !routineJson;
    if (needsIntake && (!intakeReady || !intakeCompleted)) return;
    if (needsIntake) {
      const started = await startRoutineWithAnswers(storedIntake);
      if (!started) return;
    }
    const params: Record<string, string> = { taskId };
    if (!routineJson) {
      params.routineRequested = "true";
    }
    router.push({
      pathname: "/(tabs)/result/routine",
      params,
    });
  }, [
    intakeCompleted,
    intakeReady,
    router,
    routineJson,
    startRoutineWithAnswers,
    status,
    storedIntake,
    taskId,
  ]);

  const handleFillPreferences = useCallback(() => {
    const base = "/welcome?returnTo=result";
    const path = taskId ? `${base}&taskId=${encodeURIComponent(taskId)}` : base;
    router.push(path);
  }, [router, taskId]);

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

  const needsIntake = !routineJson;
  const routineButtonDisabled =
    !taskId ||
    status !== "completed" ||
    routineStatus === "requesting" ||
    routineStatus === "polling" ||
    (needsIntake && (!intakeCompleted || !intakeReady));

  const routineButtonLabel = (() => {
    if (!routineJson) {
      if (routineStatus === "requesting") return "Summoning your glow ritual...";
      if (routineStatus === "polling") return "Fetching your routine...";
      return "Get routine";
    }
    return "See routine";
  })();

  const isAnalyzing = !status || (status !== "completed" && status !== "failed");

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

  if (!taskId) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>No task in progress</Text>
          <Text style={styles.subtitle}>Start a new scan to see updates here.</Text>
          <PrimaryButton label="Back to Scan" onPress={() => router.replace("/(tabs)/scan")} />
        </View>
      </View>
    );
  }

  if (status === "failed" && !!failureToken) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>We couldn't finish that scan</Text>
          <Text style={styles.subtitle}>
            Something glitched on our side. Please start over and we'll try again.
          </Text>
          <PrimaryButton label="Try again" onPress={handleFailureRetry} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={[styles.section, styles.heroSection, { paddingBottom: 8 }]}>
          <FaceIssueOverlay
            imageUri={decodedImageUri}
            height={heroHeight * 0.8}
            markers={markers}
            activeIssueKey={selectedIssue?.key ?? null}
          />
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

        {result?.global_profile ? (
          <View style={styles.section}>
            <GlobalProfile profile={result.global_profile} />
          </View>
        ) : null}

        {issuesSummary.length ? (
          <View style={styles.section}>
            {issuesSummary.map((issue) => (
              <IssueDetailCard key={issue.key} issue={issue} isActive={issue.key === selectedIssue?.key} />
            ))}
          </View>
        ) : null}

        {status === "completed" ? (
          <View style={styles.section}>
            {routineError ? (
              <Text style={[styles.error, styles.cardDescriptionCentered, styles.cardFullWidth]}>
                {routineError}
              </Text>
            ) : null}
            <PrimaryButton
              label={routineButtonLabel}
              onPress={handleOpenRoutine}
              disabled={routineButtonDisabled}
              style={[styles.routineCtaButton, styles.cardFullWidth]}
            />
            {!intakeCompleted && !routineJson ? (
              <PrimaryButton
                label="Fill routine preferences"
                onPress={handleFillPreferences}
                style={[styles.cardFullWidth, { marginTop: 12 }]}
              />
            ) : null}
          </View>
        ) : null}

        {isAnalyzing ? (
          <View style={{ alignItems: "center", paddingVertical: 16 }}>
            <ActivityIndicator />
            <Text style={[styles.subtitle, { marginTop: 8 }]}>Analyzing scan…</Text>
          </View>
        ) : null}

        {/* <PrimaryButton label="Back to Scan" onPress={() => router.replace("/(tabs)/scan")} /> */}
      </Animated.ScrollView>
    </View>
  );
}
