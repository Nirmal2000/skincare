import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/Tokens';
import { FacialArea } from './ScanLoadingScreen';

interface FacialAreaLabelProps {
  area: FacialArea;
  order: number; // 0-4, determines animation start delay
}

// Position calculations for labels around the circle
const CIRCLE_CENTER = { x: Dimensions.get('window').width / 2, y: 0 };
const CIRCLE_RADIUS = 120;

function getPositionStyle(position: FacialArea['position']) {
  switch (position) {
    case 'top':
      return {
        top: -120,
        left: -60,
      };
    case 'bottom-left':
      return {
        bottom: -100,
        left: -80,
      };
    case 'bottom-right':
      return {
        bottom: -100,
        right: -80,
      };
    case 'left':
      return {
        left: -100,
        top: 40,
      };
    case 'right':
      return {
        right: -100,
        top: 40,
      };
    default:
      return { top: 0, left: 0 };
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
