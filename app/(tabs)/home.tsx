import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const ACCENT = "#F18A1B";
const LOGO_SIZE = 220;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Home() {
  const router = useRouter();
  const pressProgress = useSharedValue(0);
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 - pressProgress.value * 0.04 },
      { translateY: pressProgress.value * 6 },
    ],
  }));

  return (
    <View style={styles.safeArea}>
      <View style={styles.center}>
        <View style={styles.logoShell}>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel="Scan your skin"
            hitSlop={16}
            style={[styles.logoButton, logoAnimatedStyle]}
            onPressIn={() => {
              pressProgress.value = withTiming(1, { duration: 90 });
            }}
            onPressOut={() => {
              pressProgress.value = withTiming(0, { duration: 140 });
            }}
            onPress={() => router.push("/(tabs)/scan")}
          >
            <View style={styles.logo}>
              <Text style={styles.logoWordmark}>SCAN</Text>
            </View>
          </AnimatedPressable>
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
    fontWeight: "500",
    letterSpacing: 1,
    textAlign: "center",
    color: "#0A0A0A",
  },
});
