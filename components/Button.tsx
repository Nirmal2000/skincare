import { ButtonSizes, Colors, Shadows, Typography } from '@/constants/Tokens';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'white' | 'icon' | 'circular';

interface ButtonProps {
  /** Button text label */
  title?: string;
  /** Button click handler */
  onPress: () => void;
  /** Button visual style variant */
  variant?: ButtonVariant;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state (shows spinner) */
  loading?: boolean;
  /** Custom icon component (for icon/circular variants) */
  icon?: React.ReactNode;
  /** Right icon component */
  rightIcon?: React.ReactNode;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
  /** Enable haptic feedback on press */
  haptic?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  rightIcon,
  style,
  textStyle,
  haptic = true,
}: ButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;

    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress();
  };

  const containerStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'white' && styles.white,
    variant === 'icon' && styles.icon,
    variant === 'circular' && styles.circular,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    variant === 'primary' && styles.textPrimary,
    variant === 'secondary' && styles.textSecondary,
    variant === 'white' && styles.textWhite,
    disabled && styles.textDisabled,
    textStyle,
  ];

  // Primary button uses gradient background
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled || loading}
        onPress={handlePress}
        style={containerStyle}
      >
        <LinearGradient
          colors={[Colors.brandPrimary, Colors.brandSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={textStyles}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Icon and circular variants
  if (variant === 'icon' || variant === 'circular') {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled || loading}
        onPress={handlePress}
        style={containerStyle}
      >
        {loading ? <ActivityIndicator color={Colors.textPrimary} /> : icon}
        {title && variant === 'circular' && (
          <Text style={textStyles}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  // Secondary, white, and other variants
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={handlePress}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'white' ? Colors.black : Colors.textPrimary} />
      ) : (
        <View style={styles.contentRow}>
          <Text style={textStyles}>{title}</Text>
          {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  primary: {
    height: ButtonSizes.primary.height,
    paddingHorizontal: ButtonSizes.primary.paddingHorizontal,
    paddingVertical: ButtonSizes.primary.paddingVertical,
    borderRadius: ButtonSizes.primary.borderRadius,
  },
  secondary: {
    height: ButtonSizes.primary.height,
    paddingHorizontal: ButtonSizes.primary.paddingHorizontal,
    paddingVertical: ButtonSizes.primary.paddingVertical,
    borderRadius: ButtonSizes.primary.borderRadius,
    backgroundColor: Colors.brandSecondary,
  },
  white: {
    height: ButtonSizes.primary.height,
    paddingHorizontal: ButtonSizes.primary.paddingHorizontal,
    paddingVertical: ButtonSizes.primary.paddingVertical,
    borderRadius: ButtonSizes.primary.borderRadius,
    backgroundColor: Colors.white,
  },
  icon: {
    width: ButtonSizes.icon.size,
    height: ButtonSizes.icon.size,
    borderRadius: ButtonSizes.icon.borderRadius,
    backgroundColor: Colors.white,
    ...Shadows.cardLight,
  },
  circular: {
    width: ButtonSizes.circular.size,
    height: ButtonSizes.circular.size,
    borderRadius: ButtonSizes.circular.borderRadius,
    backgroundColor: Colors.white,
    ...Shadows.button,
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ButtonSizes.primary.borderRadius,
  },
  text: {
    ...Typography.button,
    textAlign: 'center',
  },
  textPrimary: {
    color: Colors.white,
  },
  textSecondary: {
    color: Colors.textPrimary,
  },
  textWhite: {
    color: Colors.black,
  },
  textDisabled: {
    opacity: 0.6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightIconContainer: {
    marginLeft: 0,
  },
});
