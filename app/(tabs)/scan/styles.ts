import { StyleSheet } from "react-native";

import { ACCENT, OVAL_H, OVAL_W } from "./constants";

export const scanStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 24, gap: 16 },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#0A0A0A",
  },
  subhead: {
    fontSize: 14,
    textAlign: "center",
    color: "#6B6B6B",
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ovalShadow: {
    width: OVAL_W,
    height: OVAL_H,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 20 },
    elevation: 18,
  },
  fill: { width: "100%", height: "100%" },
  scanLine: {
    position: "absolute",
    left: 8,
    width: OVAL_W - 16,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.95)",
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  inlineActions: { flexDirection: "row", gap: 12, marginTop: 12 },
  inlineButton: { flex: 1, marginVertical: 0 },
  captureButton: { backgroundColor: ACCENT },
  detectionHint: {
    fontSize: 13,
    textAlign: "center",
    color: "#6B6B6B",
  },
  detectionHintReady: {
    color: ACCENT,
  },
  status: { color: "#C03515", fontSize: 14, marginTop: 4 },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "rgba(10,10,10,0.9)",
  },
  overlayText: { color: "#FFFFFF", fontWeight: "600" },
  cardTitle: { fontSize: 18, fontWeight: "600", color: "#0A0A0A" },
  cardCopy: { color: "#6B6B6B", fontSize: 14 },
});
