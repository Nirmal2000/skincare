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

import {
  fetchTaskStatus,
  requestRoutineRecommendation,
  subscribeToRoutineStream,
  type FaceAnalysisResult,
  type FaceAnalysisTaskStatus,
} from "@/features/scans/face-analysis-api";
import { type ScanSource } from "@/features/scans/scan-store";
import {
  isRoutineStreaming,
  markRoutineStreaming,
  unmarkRoutineStreaming,
} from "@/features/scans/routine-stream-store";
import { useSettings } from "@/features/settings/settings-store";
import {
  PrimaryButton,
  SecondaryButton,
} from "@/lib/ui/facefit-components";
import {
  saveRoutineIntake,
  useRoutineIntake,
  type RoutineIntakeAnswers,
} from "@/features/scans/routine-intake-store";
import { useTabBarAutoHideScrollHandler } from "@/features/navigation/tab-bar-visibility";

import {
  FaceIssueOverlay,
  type IssueMarker,
} from "./result/components/FaceIssueOverlay";
import { GlobalProfile } from "./result/components/GlobalProfile";
import { IssueDetailCard } from "./result/components/IssueDetailCard";
import {
  RoutineIntakeForm,
  RoutineIntakeSummary,
  convertAnswersToPayload,
} from "./result/components/RoutineIntakeForm";
import { resultStyles as styles } from "./result/styles";
import type { IssueSummary } from "./result/types";
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

type Params = {
  taskId?: string | string[];
  imageUri?: string | string[];
  source?: string | string[];
  readonly?: string | string[];
  initialResult?: string | string[];
  initialText?: string | string[];
  landmarks?: string | string[];
};

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const { settings } = useSettings();
  const { height: screenHeight } = useWindowDimensions();
  const scrollHandler = useTabBarAutoHideScrollHandler();

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
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [routineMarkdown, setRoutineMarkdown] = useState<string | null>(null);
  const [routineStatus, setRoutineStatus] = useState<
    "idle" | "requesting" | "streaming" | "done" | "error"
  >("idle");
  const [routineError, setRoutineError] = useState<string | null>(null);
  const [pollingActive, setPollingActive] = useState(true);
  const {
    intake: storedIntake,
    completed: intakeCompleted,
    ready: intakeReady,
  } = useRoutineIntake();
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [intakeDraft, setIntakeDraft] = useState<RoutineIntakeAnswers | null>(null);

  const hasLoggedRef = useRef(false);
  const routineStreamCleanupRef = useRef<null | (() => void)>(null);

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
    if (!intakeReady) return;
    setIntakeDraft((prev) => prev ?? storedIntake);
  }, [intakeReady, storedIntake]);

  useEffect(() => {
    if (!intakeReady) return;
    if (!intakeCompleted) {
      setShowIntakeForm(true);
    }
  }, [intakeCompleted, intakeReady]);

  useEffect(() => {
    setPollingActive(true);
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
          return;
        }
        if (payload.status === "failed") {
          setError(payload.error ?? "Task failed. Try again.");
          setPollingActive(false);
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

  const stopRoutineStream = useCallback(() => {
    if (routineStreamCleanupRef.current) {
      try {
        routineStreamCleanupRef.current();
      } catch {
        // ignore cleanup errors
      }
      routineStreamCleanupRef.current = null;
    }
  }, []);

  const handleRoutineStreamComplete = useCallback(() => {
    stopRoutineStream();
    setRoutineStatus("done");
    setRoutineError(null);
    setRoutineMarkdown((prev) => prev ?? "");
    if (taskId) {
      unmarkRoutineStreaming(taskId).catch(() => null);
    }
  }, [stopRoutineStream, taskId]);

  const beginRoutineStream = useCallback(async () => {
    if (!taskId || routineStreamCleanupRef.current) {
      return;
    }
    setRoutineStatus("streaming");
    setRoutineError(null);
    setRoutineMarkdown(null);
    await markRoutineStreaming(taskId);
    try {
      const cleanup = await subscribeToRoutineStream(taskId, {
        onChunk: (chunk) => {
          setRoutineMarkdown((prev) => (prev ? `${prev}${chunk}` : chunk));
        },
        onDone: () => {
          handleRoutineStreamComplete();
        },
        onError: (err) => {
          stopRoutineStream();
          setRoutineStatus("error");
          setRoutineError(err.message);
        },
      });
      routineStreamCleanupRef.current = cleanup;
    } catch (err) {
      await unmarkRoutineStreaming(taskId).catch(() => null);
      setRoutineStatus("error");
      const message =
        err instanceof Error ? err.message : "Unable to start routine stream.";
      setRoutineError(message);
    }
  }, [handleRoutineStreamComplete, stopRoutineStream, taskId]);

  useEffect(() => {
    if (!taskId) return () => undefined;
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
  }, [beginRoutineStream, stopRoutineStream, taskId]);

  const startRoutineWithAnswers = useCallback(
    async (answers: RoutineIntakeAnswers) => {
      if (!taskId) return false;
      if (routineStatus === "requesting" || routineStatus === "streaming") {
        return false;
      }
      setRoutineStatus("requesting");
      setRoutineError(null);
      try {
        await saveRoutineIntake(answers);
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
    if (!intakeReady) return;
    if (!intakeCompleted) {
      setShowIntakeForm(true);
      return;
    }
    await startRoutineWithAnswers(storedIntake);
  }, [intakeCompleted, intakeReady, startRoutineWithAnswers, status, storedIntake, taskId]);

  const handleSubmitIntake = useCallback(async () => {
    if (!intakeDraft) return;
    const success = await startRoutineWithAnswers(intakeDraft);
    if (success) {
      setShowIntakeForm(false);
    }
  }, [intakeDraft, startRoutineWithAnswers]);

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
    routineStatus === "requesting" ||
    routineStatus === "streaming";

  const routineButtonLabel = (() => {
    if (routineStatus === "requesting") return "Requesting routine...";
    if (routineStatus === "streaming") return "Generating routine...";
    if (!intakeCompleted) return "Fill routine form";
    if (routineMarkdown) return "Regenerate routine";
    return "Get my routine";
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

  return (
    <View style={styles.safeArea}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Analysis Status</Text>
          <View style={styles.card}>
            <Text style={styles.statusText}>{`Status: ${status ?? "pending"}`}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
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

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Personalized Routine</Text>
          <View style={styles.card}>
            {showIntakeForm ? (
              intakeDraft ? (
                <RoutineIntakeForm
                  value={intakeDraft}
                  onChange={setIntakeDraft}
                  onSubmit={handleSubmitIntake}
                  submitting={routineStatus === "requesting"}
                  canCancel={intakeCompleted}
                  onCancel={() => {
                    if (intakeCompleted) {
                      setShowIntakeForm(false);
                      setIntakeDraft(storedIntake);
                    }
                  }}
                />
              ) : (
                <ActivityIndicator />
              )
            ) : (
              <>
                {routineMarkdown ? (
                  <Text style={styles.bodyText}>{routineMarkdown}</Text>
                ) : (
                  <Text style={styles.subtitle}>
                    {status === "completed"
                      ? "Ask BetterSkin to craft your next skincare steps."
                      : "Complete an analysis to request a personalized routine."}
                  </Text>
                )}
                <RoutineIntakeSummary
                  ready={intakeReady}
                  completed={intakeCompleted}
                  answers={storedIntake}
                />
                {routineStatus === "streaming" ? (
                  <View style={styles.routineStreamingRow}>
                    <ActivityIndicator />
                    <Text style={styles.subtitle}>Streaming your routine…</Text>
                  </View>
                ) : null}
                {routineError ? <Text style={styles.error}>{routineError}</Text> : null}
                <PrimaryButton
                  label={routineButtonLabel}
                  onPress={handleRequestRoutine}
                  disabled={routineButtonDisabled}
                  style={{ marginTop: 12 }}
                />
                <SecondaryButton
                  label={intakeCompleted ? "Edit answers" : "Fill answers"}
                  onPress={() => {
                    setShowIntakeForm(true);
                    setIntakeDraft(storedIntake);
                  }}
                  disabled={!intakeReady}
                />
              </>
            )}
          </View>
        </View>

        <PrimaryButton label="Back to Scan" onPress={() => router.replace("/(tabs)/scan")} />
      </Animated.ScrollView>
    </View>
  );
}
