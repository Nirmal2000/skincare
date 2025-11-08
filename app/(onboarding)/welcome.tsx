import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  async function handleContinue() {
    if (!isFinalSlide) {
      setCurrentSlide((prev) => Math.min(prev + 1, SLIDES.length - 1));
      return;
    }

    if (!ageValue) return;

    setSaving(true);
    await completeOnboarding({ ageBand: String(ageValue), consentGranted: true });
    setSaving(false);
    router.replace("/(tabs)/home");
  }

  function handleBack() {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }

  if (isIntroSlide) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: INTRO_BG }}>
        <View style={{ flex: 1, padding: 24 }}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Card style={[INTRO_CARD_STYLE, { alignSelf: "center" }]}>
              <IntroSlideCard
                title={slide.title}
                body={slide.body}
                iconName={slide.iconName}
              />
            </Card>
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
            showBack={currentSlide > 0}
            finePrintColor={INTRO_SUBTEXT}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          justifyContent: "space-between",
        }}
      >
        <View style={{ gap: 24 }}>
          <Card style={INTRO_CARD_STYLE}>
            <IntroSlideCard
              title={slide.title}
              body={slide.body}
              iconName={slide.iconName}
            />
            <AgeScroller value={ageValue} onChange={setAgeValue} />
          </Card>
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
          showBack={currentSlide > 0}
          finePrintColor="#6B6B6B"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
