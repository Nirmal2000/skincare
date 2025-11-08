import { useRouter } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton, SecondaryButton } from "@/lib/ui/facefit-components";

export default function Home() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.copy}>
          <Text style={styles.title}>FaceFit</Text>
          <Text style={styles.subtitle}>
            Your calm companion for makeup-free skin insights. Finish
            onboarding, then tap Scan to start capturing.
          </Text>
        </View>
        <View style={styles.actions}>
          <PrimaryButton
            label="Go to Scan"
            onPress={() => router.push("/(tabs)/scan")}
            style={styles.button}
          />
          <SecondaryButton
            label="View history"
            onPress={() => router.push("/(tabs)/history")}
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    justifyContent: "space-between",
  },
  copy: {
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B6B6B",
  },
  actions: {
    gap: 12,
  },
  button: {
    alignSelf: "stretch",
  },
});
