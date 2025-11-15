import { Image } from "expo-image";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const DOT_SIZE = 24;
const FADE_OUT_DURATION = 220;
const FADE_IN_DURATION = 260;

export type IssueMarker = {
  id: string;
  x: number; // normalized 0-1 (left)
  y: number; // normalized 0-1 (top)
  color: string;
  region?: string | null;
  rawX?: number | null;
  rawY?: number | null;
};

type FaceIssueOverlayProps = {
  imageUri: string | null;
  height: number;
  markers: IssueMarker[];
  activeIssueKey?: string | null;
};

export const FaceIssueOverlay = memo(function FaceIssueOverlay({
  imageUri,
  height,
  markers,
  activeIssueKey = null,
}: FaceIssueOverlayProps) {
  const [renderedMarkers, setRenderedMarkers] = useState(markers);
  const dotsOpacity = useSharedValue(1);
  const previousIssueRef = useRef<string | null>(activeIssueKey);

  useEffect(() => {
    const prevKey = previousIssueRef.current;
    const keyChanged = Boolean(prevKey && activeIssueKey && prevKey !== activeIssueKey);
    if (!keyChanged) {
      previousIssueRef.current = activeIssueKey;
      setRenderedMarkers(markers);
      dotsOpacity.value = withTiming(1, { duration: FADE_IN_DURATION });
      return;
    }

    previousIssueRef.current = activeIssueKey;
    dotsOpacity.value = withTiming(0, { duration: FADE_OUT_DURATION });
    let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      setRenderedMarkers(markers);
      dotsOpacity.value = withTiming(1, { duration: FADE_IN_DURATION });
    }, FADE_OUT_DURATION);
    return () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    };
  }, [activeIssueKey, markers, dotsOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

  const clampedMarkers = useMemo(
    () =>
      renderedMarkers.map((marker) => ({
        ...marker,
        x: Math.min(Math.max(marker.x, 0), 1),
        y: Math.min(Math.max(marker.y, 0), 1),
      })),
    [renderedMarkers],
  );

  return (
    <View style={[styles.container, { height }] }>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, overlayStyle]}>
        {clampedMarkers.map((marker) => (
          <View
            key={marker.id}
            style={[
              styles.dot,
              {
                backgroundColor: marker.color,
                left: `${marker.x * 100}%`,
                top: `${marker.y * 100}%`,
                marginLeft: -DOT_SIZE / 2,
                marginTop: -DOT_SIZE / 2,
              },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#050505",
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
  },
  dot: {
    position: "absolute",
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.4)",
  },
});
