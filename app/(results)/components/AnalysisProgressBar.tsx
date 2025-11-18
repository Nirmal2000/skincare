import { Spacing, Typography } from '@/constants/Tokens';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

interface AnalysisProgressBarProps {
  label: string;
  duration: number; // milliseconds
  delay?: number; // milliseconds before starting
  maxProgress?: number; // 0-100, default 100
  onComplete?: () => void;
}

export default function AnalysisProgressBar({
  label,
  duration,
  delay = 0,
  maxProgress = 100,
  onComplete,
}: AnalysisProgressBarProps) {
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withDelay(
      delay,
      withTiming(maxProgress, {
        duration,
        easing: Easing.linear,
      })
    );

    // Call onComplete when animation finishes
    if (onComplete) {
      const timer = setTimeout(onComplete, delay + duration);
      return () => clearTimeout(timer);
    }
  }, []);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.trackContainer}>
        <Animated.View
          style={[styles.progressFill, animatedProgressStyle]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.xl,
  },

  label: {
    ...Typography.body,
    color: '#FFFFFF',
    marginBottom: Spacing.small,
    fontWeight: '500',
    textAlign: 'center',
  },

  trackContainer: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
});
