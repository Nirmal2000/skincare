import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/Tokens';

interface IssueMarkerProps {
  x: number;
  y: number;
  index: number;
}

export function IssueMarker({ x, y, index }: IssueMarkerProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Staggered animation based on index
    const delay = index * 100;

    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 12,
        stiffness: 200,
      })
    );

    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 300 })
    );

    // Cleanup
    return () => {
      scale.value = 0;
      opacity.value = 0;
    };
  }, [x, y, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.marker,
        {
          left: x - 6, // Center the 12px dot
          top: y - 6,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
