import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { updateAgeBand } from "@/features/onboarding/onboarding-store";
import { useSettings } from "@/features/settings/settings-store";
import {
  Card,
  PrimaryButton,
  SecondaryButton,
} from "@/lib/ui/facefit-components";

import { AgeScroller } from "./(onboarding)/components/AgeScroller";
import { DEFAULT_AGE } from "./(onboarding)/welcome.constants";

export default function EditAgeScreen() {
  const router = useRouter();
  const { settings } = useSettings();

  const initialAge = useMemo(() => {
    const parsed = settings.ageBand ? Number(settings.ageBand) : DEFAULT_AGE;
    return Number.isFinite(parsed) ? parsed : DEFAULT_AGE;
  }, [settings.ageBand]);

  const [ageValue, setAgeValue] = useState<number | null>(initialAge);
  const [saving, setSaving] = useState(false);

  const hasChanges =
    ageValue != null &&
    (settings.ageBand === null || String(ageValue) !== settings.ageBand);

  const handleCancel = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!ageValue) return;
    setSaving(true);
    await updateAgeBand(String(ageValue));
    setSaving(false);
    router.back();
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={{ gap: 12 }}>
          <Text style={styles.title}>Update your age</Text>
          <Text style={styles.subtitle}>
            BetterSkin uses your age to personalize care tips. Adjust anytime to keep
            recommendations accurate.
          </Text>
        </View>

        <Card style={styles.card}>
          <AgeScroller value={ageValue} onChange={setAgeValue} />
        </Card>
      </View>

      <View style={styles.actions}>
        <SecondaryButton label="Cancel" onPress={handleCancel} />
        <PrimaryButton
          label={saving ? "Saving..." : "Save"}
          onPress={handleSave}
          disabled={!hasChanges || saving || !ageValue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9F5EF",
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  subtitle: {
    fontSize: 15,
    color: "#5C5C5C",
  },
  card: {
    paddingVertical: 24,
  },
  actions: {
    padding: 24,
    gap: 12,
  },
});
