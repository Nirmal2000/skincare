import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

export function useScanLineAnimation(height: number) {
  const lineY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const travelDistance = Math.max(height - 2, 0);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(lineY, {
          toValue: travelDistance,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(lineY, {
          toValue: 0,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [height, lineY]);

  return lineY;
}
