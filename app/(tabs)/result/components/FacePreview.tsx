import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";

import type { RegionId, RegionReport } from "@/features/results/region-config";
import type { FaceLandmarkPoint } from "@/features/scans/landmark-points";
import type { RegionSelectHandler } from "../types";

type FacePreviewProps = {
  imageUri: string;
  regions: RegionReport[];
  selectedRegionId: RegionId | null;
  onSelectRegion: RegionSelectHandler;
  imageSize: { width: number; height: number } | null;
};

const DOT_HITBOX = 32;

export function FacePreview({
  imageUri,
  regions,
  selectedRegionId,
  onSelectRegion,
  imageSize,
}: FacePreviewProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const positionedDots = useMemo(() => {
    if (!imageSize || layout.width === 0 || layout.height === 0) {
      return [];
    }
    return regions
      .map((region) => {
        if (!region.dot) return null;
        const mapped = mapPoint(region.dot, imageSize, layout);
        if (!mapped) return null;
        return { ...mapped, regionId: region.id };
      })
      .filter(Boolean) as Array<
      { regionId: RegionId } & FaceLandmarkPoint
    >;
  }, [imageSize, layout.height, layout.width, regions]);

  const handleLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== layout.width || height !== layout.height) {
      setLayout({ width, height });
    }
  }, [layout.height, layout.width]);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Image source={{ uri: imageUri }} style={styles.image} />
      {positionedDots.map((dot) => {
        const selected = dot.regionId === selectedRegionId;
        return (
          <Pressable
            key={dot.regionId}
            hitSlop={8}
            style={[
              styles.dotHitbox,
              {
                left: dot.x - DOT_HITBOX / 2,
                top: dot.y - DOT_HITBOX / 2,
                width: DOT_HITBOX,
                height: DOT_HITBOX,
              },
            ]}
            onPress={() => onSelectRegion(dot.regionId, { scroll: true })}
          >
            <View
              pointerEvents="none"
              style={[
                styles.dot,
                selected ? styles.dotSelected : null,
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function mapPoint(
  point: FaceLandmarkPoint,
  sourceSize: { width: number; height: number },
  targetSize: { width: number; height: number },
) {
  if (sourceSize.width === 0 || sourceSize.height === 0) {
    return null;
  }
  return {
    x: (point.x / sourceSize.width) * targetSize.width,
    y: (point.y / sourceSize.height) * targetSize.height,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  image: {
    flex: 1,
  },
  dotHitbox: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    opacity: 0.9,
  },
  dotSelected: {
    transform: [{ scale: 1.3 }],
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
