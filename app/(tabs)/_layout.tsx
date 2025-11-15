// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import React, { useEffect } from "react";
import {
  Dimensions,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTabBarVisibility } from "@/features/navigation/tab-bar-visibility";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const ACTIVE_COLOR = "#ec9810ff";
const INACTIVE_COLOR = "rgba(255,255,255,0.8)";

const BAR_BG = "#000000";
const BAR_RADIUS = 28;
const BAR_H = 64; // overall pill height
const ICON_SIZE = 24;
const MAX_BAR_WIDTH = 360;

function TabIcon({
  name,
  focused,
}: {
  name: IoniconName;
  focused: boolean;
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name={name}
        size={ICON_SIZE}
        color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
      />
    </View>
  );
}


type FloatingTabBarProps = BottomTabBarProps & {
  style?: StyleProp<ViewStyle>;
};

/**
 * Fully custom compact black pill tab bar (3 tabs).
 * Uses Pressable to control navigation and avoid any default white containers.
 */
const VISIBLE_TABS = new Set(["home", "history", "membership", "settings"]);

function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const hidden = useTabBarVisibility((s) => s.hidden);
  const setHidden = useTabBarVisibility((s) => s.setHidden);
  const translateY = useSharedValue(0);
  const fade = useSharedValue(1);
  const hideDistance = BAR_H + 64;

  useEffect(() => {
    translateY.value = withTiming(hidden ? hideDistance : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    fade.value = withTiming(hidden ? 0 : 1, { duration: 180 });
  }, [hidden, fade, translateY, hideDistance]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: fade.value,
  }));
  // Only include screens that are meant to be shown as tabs
  const routes = state.routes.filter((r) => VISIBLE_TABS.has(r.name));

  const windowWidth = Dimensions.get("window").width;
  const barWidth = Math.min(MAX_BAR_WIDTH, windowWidth - 32);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: insets.bottom + 20 }, animatedStyle]}
    >
      <View
        style={[
          styles.pill,
          {
            width: barWidth,
            height: BAR_H,
            alignSelf: "center",
          },
        ]}
      >
        <View style={styles.row}>
          {routes.map((route) => {
            const originalIndex = state.routes.findIndex((r) => r.key === route.key);
            const isFocused = state.index === originalIndex;
            const options = descriptors[route.key]?.options || {};
            const icon =
              options.tabBarIcon ??
              ((_props: { color: string; focused: boolean }) => null);

            const onPress = () => {
              setHidden(false);
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                style={styles.item}
                hitSlop={8}
              >
                {/* Render the icon via the screen's tabBarIcon for consistency */}
                {typeof icon === "function" ? (
                  icon({
                    color: isFocused ? ACTIVE_COLOR : INACTIVE_COLOR,
                    focused: isFocused,
                    size: ICON_SIZE,
                  })
                ) : (
                  <TabIcon
                    name={"ellipse-outline" as IoniconName}
                    focused={isFocused}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        // We provide our own custom bar below
      }}
      tabBar={(p) => <FloatingTabBar {...p} />}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-outline" focused={focused} />
          ),
        }}
      />      
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="time-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="membership"
        options={{
          title: "Membership",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="star-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings-outline" focused={focused} />
          ),
        }}
      />      
      {/*
      // Example hidden screen (won't appear in the bar)
      <Tabs.Screen
        name="result"
        options={{
          tabBarButton: () => null,
          tabBarStyle: { display: "none" },
        }}
      />
      */}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  pill: {
    backgroundColor: BAR_BG,
    borderRadius: BAR_RADIUS,
    paddingHorizontal: 25,
    // subtle elevation / shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
    gap: 4,
  },
  item: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },  
});
