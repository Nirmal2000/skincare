import { BorderRadius, Colors, Spacing } from '@/constants/Tokens';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated';
import { FacialArea } from './ScanLoadingScreen';

interface FacialAreaLabelProps {
  area: FacialArea;
  order: number; // 0-4, determines animation start delay
}

// Position calculations for labels around the circular face image
// Image container is 220x220, face image is 200x200 centered within it
// So the center of the circle is at (110, 110) relative to the image container
const IMAGE_CONTAINER_SIZE = 220;
const FACE_IMAGE_SIZE = 100;
const CIRCLE_CENTER_OFFSET = IMAGE_CONTAINER_SIZE / 2; // 110
const CIRCLE_RADIUS = FACE_IMAGE_SIZE / 2 + 20; // 100 + 20px padding for label width

function getPositionStyle(position: FacialArea['position']) {
  switch (position) {
    case 'top':
      // Position above the forehead area, slightly above center-top of circle
      return {
        top: CIRCLE_CENTER_OFFSET - CIRCLE_RADIUS - 30, // 110 - 100 - 30 = -20
        left: CIRCLE_CENTER_OFFSET - 45, // Center horizontally, accounting for label width
      };
    case 'bottom-left':
      // Position below left cheek area
      return {
        top: CIRCLE_CENTER_OFFSET + CIRCLE_RADIUS + 10, // 110 + 100 + 10 = 220
        left: CIRCLE_CENTER_OFFSET - CIRCLE_RADIUS + 10, // 110 - 100 + 10 = 20
      };
    case 'bottom-right':
      // Position below right cheek area
      return {
        top: CIRCLE_CENTER_OFFSET + CIRCLE_RADIUS + 10, // 110 + 100 + 10 = 220
        right: CIRCLE_CENTER_OFFSET - CIRCLE_RADIUS + 10, // 110 - 100 + 10 = 20 (relative to right edge)
      };
    case 'left':
      // Position to the left of left cheek
      return {
        top: CIRCLE_CENTER_OFFSET - 10, // Center vertically, slight adjustment
        left: CIRCLE_CENTER_OFFSET - CIRCLE_RADIUS - 30, // 110 - 100 - 30 = -20
      };
    case 'right':
      // Position to the right of right cheek
      return {
        top: CIRCLE_CENTER_OFFSET - 10, // Center vertically, slight adjustment
        right: CIRCLE_CENTER_OFFSET - CIRCLE_RADIUS - 30, // 110 - 100 - 30 = -20 (relative to right edge)
      };
    default:
      return { top: CIRCLE_CENTER_OFFSET, left: CIRCLE_CENTER_OFFSET };
  }
}

export default function FacialAreaLabel({
  area,
  order,
}: FacialAreaLabelProps) {
  // Tick appears after 2 seconds per order (0s, 2s, 4s, 6s, 8s)
  const tickDelay = order * 2000;

  // Animation values
  const tickScale = useSharedValue(0);
  const tickOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate tick appearance
    tickOpacity.value = withDelay(
      tickDelay,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      })
    );

    tickScale.value = withDelay(
      tickDelay,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, []);

  const tickAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tickOpacity.value,
    transform: [{ scale: tickScale.value }],
  }));

  const positionStyle = getPositionStyle(area.position);

  return (
    <View style={[styles.labelContainer, positionStyle]}>
      {/* Label box */}
      <View style={styles.labelBox}>
        {/* Tick */}
        <Animated.View style={[styles.tickContainer, tickAnimatedStyle]}>
          <Text style={styles.tickText}>✓</Text>
        </Animated.View>

        {/* Text */}
        <Text style={styles.labelText}>{area.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    position: 'absolute',
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },

  labelBox: {
    backgroundColor: 'rgba(50, 50, 50, 0.9)',
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.default,
    paddingVertical: Spacing.small,
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.small,
    borderColor: 'rgba(255, 45, 146, 0.3)',
    borderWidth: 1,
  },

  tickContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.successGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tickText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },

  labelText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
});
