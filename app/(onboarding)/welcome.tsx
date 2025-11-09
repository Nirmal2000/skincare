import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  LinearTransition,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";

import { completeOnboarding, useOnboarding } from "@/features/onboarding/onboarding-store";
import { Card } from "@/lib/ui/facefit-components";

import { AgeScroller } from "./components/AgeScroller";
import { BottomControls } from "./components/BottomControls";
import { IntroSlideCard } from "./components/IntroSlideCard";
import {
  ACCENT_COLOR,
  DEFAULT_AGE,
  INTRO_BG,
  INTRO_CARD_STYLE,
  INTRO_SLIDE_COUNT,
  INTRO_SUBTEXT,
  SLIDES,
} from "./welcome.constants";

export default function Welcome() {
  const router = useRouter();
  const { onboarding } = useOnboarding();

  const animationDirection = useRef<"forward" | "back">("forward");
  const [currentSlide, setCurrentSlide] = useState(0);
  const storedAge = onboarding.ageBand ? Number(onboarding.ageBand) : null;
  const initialAge =
    typeof storedAge === "number" && !Number.isNaN(storedAge) ? storedAge : DEFAULT_AGE;
  const [ageValue, setAgeValue] = useState<number | null>(initialAge);
  const [saving, setSaving] = useState(false);

  const slide = useMemo(() => SLIDES[currentSlide], [currentSlide]);
  const isIntroSlide = currentSlide < INTRO_SLIDE_COUNT;
  const isFinalSlide = currentSlide === SLIDES.length - 1;
  const canContinue = isFinalSlide ? Boolean(ageValue) : true;
  const shouldUseAccentPrimary = currentSlide <= INTRO_SLIDE_COUNT;
  const accentButtonStyle = shouldUseAccentPrimary
    ? {
        backgroundColor: ACCENT_COLOR,
        shadowColor: "rgba(241, 138, 27, 0.35)",
        shadowOpacity: 1,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
      }
    : null;

  function goToSlide(nextIndex: number) {
    animationDirection.current = nextIndex > currentSlide ? "forward" : "back";
    setCurrentSlide(nextIndex);
  }

  async function handleContinue() {
    if (!isFinalSlide) {
      goToSlide(Math.min(currentSlide + 1, SLIDES.length - 1));
      return;
    }

    if (!ageValue) return;

    setSaving(true);
    await completeOnboarding({ ageBand: String(ageValue), consentGranted: true });
    setSaving(false);
    router.replace("/(tabs)/home");
  }

  function handleBack() {
    goToSlide(Math.max(currentSlide - 1, 0));
  }

  const enteringAnimation =
    animationDirection.current === "forward"
      ? SlideInRight.duration(220).easing(Easing.out(Easing.cubic))
      : SlideInLeft.duration(220).easing(Easing.out(Easing.cubic));

  const exitingAnimation =
    animationDirection.current === "forward"
      ? SlideOutLeft.duration(200).easing(Easing.in(Easing.cubic))
      : SlideOutRight.duration(200).easing(Easing.in(Easing.cubic));

  const introContent = (
    <View style={styles.introContent}>
      <Card style={[INTRO_CARD_STYLE, { alignSelf: "center" }]}>
        <IntroSlideCard title={slide.title} body={slide.body} iconName={slide.iconName} />
      </Card>
    </View>
  );

  const ageContent = (
    <ScrollView
      style={styles.ageScroll}
      contentContainerStyle={styles.ageScrollContent}
      bounces={false}
    >
      <Card style={INTRO_CARD_STYLE}>
        <IntroSlideCard title={slide.title} body={slide.body} iconName={slide.iconName} />
        <AgeScroller value={ageValue} onChange={setAgeValue} />
      </Card>
    </ScrollView>
  );

  const containerBg = isIntroSlide ? INTRO_BG : "#FFFFFF";
  const finePrintColor = isIntroSlide ? INTRO_SUBTEXT : "#6B6B6B";
  const showBack = currentSlide > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: containerBg }}>
      <View style={[styles.screenPadding, { backgroundColor: containerBg }]}>
        <View style={styles.animatedRegion}>
          <Animated.View
            key={currentSlide}
            style={StyleSheet.absoluteFillObject}
            entering={enteringAnimation}
            exiting={exitingAnimation}
            layout={LinearTransition.duration(200)}
          >
            {isIntroSlide ? introContent : ageContent}
          </Animated.View>
        </View>

        <BottomControls
          style={{ marginTop: 24 }}
          currentSlide={currentSlide}
          totalSlides={SLIDES.length}
          isFinalSlide={isFinalSlide}
          canContinue={canContinue}
          saving={saving}
          onBack={handleBack}
          onContinue={handleContinue}
          accentButtonStyle={accentButtonStyle}
          showBack={showBack}
          finePrintColor={finePrintColor}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenPadding: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  animatedRegion: {
    flex: 1,
    overflow: "hidden",
  },
  introContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  ageScroll: {
    flex: 1,
  },
  ageScrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingBottom: 4,
    gap: 24,
  },
});
