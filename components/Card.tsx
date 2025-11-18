import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, CardSizes, Shadows } from '@/constants/Tokens';

type CardVariant = 'standard' | 'listItem' | 'option';

interface CardProps {
  /** Card visual style variant */
  variant?: CardVariant;
  /** Card content */
  children: React.ReactNode;
  /** Active/selected state (for option variant) */
  active?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** Disable shadow */
  noShadow?: boolean;
}

export function Card({
  variant = 'standard',
  children,
  active = false,
  style,
  noShadow = false,
}: CardProps) {
  const containerStyle = [
    styles.base,
    variant === 'standard' && styles.standard,
    variant === 'listItem' && styles.listItem,
    variant === 'option' && styles.option,
    variant === 'option' && active && styles.optionActive,
    !noShadow && (variant === 'listItem' ? Shadows.cardLight : Shadows.card),
    style,
  ];

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.white,
  },
  standard: {
    borderRadius: CardSizes.standard.borderRadius,
    padding: CardSizes.standard.padding,
  },
  listItem: {
    borderRadius: CardSizes.listItem.borderRadius,
    padding: CardSizes.listItem.padding,
    marginBottom: CardSizes.listItem.marginBottom,
  },
  option: {
    minHeight: CardSizes.option.height,
    borderRadius: CardSizes.option.borderRadius,
    paddingHorizontal: CardSizes.option.paddingHorizontal,
    paddingVertical: CardSizes.option.paddingVertical,
    borderWidth: CardSizes.option.borderWidth,
    borderColor: 'transparent',
    backgroundColor: Colors.lavender,
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: Colors.white,
    borderWidth: CardSizes.option.activeBorderWidth,
    borderColor: Colors.brandPink,
  },
});
