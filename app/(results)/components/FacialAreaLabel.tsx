import { BorderRadius, Colors, Spacing } from '@/constants/Tokens';
import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
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
        right: CIRCLE_CENTER - CIRCLE_RADIUS - 50,
      };

    case 'bottom-left':
      return {
        top: CIRCLE_CENTER + CIRCLE_RADIUS + 10,
        left: CIRCLE_CENTER - CIRCLE_RADIUS - 50,
      };

    case 'bottom-right':
      return {
        top: CIRCLE_CENTER + CIRCLE_RADIUS - 0,
        right: CIRCLE_CENTER - CIRCLE_RADIUS - 40,
      };

    default:
      return { top: CIRCLE_CENTER, left: CIRCLE_CENTER };
  }
}

export default function FacialAreaLabel({
  area,
  order,
}: FacialAreaLabelProps) {
  // Tick appears after delay per order
  const tickDelay = order * 4000;

  // Animation values
  const tickScale = useSharedValue(0);
  const tickOpacity = useSharedValue(0);

  // Single angle value for smooth circular motion
  const angle = useSharedValue(0);

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

    // Circular motion parameters
    const motionStartDelay = tickDelay + 300; // Start after tick animation completes
    const duration = 10000 + order * 1500; // slower & smoother
    const fullRotation = 2 * Math.PI;

    angle.value = withDelay(
      motionStartDelay,
      withRepeat(
        withTiming(fullRotation, {
          duration,
          easing: Easing.linear, // constant angular speed = smooth circle
        }),
        -1, // infinite
        false // don't reverse; keep same direction
      )
    );
  }, [tickDelay, order, tickOpacity, tickScale, angle]);

  const tickAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tickOpacity.value,
    transform: [{ scale: tickScale.value }],
  }));

  // Circular motion style for the entire label container
  const motionAnimatedStyle = useAnimatedStyle(() => {
    const RADIUS = 4; // Very subtle circular motion
    const phaseOffset = order * 0.6; // Different starting positions for each label
    const currentAngle = angle.value + phaseOffset;

    return {
      transform: [
        { translateX: RADIUS * Math.cos(currentAngle) },
        { translateY: RADIUS * Math.sin(currentAngle) },
      ],
    };
  });

  const positionStyle = getPositionStyle(area.position);

  return (
    <Animated.View style={[styles.labelContainer, positionStyle, motionAnimatedStyle]}>
      {/* Label box with backdrop blur */}
      <BlurView intensity={20} tint="dark" style={styles.labelBox}>
        {/* Tick */}
        <Animated.View style={[styles.tickContainer, tickAnimatedStyle]}>
          <Text style={styles.tickText}>✓</Text>
        </Animated.View>

        {/* Text */}
        <Text style={styles.labelText}>{area.label}</Text>
      </BlurView>
    </Animated.View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BorderRadius.medium,
    paddingHorizontal: 8,
    paddingVertical: Spacing.small,
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.small,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    // Glow shadow effect
    shadowColor: Colors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden', // Important for BlurView on Android
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
