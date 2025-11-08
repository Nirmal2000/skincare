import { useEffect, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  ACCENT_COLOR,
  AGE_VALUES,
  AGE_WHEEL_DATA,
  DEFAULT_AGE,
  WHEEL_ITEM_HEIGHT,
  WHEEL_WINDOW_BG,
  WHEEL_WINDOW_BORDER,
  WHEEL_PADDING,
} from "../welcome.constants";

export type AgeScrollerProps = {
  value: number | null;
  onChange: (next: number) => void;
};

export function AgeScroller({ value, onChange }: AgeScrollerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const initialOffsetRef = useRef<number | null>(null);
  const committedAge = value ?? DEFAULT_AGE;
  const [displayAge, setDisplayAge] = useState<number>(committedAge);

  const baseIndex = AGE_VALUES.indexOf(committedAge);
  const resolvedIndex = baseIndex >= 0 ? baseIndex : AGE_VALUES.indexOf(DEFAULT_AGE);
  const targetIndex = resolvedIndex + WHEEL_PADDING;
  const targetOffset = targetIndex * WHEEL_ITEM_HEIGHT;
  if (initialOffsetRef.current === null) {
    initialOffsetRef.current = targetOffset;
  }

  useEffect(() => {
    if (!scrollRef.current) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: initialOffsetRef.current ?? 0, animated: false });
    });
  }, []);

  function centerIndexFromY(y: number) {
    return Math.round((y + WHEEL_ITEM_HEIGHT * 2) / WHEEL_ITEM_HEIGHT);
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = event.nativeEvent.contentOffset.y;
    const idx = centerIndexFromY(y);
    const next = AGE_WHEEL_DATA[idx];
    if (typeof next === "number" && next !== displayAge) {
      setDisplayAge(next);
    }
  }

  function handleMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = event.nativeEvent.contentOffset.y;
    const idx = centerIndexFromY(y);
    const next = AGE_WHEEL_DATA[idx];
    if (typeof next === "number") {
      setDisplayAge(next);
      if (next !== value) onChange(next);
    }
  }

  return (
    <View style={{ marginTop: 16 }}>
      <View
        style={{
          height: WHEEL_ITEM_HEIGHT * 5,
          borderRadius: 24,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.08)",
          shadowColor: "rgba(0,0,0,0.04)",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 8,
          overflow: "hidden",
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: (WHEEL_ITEM_HEIGHT * 5 - WHEEL_ITEM_HEIGHT) / 2,
            left: 10,
            right: 10,
            height: WHEEL_ITEM_HEIGHT,
            borderRadius: 16,
            backgroundColor: WHEEL_WINDOW_BG,
            borderWidth: 1,
            borderColor: WHEEL_WINDOW_BORDER,
            shadowColor: "rgba(0,0,0,0.05)",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 1,
            shadowRadius: 12,
          }}
        />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={WHEEL_ITEM_HEIGHT}
          decelerationRate="fast"
          contentContainerStyle={{}}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumEnd}
          scrollEventThrottle={16}
        >
          {AGE_WHEEL_DATA.map((item, index) => (
            <View
              key={`age-${index}-${item ?? "empty"}`}
              style={{
                height: WHEEL_ITEM_HEIGHT,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: item === displayAge ? "700" : "500",
                  color: item === displayAge ? ACCENT_COLOR : "#C2C2C6",
                }}
              >
                {item ?? ""}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
