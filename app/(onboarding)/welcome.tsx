import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
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
import { Card } from "@/lib/ui/facefit-components";

import { AgeScroller } from "./components/AgeScroller";
import { IntroSlideCard } from "./components/IntroSlideCard";
import { ACCENT_COLOR, DEFAULT_AGE, INTRO_BG, INTRO_CARD_STYLE, SLIDES } from "./welcome.constants";

const HERO_IMAGE = require("../../docs/ob1.png");
const HERO_ASSET = Asset.fromModule(HERO_IMAGE);
HERO_ASSET.downloadAsync().catch(() => {});
const HERO_HEADLINE =
  "Let's Understand Your Skin.\nAdvanced AI analysis for routines that actually work.";

export default function Welcome() {
  const router = useRouter();
  const { onboarding } = useOnboarding();
  const insets = useSafeAreaInsets();

  const animationDirection = useRef<"forward" | "back">("forward");
  const [currentSlide, setCurrentSlide] = useState(0);
  const storedAge = onboarding.ageBand ? Number(onboarding.ageBand) : null;
  const initialAge =
    typeof storedAge === "number" && !Number.isNaN(storedAge) ? storedAge : DEFAULT_AGE;
  const [ageValue, setAgeValue] = useState<number | null>(initialAge);
  const [saving, setSaving] = useState(false);

  const totalSlides = SLIDES.length + 1;
  const relativeSlideIndex = currentSlide - 1;
  const slide = useMemo(
    () => (relativeSlideIndex >= 0 ? SLIDES[relativeSlideIndex] : null),
    [relativeSlideIndex],
  );
  const isHeroSlide = currentSlide === 0;
  const isFinalSlide = currentSlide === totalSlides - 1;
  const isIntroSlide = !isHeroSlide && !isFinalSlide;
  const canContinue = isFinalSlide ? Boolean(ageValue) : true;

  function goToSlide(nextIndex: number) {
    animationDirection.current = nextIndex > currentSlide ? "forward" : "back";
    setCurrentSlide(Math.min(Math.max(nextIndex, 0), totalSlides - 1));
  }

  async function handleContinue() {
    if (!isFinalSlide) {
      goToSlide(currentSlide + 1);
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
            </View>
            <View style={styles.slideBody}>{isIntroSlide ? introContent : ageContent}</View>
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

const styles = StyleSheet.create({
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
    justifyContent: "center",
    paddingBottom: 24,
  },
  ageStandalone: {
    gap: 32,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  ageWheel: {
    width: "100%",
    maxWidth: 360,
  },
  heroBackground: {
    flex: 1,
    backgroundColor: "#000000",
  },
  heroOverlay: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  topRow: {
    alignItems: "flex-start",
  },
  heroCopy: {
    marginTop: "15%",
    alignItems: "center",
    gap: 20,
  },
  heroLogo: {
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: 6,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },
  heroHeadline: {
    fontSize: 28,
    lineHeight: 34,
    color: "#FFFFFF",
    textAlign: "center",
  },
  heroFooter: {
    alignItems: "flex-end",
  },
  slideContainer: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 24,
  },
  slideBody: {
    flex: 1,
  },
  slideFooter: {
    alignItems: "flex-end",
  },
  advanceButtonAlign: {
    alignSelf: "flex-end",
  },
  advanceButtonBase: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 999,
    paddingHorizontal: 28,
    backgroundColor: ACCENT_COLOR,
    shadowColor: "rgba(241, 138, 27, 0.35)",
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  advanceButtonPressed: {
    opacity: 0.9,
  },
  advanceButtonDisabled: {
    opacity: 0.5,
  },
  advanceButtonLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -12 }],
  },
  backButtonPressed: {
    opacity: 0.8,
  },
  backButtonLabel: {
    fontSize: 20,
    fontWeight: "600",
  },
});

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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.backButton,
        isLight ? styles.backButtonLight : styles.backButtonDark,
        pressed && styles.backButtonPressed,
      ]}
    >
      <Text style={[styles.backButtonLabel, { color: isLight ? "#FFFFFF" : "#1D1207" }]}>
        {"<"}
      </Text>
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
