import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

const ACCENT = "#F18A1B";
const LOGO_SIZE = 220;

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.safeArea}>
      <View style={styles.center}>
        <View style={styles.logoShell}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start BetterSkin scan"
            hitSlop={16}
            style={styles.logoButton}
            onPress={() => router.push("/(tabs)/scan")}
          >
            <View style={styles.logo}>
              <Text style={styles.logoWordmark}>BETTERSKIN</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9F5EF",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logoShell: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 18,
  },
  logoButton: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0, 0, 0, 0.15)",
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 36,
    shadowOpacity: 1,
    elevation: 18,
  },
  logo: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoWordmark: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 5,
    textTransform: "uppercase",
    color: "#0A0A0A",
  },
});
