import { Image } from "expo-image";
import { memo } from "react";
import { StyleSheet, View } from "react-native";

const DOT_SIZE = 12;

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
};

export const FaceIssueOverlay = memo(function FaceIssueOverlay({
  imageUri,
  height,
  markers,
}: FaceIssueOverlayProps) {
  return (
    <View style={[styles.container, { height }] }>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {markers.map((marker) => (
          <View
            key={marker.id}
            style={[
              styles.dot,
              {
                backgroundColor: marker.color,
                left: `${Math.min(Math.max(marker.x, 0), 1) * 100}%`,
                top: `${Math.min(Math.max(marker.y, 0), 1) * 100}%`,
                marginLeft: -DOT_SIZE / 2,
                marginTop: -DOT_SIZE / 2,
              },
            ]}
          />
        ))}
      </View>
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
