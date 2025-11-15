import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, View } from "react-native";

const ACCENT = "#F18A1B";
const LOGO_SIZE = 220;

export default function Home() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.center}>
        <View style={styles.logoShell}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start BetterSkin scan"
            hitSlop={16}
            style={styles.logoButton}
            onPress={() => router.push("/(tabs)/scan")}
          >
            <Image
              source={require("@/assets/images/fflogo.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
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
    width: "70%",
    aspectRatio: 1,
  },
});
