import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Spacing, Typography } from '@/constants/Tokens';

interface IssueMarkerProps {
  x: number;
  y: number;
  index: number;
  intensity: number;
  description: string;
  isSelected: boolean;
  onPress: () => void;
  containerHeight: number;
  containerWidth: number;
}

export function IssueMarker({
  x,
  y,
  index,
  intensity,
  description,
  isSelected,
  onPress,
  containerHeight,
  containerWidth
}: IssueMarkerProps) {
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

  const intensityPercent = Math.round(intensity * 100);

  // Smart tooltip positioning
  const TOOLTIP_WIDTH = 250;
  const TOOLTIP_OFFSET = 20;
  const EDGE_PADDING = 16;

  // Vertical positioning (above or below marker)
  const tooltipAbove = y > containerHeight / 2;

  // Horizontal positioning (left or right of marker, or centered)
  let tooltipLeft = 6; // Default: slightly right of marker

  // Check if tooltip would go off right edge
  if (x + TOOLTIP_WIDTH + EDGE_PADDING > containerWidth) {
    // Position to the left of marker instead
    tooltipLeft = -(TOOLTIP_WIDTH - 6);
  }

  // Check if tooltip would go off left edge
  if (x + tooltipLeft < EDGE_PADDING) {
    tooltipLeft = EDGE_PADDING - x;
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: x - 6,
        top: y - 6,
      }}
    >
      <Pressable onPress={handlePress}>
        <Animated.View
          style={[
            styles.marker,
            animatedStyle,
          ]}
        />
      </Pressable>

      {isSelected && (
        <View
          style={[
            styles.tooltip,
            tooltipAbove ? styles.tooltipAbove : styles.tooltipBelow,
            { left: tooltipLeft },
          ]}
        >
          <Pressable style={styles.closeButton} onPress={handlePress}>
            <Ionicons name="close" size={16} color={Colors.black} />
          </Pressable>
          <Text style={styles.intensityText}>Intensity: {intensityPercent}%</Text>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
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
  tooltip: {
    position: 'absolute',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: Spacing.default,
    paddingVertical: Spacing.small,
    width: 250,
    shadowColor: Colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    zIndex: 1000, // Ensure tooltip appears above other markers
  },
  tooltipAbove: {
    bottom: 20, // Above the marker
  },
  tooltipBelow: {
    top: 20, // Below the marker
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 8,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    // backgroundColor: Colors.backgroundLight,
    zIndex: 1001,
  },
  intensityText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
    paddingRight: 24, // Space for close button
  },
  descriptionText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
