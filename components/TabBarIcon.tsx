// TabBarIcon.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Tokens';

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
};

export const TabBarIcon: React.FC<Props> = ({ name, focused }) => {
  const blob = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(blob, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 200,
    }).start();
  }, [focused, blob]);

  const scale = blob.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1], // grows into a blob
  });

  const opacity = blob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.blob,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      />
      <Ionicons
        name={name}
        size={28}
        color={focused ? Colors.brandPrimary : Colors.textTertiary}
        style={styles.icon}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  blob: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(77, 124, 255, 0.18)', // soft blue glow
  },
  icon: {
    marginTop: 0,
  },
});
