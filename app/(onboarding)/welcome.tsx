import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  LinearTransition,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Asset } from "expo-asset";
import { Image as ExpoImage } from "expo-image";
import { Feather } from "@expo/vector-icons";

import { completeOnboarding, useOnboarding } from "@/features/onboarding/onboarding-store";
import { Card, Chip } from "@/lib/ui/facefit-components";
import { saveRoutineIntake, type RoutineIntakeAnswers } from "@/features/scans/routine-intake-store";

import { AgeScroller } from "./components/AgeScroller";
import { IntroSlideCard } from "./components/IntroSlideCard";
import { DEFAULT_AGE, INTRO_BG, INTRO_CARD_STYLE, ROUTINE_QUESTIONS, SLIDES } from "./welcome.constants";
import { styles } from "./welcome.styles";

const HERO_IMAGE = require("../../docs/ob1.png");
const HERO_ASSET = Asset.fromModule(HERO_IMAGE);
HERO_ASSET.downloadAsync().catch(() => {});
const HERO_HEADLINE =
  "Let's Understand Your Skin.\nAdvanced AI analysis for routines that actually work.";

export default function Welcome() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string; taskId?: string }>();
  const { onboarding } = useOnboarding();
  const insets = useSafeAreaInsets();

  const animationDirection = useRef<"forward" | "back">("forward");
  const [currentSlide, setCurrentSlide] = useState(0);
  const storedAge = onboarding.ageBand ? Number(onboarding.ageBand) : null;
  const initialAge =
    typeof storedAge === "number" && !Number.isNaN(storedAge) ? storedAge : DEFAULT_AGE;
  const [ageValue, setAgeValue] = useState<number | null>(initialAge);
  const [saving, setSaving] = useState(false);

  const [routineAnswers, setRoutineAnswers] = useState<Partial<RoutineIntakeAnswers>>({
    sensitivity: "medium",
    pregnancy: "prefer_not_to_say",
    rxTopical: "unsure",
    allergies: ["none"],
    fitzpatrick: "unsure",
    currentActives: ["none"],
  });

  const destination = useMemo(() => {
    if (params.returnTo === "result" && params.taskId) {
      return `/(tabs)/result?taskId=${encodeURIComponent(params.taskId)}`;
    }
    if (params.returnTo === "settings") {
      return "/(tabs)/settings";
    }
    return "/(tabs)/home";
  }, [params.returnTo, params.taskId]);

  const totalSlides = SLIDES.length + 1 + ROUTINE_QUESTIONS.length;
  const relativeSlideIndex = currentSlide - 1;
  const slide = useMemo(
    () => (relativeSlideIndex >= 0 && relativeSlideIndex < SLIDES.length ? SLIDES[relativeSlideIndex] : null),
    [relativeSlideIndex],
  );

  const isHeroSlide = currentSlide === 0;
  const ageSlideIndex = SLIDES.length;
  const isAgeSlide = currentSlide === ageSlideIndex;
  const routineQuestionsStartIndex = ageSlideIndex + 1;
  const routineQuestionIndex = currentSlide - routineQuestionsStartIndex;
  const isRoutineQuestionSlide = routineQuestionIndex >= 0 && routineQuestionIndex < ROUTINE_QUESTIONS.length;
  const isFinalSlide = currentSlide === totalSlides - 1;
  const isIntroSlide = !isHeroSlide && !isAgeSlide && !isRoutineQuestionSlide;

  const canContinue = isAgeSlide ? Boolean(ageValue) : true;
  const canShowSkip = isAgeSlide || isRoutineQuestionSlide;

  function goToSlide(nextIndex: number) {
    animationDirection.current = nextIndex > currentSlide ? "forward" : "back";
    setCurrentSlide(Math.min(Math.max(nextIndex, 0), totalSlides - 1));
  }

  const completeFlow = useCallback(
    async ({ saveAnswers, requireAge }: { saveAnswers: boolean; requireAge: boolean }) => {
      const resolvedAge =
        ageValue ??
        (requireAge ? null : onboarding.ageBand ? Number(onboarding.ageBand) : DEFAULT_AGE);
      if (!resolvedAge) {
        return;
      }
      setSaving(true);
      await completeOnboarding({ ageBand: String(resolvedAge), consentGranted: true });
      if (saveAnswers) {
        await saveRoutineIntake(routineAnswers as RoutineIntakeAnswers);
      }
      setSaving(false);
      router.replace(destination);
    },
    [ageValue, destination, onboarding.ageBand, router, routineAnswers],
  );

  const handleSkip = useCallback(() => {
    if (saving) return;
    void completeFlow({ saveAnswers: false, requireAge: false });
  }, [completeFlow, saving]);

  async function handleContinue() {
    if (!isFinalSlide) {
      goToSlide(currentSlide + 1);
      return;
    }

    if (!ageValue) return;

    await completeFlow({ saveAnswers: true, requireAge: true });
  }

  function handleBack() {
    goToSlide(Math.max(currentSlide - 1, 0));
  }

  const enteringAnimation = isHeroSlide
    ? SlideInRight.duration(220).easing(Easing.out(Easing.cubic))
    : animationDirection.current === "forward"
      ? SlideInRight.duration(220).easing(Easing.out(Easing.cubic))
      : SlideInLeft.duration(220).easing(Easing.out(Easing.cubic));

  const exitingAnimation = isHeroSlide
    ? SlideOutLeft.duration(200).easing(Easing.in(Easing.cubic))
    : animationDirection.current === "forward"
      ? SlideOutLeft.duration(200).easing(Easing.in(Easing.cubic))
      : SlideOutRight.duration(200).easing(Easing.in(Easing.cubic));

  const introContent = (
    <View style={styles.introContent}>
      {slide ? (
        <Card style={[INTRO_CARD_STYLE, { alignSelf: "center" }]}>
          <IntroSlideCard title={slide.title} body={slide.body} iconName={slide.iconName} />
        </Card>
      ) : null}
    </View>
  );

  const ageContent = (
    <ScrollView
      style={styles.ageScroll}
      contentContainerStyle={styles.ageScrollContent}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      {slide ? (
        <View style={styles.ageStandalone}>
          <IntroSlideCard title={slide.title} body={slide.body} iconName={slide.iconName} />
          <View style={styles.ageWheel}>
            <AgeScroller value={ageValue} onChange={setAgeValue} />
          </View>
        </View>
      ) : null}
    </ScrollView>
  );

  const routineQuestionContent = useMemo(() => {
    if (!isRoutineQuestionSlide || routineQuestionIndex < 0) return null;
    const question = ROUTINE_QUESTIONS[routineQuestionIndex];
    if (!question) return null;

    const handleSingleSelect = (value: string) => {
      setRoutineAnswers((prev) => ({ ...prev, [question.id]: value }));
    };

    const handleMultiToggle = (value: string) => {
      const currentArray = (routineAnswers[question.id as keyof RoutineIntakeAnswers] as string[]) || [];
      const exclusive = value === "none" || value === "unsure";
      let next: string[];

      if (currentArray.includes(value)) {
        next = currentArray.filter((v) => v !== value);
      } else {
        next = exclusive
          ? [value]
          : currentArray.filter((v) => v !== "none" && v !== "unsure");
        next = [...next, value];
      }

      if (!next.length) {
        next = ["none"];
      }

      setRoutineAnswers((prev) => ({ ...prev, [question.id]: Array.from(new Set(next)) }));
    };

    const currentValue = routineAnswers[question.id as keyof RoutineIntakeAnswers];
    const selectedValues = Array.isArray(currentValue) ? currentValue : [];
    const selectedSingleValue = typeof currentValue === "string" ? currentValue : null;

    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionTitle}>{question.title}</Text>
          {question.description ? (
            <Text style={styles.questionDescription}>{question.description}</Text>
          ) : null}
        </View>
        <View style={styles.questionOptions}>
          {question.options.map((option) => {
            const isSelected =
              question.type === "single"
                ? selectedSingleValue === option.value
                : selectedValues.includes(option.value);

            return (
              <Chip
                key={option.value}
                label={option.label}
                selected={isSelected}
                onPress={() =>
                  question.type === "single"
                    ? handleSingleSelect(option.value)
                    : handleMultiToggle(option.value)
                }
              />
            );
          })}
        </View>
      </View>
    );
  }, [isRoutineQuestionSlide, routineQuestionIndex, routineAnswers]);

  const containerBg = isHeroSlide ? "#000000" : INTRO_BG;
  const showBack = currentSlide > 0;
  const advanceLabel =
    currentSlide === 0 ? "Let's begin" : isFinalSlide ? "Continue" : "Next";
  const backButtonTheme = isHeroSlide ? "light" : "dark";
  const topPadding = insets.top + 24;
  const bottomPadding = insets.bottom + 32;

  return (
    <View style={{ flex: 1, backgroundColor: containerBg }}>
      <Animated.View
        key={currentSlide}
        style={StyleSheet.absoluteFillObject}
        entering={enteringAnimation}
        exiting={exitingAnimation}
        layout={LinearTransition.duration(200)}
      >
        {isHeroSlide ? (
          <View style={styles.heroBackground}>
            <ExpoImage
              source={HERO_ASSET.localUri ? { uri: HERO_ASSET.localUri } : HERO_IMAGE}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={0}
              cachePolicy="memory-disk"
            />
            <View
              style={[
                styles.heroOverlay,
                { paddingTop: topPadding, paddingBottom: bottomPadding },
              ]}
            >
              <View style={styles.topRow}>
                <BackButton visible={showBack} onPress={handleBack} theme="light" />
                {canShowSkip ? (
                  <SkipButton onPress={handleSkip} disabled={saving} />
                ) : (
                  <View style={{ width: 48, height: 48 }} />
                )}
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.heroLogo}>BETTERSKIN</Text>
                <Text style={styles.heroHeadline}>{HERO_HEADLINE}</Text>
              </View>
              <View style={styles.heroFooter}>
                <AdvanceButton
                  label={advanceLabel}
                  onPress={handleContinue}
                  disabled={!canContinue || saving}
                  style={styles.advanceButtonAlign}
                />
              </View>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.slideContainer,
              { backgroundColor: containerBg, paddingTop: topPadding, paddingBottom: bottomPadding },
            ]}
          >
            <View style={styles.topRow}>
              <BackButton visible={showBack} onPress={handleBack} theme={backButtonTheme} />
              {canShowSkip ? (
                <SkipButton onPress={handleSkip} disabled={saving} />
              ) : (
                <View style={{ width: 48, height: 48 }} />
              )}
            </View>
            <View style={styles.slideBody}>
              {isIntroSlide ? introContent : isAgeSlide ? ageContent : routineQuestionContent}
            </View>
            <View style={styles.slideFooter}>
              <AdvanceButton
                label={advanceLabel}
                onPress={handleContinue}
                disabled={!canContinue || saving}
                style={styles.advanceButtonAlign}
              />
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

type BackButtonProps = {
  visible: boolean;
  onPress: () => void;
  theme?: "light" | "dark";
};

function BackButton({ visible, onPress, theme = "dark" }: BackButtonProps) {
  if (!visible) {
    return <View style={{ width: 48, height: 48 }} />;
  }

  const isLight = theme === "light";
  const iconColor = isLight ? "#FFFFFF" : "#1D1207";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.backButton,
        pressed && styles.backButtonPressed,
      ]}
    >
      <Feather name="chevron-left" size={24} color={iconColor} />
    </Pressable>
  );
}

type SkipButtonProps = {
  onPress: () => void;
  disabled?: boolean;
};

function SkipButton({ onPress, disabled }: SkipButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.skipButton,
        pressed && !disabled && styles.skipButtonPressed,
        disabled && styles.skipButtonDisabled,
      ]}
    >
      <Text style={styles.skipButtonLabel}>Skip for now</Text>
    </Pressable>
  );
}

type AdvanceButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

function AdvanceButton({ label, onPress, disabled, style }: AdvanceButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.advanceButtonBase,
        pressed && !disabled && styles.advanceButtonPressed,
        disabled && styles.advanceButtonDisabled,
        style,
      ]}
    >
      <Text style={styles.advanceButtonLabel}>{label}</Text>
      <Feather name="arrow-right" size={20} color="#FFFFFF" />
    </Pressable>
  );
}
