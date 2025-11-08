import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Pressable,
} from "react-native";

import { completeOnboarding, useOnboarding } from "@/features/onboarding/onboarding-store";
import {
  Card,
  Chip,
  PrimaryButton,
  ProgressDots,
  SecondaryButton,
} from "@/lib/ui/facefit-components";

const SLIDES = [
  {
    title: "Natural You. Real Results.",
    body: "Makeup-free, one face, good light. We only need one photo per scan.",
    icon: "🙂",
  },
  {
    title: "Private & Local.",
    body: "Photos stay on this device for 30 days. Delete anytime from Settings.",
    icon: "🔒",
  },
  {
    title: "Age helps personalize.",
    body: "Choose your age band so FaceFit can tailor non-medical tips.",
    icon: "📊",
  },
];

const AGE_BANDS = [
  "13-17",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55+",
];

export default function Welcome() {
  const router = useRouter();
  const { onboarding } = useOnboarding();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [ageBand, setAgeBand] = useState<string | null>(
    onboarding.ageBand ?? null,
  );
  const [consent, setConsent] = useState(onboarding.consentGranted);
  const [saving, setSaving] = useState(false);

  const slide = useMemo(() => SLIDES[currentSlide], [currentSlide]);
  const isFinalSlide = currentSlide === SLIDES.length - 1;
  const canContinue = isFinalSlide ? Boolean(ageBand && consent) : true;

  async function handleContinue() {
    if (!isFinalSlide) {
      setCurrentSlide((prev) => Math.min(prev + 1, SLIDES.length - 1));
      return;
    }

    if (!ageBand || !consent) {
      return;
    }

    setSaving(true);
    await completeOnboarding({ ageBand, consentGranted: consent });
    setSaving(false);
    router.replace("/(tabs)/home");
  }

  function handleBack() {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
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
          <Text
            style={{
              fontSize: 16,
              color: "#6B6B6B",
              textAlign: "right",
            }}
          >
            {currentSlide + 1} / {SLIDES.length}
          </Text>
          <Card>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>{slide.icon}</Text>
            <Text
              style={{
                fontSize: 24,
                lineHeight: 32,
                fontWeight: "600",
                color: "#0A0A0A",
                marginBottom: 12,
              }}
            >
              {slide.title}
            </Text>
            <Text style={{ fontSize: 16, lineHeight: 24, color: "#0A0A0A" }}>
              {slide.body}
            </Text>
          </Card>
          {isFinalSlide ? (
            <Card title="Tell us about you">
              <Text style={{ fontSize: 16, color: "#6B6B6B", marginBottom: 8 }}>
                Choose an age band
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {AGE_BANDS.map((band) => (
                  <Chip
                    key={band}
                    label={band}
                    selected={ageBand === band}
                    onPress={() => setAgeBand(band)}
                    style={{ marginBottom: 8 }}
                  />
                ))}
              </View>
              <ConsentRow consent={consent} onChange={setConsent} />
            </Card>
          ) : null}
        </View>

        <View style={{ marginTop: 24 }}>
          <ProgressDots total={SLIDES.length} current={currentSlide} />
          {currentSlide > 0 ? (
            <SecondaryButton
              label="Back"
              style={{ marginTop: 16 }}
              onPress={handleBack}
            />
          ) : null}
          <PrimaryButton
            label={isFinalSlide ? "Continue" : "Next"}
            style={{ marginTop: 12 }}
            onPress={handleContinue}
            disabled={!canContinue || saving}
          />
          <Text
            style={{
              textAlign: "center",
              marginTop: 12,
              color: "#6B6B6B",
              fontSize: 13,
            }}
          >
            By continuing you agree to FaceFit storing your age band and consent
            locally.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ConsentRow({
  consent,
  onChange,
}: {
  consent: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Pressable
      style={{
        marginTop: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
      onPress={() => onChange(!consent)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: consent }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: consent ? "#0A0A0A" : "#E6E6EA",
          backgroundColor: consent ? "#0A0A0A" : "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {consent ? (
          <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>✓</Text>
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, color: "#0A0A0A", marginBottom: 2 }}>
          I consent to FaceFit storing this photo locally for 30 days.
        </Text>
        <Text style={{ fontSize: 13, color: "#6B6B6B" }}>
          You can revoke or delete scans anytime in Settings.
        </Text>
      </View>
    </Pressable>
  );
}
