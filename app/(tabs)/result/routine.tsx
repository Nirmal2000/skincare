import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  fetchTaskStatus,
  requestRoutineRecommendation,
  type FaceAnalysisTaskResponse,
} from "@/features/scans/face-analysis-api";
import { convertAnswersToPayload } from "./components/RoutineIntakeForm";
import { useRoutineIntake } from "@/features/scans/routine-intake-store";
import { PrimaryButton } from "@/lib/ui/facefit-components";
import { resultStyles as styles } from "./styles";
import { toSingle } from "./utils";
import { Feather } from "@expo/vector-icons";
import { useTabBarAutoHideScrollHandler } from "@/features/navigation/tab-bar-visibility";

type Params = {
  taskId?: string | string[];
  routineRequested?: string | string[];
};

type RoutineProduct = {
  id?: string;
  brand?: string;
  name?: string;
  tier?: string;
  url?: string;
  why?: string;
};

type RoutineInstruction = {
  how?: string;
  timing?: string;
  frequency?: string;
};

type RoutineStep = {
  type?: string;
  instructions?: RoutineInstruction;
  products?: RoutineProduct[];
};

type RoutinePlan = {
  reasons?: {
    notes?: string;
    prioritized_concerns?: {
      key?: string;
      why?: string;
      severity?: "mild" | "moderate" | "severe" | string;
    }[];
  };
  routine?: {
    am?: RoutineStep[] | null;
    midday?: RoutineStep[] | null;
    pm?: RoutineStep[] | null;
    [key: string]: RoutineStep[] | null | undefined;
  };
  lifestyle?: {
    sun?: string;
    sleep?: string;
    habits?: string;
    routine_hygiene?: string;
    stress?: string;
    diet?: {
      limit?: string[];
      increase?: string[];
      supplements?: string[];
    };
  };
};

const SEVERITY_COLORS: Record<string, string> = {
  mild: "#48A14D",
  moderate: "#ED8A1F",
  severe: "#E85454",
};

const SECTION_LABELS: Record<string, string> = {
  am: "AM Routine",
  midday: "Midday",
  pm: "PM Routine",
};

const formatStepType = (type?: string) => {
  if (!type) return "Step";
  return type
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export default function RoutineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const taskId = toSingle(params.taskId);
  const routineRequestedParam = toSingle(params.routineRequested);
  const routineRequestedFromResult = routineRequestedParam === "true";
  const scrollHandler = useTabBarAutoHideScrollHandler();

  const [taskPayload, setTaskPayload] = useState<FaceAnalysisTaskResponse | null>(null);
  const [routineStatus, setRoutineStatus] = useState<
    "idle" | "requesting" | "polling" | "done" | "error"
  >(routineRequestedFromResult ? "polling" : "idle");
  const [routineError, setRoutineError] = useState<string | null>(null);
  const [hasRequestedRoutine, setHasRequestedRoutine] = useState(routineRequestedFromResult);

  const {
    intake: storedIntake,
    completed: intakeCompleted,
    ready: intakeReady,
  } = useRoutineIntake();

  const routineJson = taskPayload?.routine_json ?? null;
  const routinePlan = useMemo(() => (routineJson as RoutinePlan | null), [routineJson]);

  const routineSections = useMemo(() => {
    if (!routinePlan?.routine) return [];
    const entries: Array<{
      key: "am" | "midday" | "pm";
      label: string;
      steps?: RoutineStep[] | null;
    }> = ["am", "midday", "pm"].map((key) => ({
      key: key as "am" | "midday" | "pm",
      label: SECTION_LABELS[key] ?? key.toUpperCase(),
      steps: routinePlan.routine?.[key],
    }));
    return entries.filter((entry) => entry.steps && entry.steps.length);
  }, [routinePlan]);

  const lifestyleEntries = useMemo(() => {
    if (!routinePlan?.lifestyle) return [];
    const { lifestyle } = routinePlan;
    const list: Array<{ label: string; value: string | string[] | undefined }> = [];
    if (lifestyle.sun) list.push({ label: "Sun", value: lifestyle.sun });
    if (lifestyle.sleep) list.push({ label: "Sleep", value: lifestyle.sleep });
    if (lifestyle.habits) list.push({ label: "Habits", value: lifestyle.habits });
    if (lifestyle.routine_hygiene) {
      list.push({ label: "Routine hygiene", value: lifestyle.routine_hygiene });
    }
    if (lifestyle.stress) list.push({ label: "Stress", value: lifestyle.stress });
    const diet = lifestyle.diet;
    if (diet?.increase?.length) list.push({ label: "Diet – Increase", value: diet.increase });
    if (diet?.limit?.length) list.push({ label: "Diet – Limit", value: diet.limit });
    if (diet?.supplements?.length) list.push({ label: "Supplements", value: diet.supplements });
    return list;
  }, [routinePlan]);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    const controller = new AbortController();

    const poll = async () => {
      while (!cancelled) {
        try {
          const payload = await fetchTaskStatus(taskId, controller.signal);
          if (controller.signal.aborted) return;
          setTaskPayload(payload);
          if (payload.routine_json) {
            setRoutineStatus("done");
            return;
          }
          setRoutineStatus((prev) => (prev === "idle" ? "polling" : prev));
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } catch (err) {
          if (cancelled) return;
          const message = err instanceof Error ? err.message : "Unable to fetch routine.";
          setRoutineError(message);
          setRoutineStatus("error");
          return;
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [taskId]);

  useEffect(() => {
    if (!taskId || routineJson || hasRequestedRoutine) return;
    if (!intakeReady || !intakeCompleted) return;
    let cancelled = false;
    setRoutineStatus("requesting");
    setRoutineError(null);
    requestRoutineRecommendation(taskId, convertAnswersToPayload(storedIntake))
      .then(() => {
        if (cancelled) return;
        setHasRequestedRoutine(true);
        setRoutineStatus("polling");
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unable to request routine.";
        setRoutineError(message);
        setRoutineStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [taskId, hasRequestedRoutine, intakeCompleted, intakeReady, routineJson, storedIntake]);

  const heroHeight = Math.max(screenHeight * 0.75, 480);

  const handleFillPreferences = useCallback(() => {
    router.push("/welcome?returnTo=result");
  }, [router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const loadingMessage = (() => {
    if (routineStatus === "requesting") return "Requesting your routine…";
    if (routineStatus === "polling") return "Fetching your routine…";
    return "Waiting for your routine…";
  })();

  return (
    <View style={styles.safeArea}>
      <Pressable
        onPress={handleClose}
        style={[
          styles.backButton,
          { top: insets.top + 8, left: 12 },
        ]}
      >
        <Feather name="chevron-left" size={26} color="#2A2A2A" />
      </Pressable>
      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
      >
        <View style={[styles.section, { paddingBottom: 8, marginTop: 48 }]}>
          <Text style={styles.title}>Personalized Routine</Text>
          {routineJson ? (
            <>
              {routinePlan?.reasons ? (
                <View style={[styles.card, styles.cardFullWidth]}>
                  <Text style={styles.cardHeading}>Why this routine</Text>
                  {routinePlan.reasons.notes ? (
                    <Text style={styles.bodyText}>{routinePlan.reasons.notes}</Text>
                  ) : null}
                  {routinePlan.reasons.prioritized_concerns?.map((concern, index) => {
                    const severity = concern.severity ?? "moderate";
                    const color = SEVERITY_COLORS[severity] ?? "#F18A1B";
                    return (
                      <View key={`concern-${index}`} style={[styles.concernCard, { borderColor: color }]}>
                        <View style={styles.concernHeader}>
                          <Text style={styles.subheading}>{formatStepType(concern.key)}</Text>
                          <View style={[styles.severityPill, { backgroundColor: `${color}22` }]}>
                            <Text style={[styles.severityLabel, { color }]}>{severity}</Text>
                          </View>
                        </View>
                        {concern.why ? (
                          <Text style={[styles.bodyText, { marginTop: 4 }]}>{concern.why}</Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ) : null}
              {routineSections.map((section) => (
                <View key={section.key} style={[styles.card, styles.cardFullWidth, styles.cardSpacer]}>
                  <Text style={styles.cardHeading}>{section.label}</Text>
                  {section.steps?.map((step, index) => (
                    <View key={`${section.key}-step-${index}`} style={styles.routineStepCard}>
                      <Text style={styles.subheading}>{formatStepType(step.type)}</Text>
                      {step.instructions?.how ? (
                        <Text style={styles.bodyText}>{step.instructions.how}</Text>
                      ) : null}
                      {(step.instructions?.frequency || step.instructions?.timing) ? (
                        <Text style={styles.instructionsMeta}>
                          {[step.instructions.frequency, step.instructions.timing].filter(Boolean).join(" · ")}
                        </Text>
                      ) : null}
                      {step.products?.map((product) => (
                        <View key={product.id ?? `${product.name ?? "product"}-${index}`} style={styles.productRow}>
                          <Text style={styles.productName}>
                            {product.brand ? `${product.brand} – ` : ""}
                            {product.name ?? "Product"}
                          </Text>
                          {product.why ? (
                            <Text style={styles.productDescription}>{product.why}</Text>
                          ) : null}
                          {product.tier ? (
                            <Text style={styles.productTier}>{product.tier}</Text>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              ))}
              {lifestyleEntries.length ? (
                <View style={[styles.card, styles.cardFullWidth, styles.cardSpacer]}>
                  <Text style={styles.cardHeading}>Lifestyle notes</Text>
                  {lifestyleEntries.map((entry, index) => (
                    <View key={`lifestyle-${index}`} style={styles.lifestyleRow}>
                      <Text style={styles.lifestyleLabel}>{entry.label}</Text>
                      {entry.value ? (
                        <Text style={styles.bodyText}>
                          {Array.isArray(entry.value) ? entry.value.join(", ") : entry.value}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.routineStreamingRow}>
              <ActivityIndicator />
              <Text style={styles.subtitle}>{loadingMessage}</Text>
            </View>
          )}
          {routineError ? (
            <Text style={[styles.error, styles.cardDescriptionCentered, styles.cardFullWidth]}>
              {routineError}
            </Text>
          ) : null}
          {!intakeCompleted ? (
            <PrimaryButton
              label="Fill routine preferences"
              onPress={handleFillPreferences}
              style={[styles.cardFullWidth, { marginTop: 12 }]}
            />
          ) : null}
        </View>
        <View style={{ height: heroHeight * 0.4 }} />
      </Animated.ScrollView>
    </View>
  );
}
