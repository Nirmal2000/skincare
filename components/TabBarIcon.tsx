import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Icons } from '@/constants/Tokens';

interface TabBarIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}

export function TabBarIcon({ name, focused }: TabBarIconProps) {
  return (
    <Ionicons
      name={name}
      size={Icons.tabBar}
      color={focused ? Colors.brandPink : Colors.textTertiary}
      style={styles.icon}
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    marginBottom: -3,
  },
});
