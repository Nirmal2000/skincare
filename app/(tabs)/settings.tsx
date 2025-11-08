import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";

import { ProfileCard } from "@/features/auth/profile-card";
import { useSupabaseSession } from "@/features/auth/useSupabaseSession";
import { resetOnboarding } from "@/features/onboarding/onboarding-store";
import { deleteAllScans } from "@/features/scans/scan-store";
import {
  setAutoDeleteDays,
  useSettings,
} from "@/features/settings/settings-store";
import {
  Card,
  Chip,
  PrimaryButton,
  SecondaryButton,
} from "@/lib/ui/facefit-components";

const AUTO_DELETE_OPTIONS = [7, 30, 90];
const PRIVACY_URL = "https://facefit.example.com/privacy";
const TERMS_URL = "https://facefit.example.com/terms";

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, signOut } = useSupabaseSession();
  const { settings, ready } = useSettings();
  const [deleting, setDeleting] = useState(false);

  const handleAutoDeleteChange = (days: number) => {
    setAutoDeleteDays(days);
  };

  const handleDeleteAll = () => {
    Alert.alert(
      "Delete all scans",
      "This removes every saved image and tip from your device. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAllScans();
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleUpdateConsent = () => {
    Alert.alert(
      "Update consent",
      "We will re-open onboarding so you can adjust your age band or consent.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: async () => {
            await resetOnboarding();
            router.replace("/(onboarding)/welcome");
          },
        },
      ],
    );
  };

  const openLink = (url: string) => {
    WebBrowser.openBrowserAsync(url).catch((error) => {
      console.warn("Failed to open browser", error);
    });
  };

  if (!ready) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loader}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        {profile ? (
          <ProfileCard profile={profile} ageBand={settings.ageBand} />
        ) : (
          <Card style={{ gap: 12 }}>
            <Text style={styles.title}>Not signed in</Text>
            <Text style={styles.subtitle}>
              Sign in from the Scan tab to access account options.
            </Text>
          </Card>
        )}

        {profile ? (
          <SecondaryButton label="Sign out" onPress={() => signOut()} />
        ) : null}

        <Card title="Auto-delete window" style={{ gap: 16 }}>
          <Text style={styles.subtitle}>
            Scans stay on-device for {settings.autoDeleteDays} days.
          </Text>
          <View style={styles.chipRow}>
            {AUTO_DELETE_OPTIONS.map((days) => (
              <Chip
                key={days}
                label={`${days} days`}
                selected={settings.autoDeleteDays === days}
                onPress={() => handleAutoDeleteChange(days)}
              />
            ))}
          </View>
        </Card>

        <Card title="Consent & privacy" style={{ gap: 12 }}>
          <Text style={styles.meta}>
            Age band: {settings.ageBand ?? "Not set"}
          </Text>
          <Text style={styles.meta}>
            Consent: {settings.consentGranted ? "Granted" : "Pending"}
          </Text>
          <SecondaryButton label="Update consent" onPress={handleUpdateConsent} />
          <SecondaryButton
            label="Privacy policy"
            onPress={() => openLink(PRIVACY_URL)}
          />
          <SecondaryButton label="Terms of use" onPress={() => openLink(TERMS_URL)} />
        </Card>

        <Card title="Storage" style={{ gap: 12 }}>
          <Text style={styles.subtitle}>
            All scans, tips, and metadata remain on this device only. You can
            clear them anytime.
          </Text>
          <PrimaryButton
            label={deleting ? "Deleting..." : "Delete all local images"}
            onPress={handleDeleteAll}
            disabled={deleting}
            style={{ backgroundColor: "#C03515" }}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 24,
    gap: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B6B6B",
  },
  meta: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
