import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
            <View style={[styles.card, styles.cardFullWidth]}>
              <Text style={[styles.cardHeading, styles.cardHeadingCentered]}>Routine JSON</Text>
              <View style={[styles.routineJsonContainer, styles.cardFullWidth]}>
                <ScrollView style={{ maxHeight: 260 }} nestedScrollEnabled>
                  <Text style={styles.routineJson}>{JSON.stringify(routineJson, null, 2)}</Text>
                </ScrollView>
              </View>
            </View>
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
