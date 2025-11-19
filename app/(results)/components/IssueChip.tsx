import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Spacing, Typography } from '@/constants/Tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface IssueChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

export function IssueChip({ label, isSelected, onPress }: IssueChipProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.chip,
        isSelected && styles.chipSelected,
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 24,
    marginRight: Spacing.default,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  chipText: {
    ...Typography.body,
    color: Colors.white,    
  },
  chipTextSelected: {
    color: Colors.textPrimary,
  },
});
