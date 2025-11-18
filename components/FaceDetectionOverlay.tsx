import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/Tokens';

/**
 * Props for FaceDetectionOverlay component
 */
export interface FaceDetectionOverlayProps {
  isCentered: boolean;
  isDetecting: boolean;
}

/**
 * Animated overlay that guides user to center their face
 * Border color transitions from red → yellow → green based on centering state
 */
export function FaceDetectionOverlay({
  isCentered,
  isDetecting,
}: FaceDetectionOverlayProps) {
  // Animated value to drive border color
  const borderColorValue = useSharedValue(0);

  // Animate border color based on centering state
  // 0 = red (not centered), 1 = green (centered)
  useEffect(() => {
    const targetValue = isCentered ? 1 : 0;
    borderColorValue.value = withTiming(targetValue, {
      duration: 300,
    });
  }, [isCentered, borderColorValue]);

  // Interpolate color between red and green
  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      borderColorValue.value,
      [0, 1],
      [Colors.brandPink, Colors.successGreen],
      'RGB'
    );

    return {
      borderColor,
    };
  });

  return (
    <Animated.View
      style={[styles.container, animatedBorderStyle]}
      pointerEvents="none"
    >
      {/* Corner guides */}
      <View style={styles.cornerGuide} />
      <View style={[styles.cornerGuide, styles.cornerTopRight]} />
      <View style={[styles.cornerGuide, styles.cornerBottomLeft]} />
      <View style={[styles.cornerGuide, styles.cornerBottomRight]} />

      {/* Guidance dots around the face */}
      <View
        style={[
          styles.guidanceDot,
          styles.dotTop,
          { opacity: isDetecting ? 0.8 : 0.3 },
        ]}
      />
      <View
        style={[
          styles.guidanceDot,
          styles.dotBottom,
          { opacity: isDetecting ? 0.8 : 0.3 },
        ]}
      />
      <View
        style={[
          styles.guidanceDot,
          styles.dotLeft,
          { opacity: isDetecting ? 0.8 : 0.3 },
        ]}
      />
      <View
        style={[
          styles.guidanceDot,
          styles.dotRight,
          { opacity: isDetecting ? 0.8 : 0.3 },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    width: '80%',
    aspectRatio: 1,
    borderWidth: 3,
    borderRadius: 500, // Large value for circle effect
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Corner guides (small rectangles in corners)
  cornerGuide: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'inherit',
    top: -3,
    left: -3,
  },

  cornerTopRight: {
    top: -3,
    left: undefined,
    right: -3,
    borderTopWidth: 2,
    borderLeftWidth: 0,
    borderRightWidth: 2,
  },

  cornerBottomLeft: {
    top: undefined,
    bottom: -3,
    left: -3,
    borderTopWidth: 0,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
  },

  cornerBottomRight: {
    top: undefined,
    bottom: -3,
    right: -3,
    borderLeftWidth: 0,
    borderRightWidth: 2,
    borderBottomWidth: 2,
  },

  // Guidance dots around perimeter
  guidanceDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentCyan,
  },

  dotTop: {
    top: -15,
    alignSelf: 'center',
  },

  dotBottom: {
    bottom: -15,
    alignSelf: 'center',
  },

  dotLeft: {
    left: -15,
    alignSelf: 'center',
  },

  dotRight: {
    right: -15,
    alignSelf: 'center',
  },
});
