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

// Image container is 220x220, face image is 200x200 centered
const IMAGE_CONTAINER_SIZE = 220;
const FACE_IMAGE_SIZE = 200;
const CIRCLE_CENTER = IMAGE_CONTAINER_SIZE / 2; // 110
const CIRCLE_RADIUS = FACE_IMAGE_SIZE / 2 + 30; // 100 + 30 = 130

function getPositionStyle(position: FacialArea['position']) {
  switch (position) {
    case 'top':
      // straight above
      return {
        top: CIRCLE_CENTER - CIRCLE_RADIUS - 60,
        left: CIRCLE_CENTER - 60,
      };

    case 'top-left':
      return {
        top: CIRCLE_CENTER - CIRCLE_RADIUS + 10,
        left: CIRCLE_CENTER - CIRCLE_RADIUS - 60,
      };

    case 'top-right':
      return {
        top: CIRCLE_CENTER - CIRCLE_RADIUS + 5,
        right: CIRCLE_CENTER - CIRCLE_RADIUS - 40,
      };

    case 'bottom-left':
      return {
        top: CIRCLE_CENTER + CIRCLE_RADIUS + 10,
        left: CIRCLE_CENTER - CIRCLE_RADIUS - 50,
      };

    case 'bottom-right':
      return {
        top: CIRCLE_CENTER + CIRCLE_RADIUS - 0,
        right: CIRCLE_CENTER - CIRCLE_RADIUS - 10,
      };

    default:
      return { top: CIRCLE_CENTER, left: CIRCLE_CENTER };
  }
}



export default function FacialAreaLabel({
  area,
  order,
}: FacialAreaLabelProps) {
  // Tick appears after 2 seconds per order (0s, 2s, 4s, 6s, 8s)
  const tickDelay = order * 4000;

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
    width: 130,
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
