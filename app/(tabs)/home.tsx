import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";

const ACCENT = "#F18A1B";

export default function Home() {
  const router = useRouter();
  const borderPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(borderPulse, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: false,
        }),
        Animated.timing(borderPulse, {
          toValue: 0,
          duration: 2600,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [borderPulse]);

  const animatedRingStyle = {
    borderColor: borderPulse.interpolate({
      inputRange: [0, 1],
      outputRange: ["rgba(241, 138, 27, 0.3)", ACCENT],
    }),
    shadowOpacity: borderPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.15, 0.4],
    }),
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.center}>
        <Animated.View style={[styles.ring, animatedRingStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start FaceFit scan"
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
        </Animated.View>
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
  ring: {
    borderWidth: 3,
    borderStyle: "dashed",
    borderRadius: 200,
    padding: 18,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 32,
    elevation: 12,
  },
  logoButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
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
