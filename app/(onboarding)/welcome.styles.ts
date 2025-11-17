import { StyleSheet } from "react-native";

import { ACCENT_COLOR, INTRO_SUBTEXT, INTRO_TEXT } from "./welcome.constants";

export const styles = StyleSheet.create({
  animatedRegion: {
    flex: 1,
    overflow: "hidden",
  },
  introContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  ageScroll: {
    flex: 1,
  },
  ageScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 24,
  },
  ageStandalone: {
    gap: 32,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  ageWheel: {
    width: "100%",
    maxWidth: 360,
  },
  heroBackground: {
    flex: 1,
    backgroundColor: "#000000",
  },
  heroOverlay: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroCopy: {
    marginTop: "15%",
    alignItems: "center",
    gap: 20,
  },
  heroLogo: {
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: 6,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },
  heroHeadline: {
    fontSize: 28,
    lineHeight: 34,
    color: "#FFFFFF",
    textAlign: "center",
  },
  heroFooter: {
    alignItems: "flex-end",
  },
  slideContainer: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 24,
  },
  slideBody: {
    flex: 1,
  },
  slideFooter: {
    alignItems: "flex-end",
  },
  advanceButtonAlign: {
    alignSelf: "flex-end",
  },
  advanceButtonBase: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 999,
    paddingHorizontal: 28,
    backgroundColor: ACCENT_COLOR,
    shadowColor: "rgba(241, 138, 27, 0.35)",
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  advanceButtonPressed: {
    opacity: 0.9,
  },
  advanceButtonDisabled: {
    opacity: 0.5,
  },
  advanceButtonLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -12 }],
  },
  backButtonPressed: {
    opacity: 0.8,
  },
  questionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 32,
  },
  questionHeader: {
    width: "100%",
    gap: 12,
  },
  questionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: INTRO_TEXT,
    textAlign: "center",
  },
  questionDescription: {
    fontSize: 14,
    color: INTRO_SUBTEXT,
    textAlign: "center",
    lineHeight: 20,
  },
  questionOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    width: "100%",
    maxWidth: 420,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipButtonPressed: {
    opacity: 0.7,
  },
  skipButtonDisabled: {
    opacity: 0.4,
  },
  skipButtonLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: ACCENT_COLOR,
  },
});
