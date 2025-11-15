import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image as RNImage,
  ScrollView,
  StyleSheet,
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
  type RoutineIntake,
} from "@/features/scans/face-analysis-api";
import { type ScanSource } from "@/features/scans/scan-store";
import {
  isRoutineStreaming,
  markRoutineStreaming,
  unmarkRoutineStreaming,
} from "@/features/scans/routine-stream-store";
import { useSettings } from "@/features/settings/settings-store";
import type {
  FaceLandmarkId,
  FaceLandmarkMap,
  FaceLandmarkPoint,
} from "@/features/scans/landmark-points";
import {
  Chip,
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

type OptionConfig<T extends string> = {
  value: T;
  label: string;
};

const SENSITIVITY_OPTIONS: OptionConfig<RoutineIntakeAnswers["sensitivity"]>[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "unsure", label: "Unsure" },
];

const PREGNANCY_OPTIONS: OptionConfig<RoutineIntakeAnswers["pregnancy"]>[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const RX_OPTIONS: OptionConfig<RoutineIntakeAnswers["rxTopical"]>[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Unsure" },
];

const ALLERGY_OPTIONS: OptionConfig<string>[] = [
  { value: "fragrance", label: "Fragrance" },
  { value: "lanolin", label: "Lanolin" },
  { value: "nut_oils", label: "Nut oils" },
  { value: "chemical_sunscreen_filters", label: "Chemical SPF filters" },
  { value: "parabens", label: "Parabens" },
  { value: "none", label: "None" },
  { value: "unsure", label: "Unsure" },
];

const FITZPATRICK_OPTIONS: OptionConfig<RoutineIntakeAnswers["fitzpatrick"]>[] = [
  { value: "I-II", label: "I–II (burns easily)" },
  { value: "III-IV", label: "III–IV (sometimes burns)" },
  { value: "V-VI", label: "V–VI (rarely burns)" },
  { value: "unsure", label: "Unsure" },
];

const ACTIVES_OPTIONS: OptionConfig<string>[] = [
  { value: "retinoid_retinol", label: "Retinoid / retinol" },
  { value: "benzoyl_peroxide", label: "Benzoyl peroxide" },
  { value: "salicylic_acid", label: "Salicylic acid" },
  { value: "vitamin_c", label: "Vitamin C" },
  { value: "aha", label: "AHA" },
  { value: "azelaic_acid", label: "Azelaic acid" },
  { value: "none", label: "None" },
  { value: "unsure", label: "Unsure" },
];

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

type RoutineIntakeFormProps = {
  value: RoutineIntakeAnswers;
  onChange: (next: RoutineIntakeAnswers) => void;
  onSubmit: () => void;
  submitting: boolean;
  canCancel: boolean;
  onCancel: () => void;
};

function RoutineIntakeForm({ value, onChange, onSubmit, submitting, canCancel, onCancel }: RoutineIntakeFormProps) {
  const handleSingleChange = <K extends keyof RoutineIntakeAnswers>(key: K, nextValue: RoutineIntakeAnswers[K]) => {
    onChange({ ...value, [key]: nextValue });
  };

  const handleMultiToggle = (key: "allergies" | "currentActives", entry: string) => {
    const current = value[key];
    const exclusive = entry === "none" || entry === "unsure";
    let next: string[];
    if (current.includes(entry)) {
      next = current.filter((option) => option !== entry);
    } else {
      next = exclusive ? [entry] : current.filter((option) => option !== "none" && option !== "unsure");
      next = [...next, entry];
    }
    if (!next.length) {
      next = ["none"];
    }
    onChange({ ...value, [key]: Array.from(new Set(next)) });
  };

  return (
    <View style={{ gap: 20 }}>
      <IntakeQuestion
        title="How does your skin react to new products?"
        description="Answering helps us pick the right strength for actives."
      >
        <View style={styles.intakeChipRow}>
          {SENSITIVITY_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={value.sensitivity === option.value}
              onPress={() => handleSingleChange("sensitivity", option.value)}
            />
          ))}
        </View>
      </IntakeQuestion>

      <IntakeQuestion
        title="Are you pregnant, trying, or nursing?"
        description="We skip retinoids and hydroquinone when this is yes or unspecified."
      >
        <View style={styles.intakeChipRow}>
          {PREGNANCY_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={value.pregnancy === option.value}
              onPress={() => handleSingleChange("pregnancy", option.value)}
            />
          ))}
        </View>
      </IntakeQuestion>

      <IntakeQuestion
        title="Prescription creams on your face?"
        description="Let us know if you already use tretinoin, adapalene, steroids, etc."
      >
        <View style={styles.intakeChipRow}>
          {RX_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={value.rxTopical === option.value}
              onPress={() => handleSingleChange("rxTopical", option.value)}
            />
          ))}
        </View>
      </IntakeQuestion>

      <IntakeQuestion title="Avoid any of these?">
        <View style={styles.intakeChipRow}>
          {ALLERGY_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={value.allergies.includes(option.value)}
              onPress={() => handleMultiToggle("allergies", option.value)}
            />
          ))}
        </View>
      </IntakeQuestion>

      <IntakeQuestion title="How does your bare skin react to sun?">
        <View style={styles.intakeChipRow}>
          {FITZPATRICK_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={value.fitzpatrick === option.value}
              onPress={() => handleSingleChange("fitzpatrick", option.value)}
            />
          ))}
        </View>
      </IntakeQuestion>

      <IntakeQuestion title="Already using any of these?">
        <View style={styles.intakeChipRow}>
          {ACTIVES_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={value.currentActives.includes(option.value)}
              onPress={() => handleMultiToggle("currentActives", option.value)}
            />
          ))}
        </View>
      </IntakeQuestion>

      <View style={styles.intakeActions}>
        <PrimaryButton
          label={submitting ? "Saving..." : "Save & generate routine"}
          onPress={onSubmit}
          disabled={submitting}
        />
        {canCancel ? <SecondaryButton label="Cancel" onPress={onCancel} /> : null}
      </View>
    </View>
  );
}

function RoutineIntakeSummary({
  answers,
  ready,
  completed,
}: {
  answers: RoutineIntakeAnswers;
  ready: boolean;
  completed: boolean;
}) {
  if (!ready) {
    return <Text style={styles.subtitle}>Loading your routine inputs…</Text>;
  }
  if (!completed) {
    return (
      <View style={styles.summaryCallout}>
        <Text style={styles.subtitle}>Fill the quick form to personalize every recommendation.</Text>
      </View>
    );
  }
  const entries = [
    { label: "Sensitivity", value: formatOptionLabel(SENSITIVITY_OPTIONS, answers.sensitivity) },
    { label: "Pregnancy", value: formatOptionLabel(PREGNANCY_OPTIONS, answers.pregnancy) },
    { label: "Rx topicals", value: formatOptionLabel(RX_OPTIONS, answers.rxTopical) },
    {
      label: "Allergies",
      value: formatListSummary(answers.allergies, ALLERGY_OPTIONS),
    },
    { label: "Fitzpatrick", value: formatOptionLabel(FITZPATRICK_OPTIONS, answers.fitzpatrick) },
    {
      label: "Current actives",
      value: formatListSummary(answers.currentActives, ACTIVES_OPTIONS),
    },
  ];
  return (
    <View style={styles.summaryGrid}>
      {entries.map((entry) => (
        <View key={entry.label} style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{entry.label}</Text>
          <Text style={styles.summaryValue}>{entry.value}</Text>
        </View>
      ))}
    </View>
  );
}

function IntakeQuestion({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.intakeSection}>
      <Text style={styles.intakeTitle}>{title}</Text>
      {description ? <Text style={styles.intakeDescription}>{description}</Text> : null}
      {children}
    </View>
  );
}

function formatOptionLabel<T extends string>(options: OptionConfig<T>[], value: T) {
  const match = options.find((option) => option.value === value);
  return match?.label ?? value;
}

function formatListSummary(selected: string[], options: OptionConfig<string>[]) {
  if (!selected.length || selected.includes("none")) {
    return "None";
  }
  if (selected.includes("unsure")) {
    return "Unsure";
  }
  return selected
    .map((entry) => formatOptionLabel(options, entry))
    .join(", ");
}

function convertAnswersToPayload(answers: RoutineIntakeAnswers): RoutineIntake {
  return {
    sensitivity: answers.sensitivity,
    pregnancy: answers.pregnancy === "prefer_not_to_say" ? "unsure" : answers.pregnancy,
    rx_topical: answers.rxTopical,
    allergies: normalizeMultiForApi(answers.allergies),
    current_actives: normalizeMultiForApi(answers.currentActives),
    fitzpatrick: answers.fitzpatrick === "unsure" ? undefined : answers.fitzpatrick,
  };
}

function normalizeMultiForApi(values: string[]) {
  if (!values.length || values.includes("none")) return [];
  if (values.includes("unsure")) return ["unsure"];
  return values;
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
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryItem: {
    width: "48%",
    borderRadius: 12,
    backgroundColor: "#F7F7F7",
    padding: 12,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 14,
    color: "#0A0A0A",
    fontWeight: "500",
  },
  summaryCallout: {
    borderRadius: 12,
    backgroundColor: "#F9F1E7",
    padding: 12,
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
  routineStreamingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  intakeSection: {
    gap: 10,
  },
  intakeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  intakeDescription: {
    fontSize: 13,
    color: "#6B6B6B",
  },
  intakeChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  intakeActions: {
    gap: 8,
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
