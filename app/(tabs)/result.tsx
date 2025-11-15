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
  subscribeToRoutineStream,
  type FaceAnalysisResult,
  type FaceAnalysisTaskStatus,
} from "@/features/scans/face-analysis-api";
import { isTaskPending, unmarkTaskPending } from "@/features/scans/pending-task-store";
import { useRoutineIntake, type RoutineIntakeAnswers } from "@/features/scans/routine-intake-store";
import {
  isRoutineStreaming,
  markRoutineStreaming,
  unmarkRoutineStreaming,
} from "@/features/scans/routine-stream-store";
import { deleteScan, type ScanSource } from "@/features/scans/scan-store";
import { PrimaryButton } from "@/lib/ui/facefit-components";
import { MarkdownStream, type UseMarkdownStreamResult } from "react-native-markdown-stream";

import {
  FaceIssueOverlay,
  type IssueMarker,
} from "./result/components/FaceIssueOverlay";
import { GlobalProfile } from "./result/components/GlobalProfile";
import { IssueDetailCard } from "./result/components/IssueDetailCard";
import { convertAnswersToPayload } from "./result/components/RoutineIntakeForm";
import { resultStyles as styles } from "./result/styles";
import {
  buildIssueSummaries,
  clamp,
  computeMarkerCoords,
  decodeMaybe,
  intensityToColor,
  parseJsonParam,
  parseLandmarksParam,
  toSingle,
} from "./result/utils";

function extractFailureToken(message: string | null | undefined) {
  if (!message) return null;
  const match = message.match(/\[ERROR\]\s*([A-Za-z0-9_-]+)/);
  return match?.[1] ?? null;
}

function logRoutineStream(...args: unknown[]) {
  console.log("[RoutineStream]", ...args);
}

type Params = {
  taskId?: string | string[];
  imageUri?: string | string[];
  source?: string | string[];
  readonly?: string | string[];
  initialResult?: string | string[];
  initialText?: string | string[];
  landmarks?: string | string[];
  initialRoutine?: string | string[];
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
  const readOnly = toSingle(params.readonly) === "true";
  const initialStructured = useMemo(() => parseJsonParam(params.initialResult), [params.initialResult]);
  const initialText = useMemo(() => decodeMaybe(toSingle(params.initialText)), [params.initialText]);
  const initialRoutine = useMemo(
    () => decodeMaybe(toSingle(params.initialRoutine)),
    [params.initialRoutine],
  );
  const landmarksParam = toSingle(params.landmarks);
  const landmarks = useMemo(() => parseLandmarksParam(landmarksParam), [landmarksParam]);

  const initialStatus = useMemo<FaceAnalysisTaskStatus | null>(() => {
    if (initialStructured) return "completed";
    if (initialText) return "failed";
    return taskId ? "queued" : null;
  }, [initialStructured, initialText, taskId]);
  const [status, setStatus] = useState<FaceAnalysisTaskStatus | null>(() => initialStatus);
  const [result, setResult] = useState<FaceAnalysisResult | null>(initialStructured);
  const [textResult, setTextResult] = useState<string | null>(initialText ?? null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [routineMarkdown, setRoutineMarkdown] = useState<string | null>(null);
  const [routineStatus, setRoutineStatus] = useState<
    "idle" | "requesting" | "streaming" | "done" | "error"
  >("idle");
  const [routineError, setRoutineError] = useState<string | null>(null);
  const [pollingActive, setPollingActive] = useState(false);
  const [isTrackedTask, setIsTrackedTask] = useState(false);
  const failureMessage = error ?? textResult;
  const failureToken = useMemo(() => extractFailureToken(failureMessage), [failureMessage]);
  const {
    intake: storedIntake,
    completed: intakeCompleted,
    ready: intakeReady,
  } = useRoutineIntake();

  const hasLoggedRef = useRef(false);
  const routineStreamCleanupRef = useRef<null | (() => void)>(null);
  const routineMarkdownRef = useRef("");
  const markdownStreamControlsRef = useRef<UseMarkdownStreamResult | null>(null);
  const previousRoutineStatusRef = useRef<typeof routineStatus | null>(routineStatus);
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
  const handleMarkdownReady = useCallback((controls: UseMarkdownStreamResult) => {
    logRoutineStream("MarkdownStream ready");
    markdownStreamControlsRef.current = controls;
    controls.setContent(routineMarkdownRef.current);
  }, []);

  useEffect(() => {
    routineMarkdownRef.current = routineMarkdown ?? "";
    logRoutineStream("routineMarkdown updated", routineMarkdownRef.current.length);
  }, [routineMarkdown]);

  useEffect(() => {
    return () => {
      markdownStreamControlsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const previousStatus = previousRoutineStatusRef.current;
    if (previousStatus === routineStatus) return;
    previousRoutineStatusRef.current = routineStatus;
    logRoutineStream("status changed", previousStatus, "→", routineStatus);
    if (routineStatus === "streaming") {
      markdownStreamControlsRef.current?.reset();
    }
  }, [routineStatus]);

  useEffect(() => {
    if (routineStatus === "streaming") return;
    const controls = markdownStreamControlsRef.current;
    if (!controls) return;
    logRoutineStream("syncing content to MarkdownStream", routineMarkdown?.length ?? 0);
    controls.setContent(routineMarkdown ?? "");
  }, [routineMarkdown, routineStatus]);

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
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setResult(initialStructured ?? null);
    setTextResult(initialText ?? null);
  }, [initialStructured, initialText]);

  useEffect(() => {
    if (initialRoutine == null) return;
    setRoutineMarkdown(initialRoutine);
    setRoutineStatus((prev) => (prev === "streaming" ? prev : "done"));
    setRoutineError(null);
  }, [initialRoutine]);

  useEffect(() => {
    stopRoutineStream();
    setError(null);
    setSelectedIssueKey(null);
    setRoutineMarkdown(null);
    routineMarkdownRef.current = "";
    if (markdownStreamControlsRef.current) {
      markdownStreamControlsRef.current.setContent("");
    }
    setRoutineStatus("idle");
    setRoutineError(null);
    logRoutineStream("resetting UI state for task", taskId);
  }, [stopRoutineStream, taskId]);

  useEffect(() => {
    if (!taskId) {
      setPollingActive(false);
      setIsTrackedTask(false);
      return;
    }
    let cancelled = false;
    setPollingActive(false);
    setIsTrackedTask(false);
    (async () => {
      try {
        const tracked = await isTaskPending(taskId);
        if (cancelled) return;
        setIsTrackedTask(tracked);
        setPollingActive(tracked);
      } catch {
        if (!cancelled) {
          setIsTrackedTask(false);
          setPollingActive(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useEffect(() => {
    if (!taskId || !pollingActive) return;
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
        if (typeof payload.routine_markdown === "string" && payload.routine_markdown.length) {
          setRoutineMarkdown((prev) => {
            if (prev === payload.routine_markdown) {
              return prev;
            }
            return payload.routine_markdown ?? prev ?? null;
          });
          setRoutineStatus((prev) => (prev === "streaming" ? prev : "done"));
          setRoutineError(null);
        }
        if (payload.status === "completed") {
          if (!hasLoggedRef.current) {
            console.log("[FaceAnalysis] task completed", payload);
            hasLoggedRef.current = true;
          }
          setError(null);
          setPollingActive(false);
          setIsTrackedTask(false);
          await unmarkTaskPending(taskId).catch(() => null);
          return;
        }
        if (payload.status === "failed") {
          setError(payload.error ?? "Task failed. Try again.");
          setPollingActive(false);
          setIsTrackedTask(false);
          await unmarkTaskPending(taskId).catch(() => null);
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
  }, [pollingActive, taskId]);

  const handleFailureRetry = useCallback(async () => {
    if (!taskId) return;
    setPollingActive(false);
    try {
      await deleteScan(taskId);
    } catch (scanError) {
      console.warn("Failed to delete scan after failure", scanError);
    }
    await unmarkTaskPending(taskId).catch(() => null);
    router.replace("/(tabs)/home");
  }, [router, taskId]);

  const stopRoutineStream = useCallback(() => {
    if (routineStreamCleanupRef.current) {
      try {
        routineStreamCleanupRef.current();
      } catch {
        // ignore cleanup errors
      }
      routineStreamCleanupRef.current = null;
      logRoutineStream("routine stream cleanup invoked");
    }
  }, []);

  const handleRoutineStreamComplete = useCallback(() => {
    stopRoutineStream();
    setRoutineStatus("done");
    setRoutineError(null);
    setRoutineMarkdown((prev) => prev ?? "");
    logRoutineStream("handleRoutineStreamComplete");
    if (taskId) {
      unmarkRoutineStreaming(taskId).catch(() => null);
    }
  }, [stopRoutineStream, taskId]);

  const beginRoutineStream = useCallback(async () => {
    if (!taskId || routineStreamCleanupRef.current) {
      logRoutineStream("Skipping stream start", { taskId, hasCleanup: !!routineStreamCleanupRef.current });
      return;
    }
    logRoutineStream("Starting routine stream", { taskId });
    setRoutineStatus("streaming");
    setRoutineError(null);
    setRoutineMarkdown(null);
    await markRoutineStreaming(taskId);
    try {
      const cleanup = await subscribeToRoutineStream(taskId, {
        onChunk: (chunk) => {
          const controls = markdownStreamControlsRef.current;
          logRoutineStream("chunk received", {
            length: typeof chunk === "string" ? chunk.length : null,
            preview: typeof chunk === "string" ? chunk.slice(0, 40) : chunk,
            hasControls: !!controls,
          });
          if (!controls) {
            logRoutineStream("chunk dropped - controls not ready");
          } else {
            controls.appendChunk(chunk);
          }
          setRoutineMarkdown((prev) => {
            const nextValue = prev ? `${prev}${chunk}` : chunk;
            logRoutineStream("accumulated markdown length", typeof nextValue === "string" ? nextValue.length : 0);
            return nextValue;
          });
        },
        onDone: () => {
          logRoutineStream("stream completed");
          handleRoutineStreamComplete();
        },
        onError: (err) => {
          logRoutineStream("stream error", err);
          stopRoutineStream();
          setRoutineStatus("error");
          setRoutineError(err.message);
          const serverError = err as Error & { isRoutineStreamServerError?: boolean };
          if (serverError.isRoutineStreamServerError) {
            handleFailureRetry().catch(() => null);
          }
        },
      });
      logRoutineStream("subscription established");
      routineStreamCleanupRef.current = cleanup;
    } catch (err) {
      logRoutineStream("failed to start stream", err);
      await unmarkRoutineStreaming(taskId).catch(() => null);
      setRoutineStatus("error");
      const message =
        err instanceof Error ? err.message : "Unable to start routine stream.";
      setRoutineError(message);
    }
  }, [handleFailureRetry, handleRoutineStreamComplete, stopRoutineStream, taskId]);

  useEffect(() => {
    if (!taskId || !isTrackedTask) {
      stopRoutineStream();
      return () => undefined;
    }
    let cancelled = false;

    (async () => {
      const tracked = await isRoutineStreaming(taskId);
      if (cancelled || !tracked) {
        return;
      }
      await beginRoutineStream();
    })();

    return () => {
      cancelled = true;
      stopRoutineStream();
    };
  }, [beginRoutineStream, isTrackedTask, stopRoutineStream, taskId]);

  const startRoutineWithAnswers = useCallback(
    async (answers: RoutineIntakeAnswers) => {
      if (!taskId) return false;
      if (routineStatus === "requesting" || routineStatus === "streaming") {
        return false;
      }
      setRoutineStatus("requesting");
      setRoutineError(null);
      try {
        const payload = convertAnswersToPayload(answers);
        await requestRoutineRecommendation(taskId, payload);
        await beginRoutineStream();
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to request routine.";
        setRoutineStatus("error");
        setRoutineError(message);
        return false;
      }
    },
    [beginRoutineStream, routineStatus, taskId],
  );

  const handleRequestRoutine = useCallback(async () => {
    if (!taskId || status !== "completed") return;
    if (!intakeReady || !intakeCompleted) return;
    await startRoutineWithAnswers(storedIntake);
  }, [intakeCompleted, intakeReady, startRoutineWithAnswers, status, storedIntake, taskId]);

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

  const routineButtonDisabled =
    !taskId ||
    status !== "completed" ||
    !intakeCompleted ||
    !intakeReady ||
    routineStatus === "requesting" ||
    routineStatus === "streaming";

  const routineButtonLabel = (() => {
    if (routineStatus === "requesting") return "Summoning your glow ritual...";
    if (routineStatus === "streaming") return "Streaming your glow ritual...";
    if (routineMarkdown) return "Refresh my glow ritual";
    return "Unveil my glow ritual";
  })();

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
            <View style={[styles.card, styles.cardCentered]}>
              <Text style={[styles.cardHeading, styles.cardHeadingCentered]}>Personalized Routine</Text>
              {routineStatus === "streaming" || !!routineMarkdown ? (
                <View style={[styles.markdownContainer, styles.cardFullWidth]}>
                  <MarkdownStream
                    autoStart={false}
                    initialValue=""
                    revealMode="word"
                    revealDelay={24}
                    onReady={handleMarkdownReady}
                    theme={markdownTheme}
                    enableImageLightbox
                    enableCodeCopy
                  />
                </View>
              ) : (
                <Text style={[styles.subtitle, styles.cardDescriptionCentered, styles.cardFullWidth]}>
                  {status === "completed"
                    ? intakeCompleted
                      ? "Ask BetterSkin to craft your next skincare steps."
                      : "Fill your routine preferences to unlock tailored recommendations."
                    : "Complete an analysis to request a personalized routine."}
                </Text>
              )}
              {!intakeReady ? (
                <View style={[styles.routineStreamingRow, styles.cardFullWidth]}>
                  <ActivityIndicator />
                  <Text style={styles.subtitle}>Loading your preferences…</Text>
                </View>
              ) : null}
              {routineStatus === "streaming" ? (
                <View style={[styles.routineStreamingRow, styles.cardFullWidth]}>
                  <ActivityIndicator />
                  {/* <Text style={styles.subtitle}>Streaming your routine…</Text> */}
                </View>
              ) : null}
              {routineError ? (
                <Text style={[styles.error, styles.cardDescriptionCentered, styles.cardFullWidth]}>
                  {routineError}
                </Text>
              ) : null}
              <PrimaryButton
                label={routineButtonLabel}
                onPress={handleRequestRoutine}
                disabled={routineButtonDisabled}
                style={[styles.routineCtaButton, styles.cardFullWidth, { marginTop: 12 }]}
              />
              {!intakeCompleted ? (
                <PrimaryButton
                  label="Fill routine preferences"
                  onPress={handleFillPreferences}
                  style={[styles.cardFullWidth, { marginTop: 12 }]}
                />
              ) : null}
            </View>
          </View>
        ) : null}

        {pollingActive ? (
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
