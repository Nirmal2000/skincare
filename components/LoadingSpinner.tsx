import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Tokens';

interface LoadingSpinnerProps {
  /** Spinner size */
  size?: number;
  /** Spinner color */
  color?: string;
  /** Custom container style */
  style?: ViewStyle;
}

export function LoadingSpinner({
  size = 40,
  color = Colors.brandPink,
  style,
}: LoadingSpinnerProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1, // Infinite repeat
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[animatedStyle, { width: size, height: size }]}>
        <View
          style={[
            styles.spinner,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: size / 10,
              borderTopColor: color,
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    // Dynamic styles applied inline
  },
});
