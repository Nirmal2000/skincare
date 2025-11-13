import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProfileCard } from "@/features/auth/profile-card";
import { useSupabaseSession } from "@/features/auth/useSupabaseSession";
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
import { INTRO_BG, INTRO_CARD_STYLE } from "../(onboarding)/welcome.constants";

const AUTO_DELETE_OPTIONS = [7, 30, 90];
const PRIVACY_URL = "https://facefit.example.com/privacy";
const TERMS_URL = "https://facefit.example.com/terms";

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, signOut } = useSupabaseSession();
  const { settings, ready } = useSettings();
  const [deleting, setDeleting] = useState(false);
  const insets = useSafeAreaInsets();

  const navigateToAgeEdit = () => {
    router.push("/edit-age");
  };

  const handleAutoDeleteChange = (days: number) => {
    setAutoDeleteDays(days);
  };

  const handleMembershipPress = () => {
    router.push("/(tabs)/membership");
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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 48 },
        ]}
      >
        {profile ? (
          <ProfileCard
            profile={profile}
            ageBand={settings.ageBand}
            onEditAge={navigateToAgeEdit}
            style={styles.cardSurface}
          />
        ) : (
          <Card style={[styles.cardSurface, { gap: 12 }]}>
            <Text style={styles.title}>Not signed in</Text>
            <Text style={styles.subtitle}>
              Sign in from the Scan tab to access account options.
            </Text>
          </Card>
        )}

        {profile ? (
          <SecondaryButton label="Sign out" onPress={() => signOut()} />
        ) : null}

        <Card title="Membership" style={[styles.cardSurface, { gap: 12 }]}>
          <Text style={styles.subtitle}>
            Manage BetterSkin Pro, change plans, or restore purchases anytime.
          </Text>
          <PrimaryButton label="Manage membership" onPress={handleMembershipPress} />
        </Card>

        <Card title="Auto-delete window" style={[styles.cardSurface, { gap: 16 }]}>
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

        <Card title="Privacy & terms" style={[styles.cardSurface, { gap: 12 }]}>
          <SecondaryButton
            label="Privacy policy"
            onPress={() => openLink(PRIVACY_URL)}
          />
          <SecondaryButton label="Terms of use" onPress={() => openLink(TERMS_URL)} />
        </Card>

        <Card title="Storage" style={[styles.cardSurface, { gap: 12 }]}>
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
    backgroundColor: INTRO_BG,
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cardSurface: {
    ...INTRO_CARD_STYLE,
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
});
