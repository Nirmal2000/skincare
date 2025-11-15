import { StyleSheet } from "react-native";

import { ACCENT } from "./constants";

export const scanStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#030303",
  },
  cameraStage: {
    flex: 1,
  },
  cameraLayer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  cameraFill: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    resizeMode: "cover",
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "column",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(10,10,10,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  homeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(10,10,10,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonIcon: {
    color: "#FFFFFF",
  },
  sampleThumb: {
    width: 72,
    height: 72,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    gap: 16,
  },
  hintText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
  captureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  galleryButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  captureButton: {
    flex: 1,
    height: 68,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  captureLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0A0A0A",
  },
  previewActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  secondaryAction: {
    flex: 1,
    height: 56,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  secondaryLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  primaryAction: {
    flex: 1,
    height: 56,
    borderRadius: 999,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(241, 138, 27, 0.35)",
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
  },
  primaryLabel: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledAction: {
    opacity: 0.5,
  },
  galleryIcon: {
    color: "#FFFFFF",
  },
  statusText: {
    textAlign: "center",
    color: "#F7A399",
    fontSize: 13,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  cardCopy: {
    color: "#6B6B6B",
    fontSize: 14,
  },
});
