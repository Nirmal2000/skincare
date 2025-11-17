import { Platform, StyleSheet } from "react-native";

export const resultStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  scrollContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 120,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  section: {
    gap: 12,
  },
  heroSection: {
    paddingTop: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  cardCentered: {
    alignItems: "center",
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0A0A0A",
    marginBottom: 4,
  },
  cardHeadingCentered: {
    textAlign: "center",
    alignSelf: "stretch",
  },
  cardDescriptionCentered: {
    textAlign: "center",
  },
  cardFullWidth: {
    alignSelf: "stretch",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryItem: {
    width: "48%",
    borderRadius: 12,
    backgroundColor: "#F7F7F7",
    padding: 12,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 14,
    color: "#0A0A0A",
    fontWeight: "500",
  },
  summaryCallout: {
    borderRadius: 12,
    backgroundColor: "#F9F1E7",
    padding: 12,
  },
  error: {
    color: "#C03515",
    fontSize: 14,
  },
  issueCarousel: {
    marginTop: 12,
  },
  issueCarouselContent: {
    gap: 12,
    alignItems: "flex-start",
  },
  issueCircle: {
    width: 96,
    alignItems: "center",
    gap: 6,
  },
  issueCircleActive: {
    transform: [{ scale: 1.05 }],
  },
  issueCircleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  issueCircleValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0A0A0A",
  },
  issueCircleValueOnDark: {
    color: "#FFFFFF",
  },
  issueCircleLabel: {
    fontSize: 12,
    textAlign: "center",
    color: "#333333",
  },
  emptyIssues: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 12,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#2A2A2A",
  },
  routineTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#0A0A0A",
    marginBottom: 8,
  },
  routineStreamingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  markdownContainer: {
    alignSelf: "stretch",
  },
  routineSectionCard: {
    alignItems: "stretch",
  },
  routineCtaButton: {
    backgroundColor: "#F18A1B",
  },
  routineJsonContainer: {
    backgroundColor: "#F4F4F4",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  routineJson: {
    fontFamily: Platform.OS === "android" ? "monospace" : "Menlo",
    fontSize: 13,
    color: "#0A0A0A",
    lineHeight: 20,
  },
  backButton: {
    position: "absolute",
    zIndex: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  intakeSection: {
    gap: 10,
  },
  intakeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  intakeDescription: {
    fontSize: 13,
    color: "#6B6B6B",
  },
  intakeChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  intakeActions: {
    gap: 8,
  },
  profileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  profileItem: {
    width: "45%",
    gap: 4,
  },
  profileLabel: {
    fontSize: 12,
    color: "#7A7A7A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  profileValue: {
    fontSize: 16,
    color: "#0A0A0A",
    fontWeight: "500",
  },
  scoreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  scoreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F0F0F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scoreLabel: {
    fontSize: 12,
    color: "#555",
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  issueTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  issueEntry: {
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ECECEC",
    paddingTop: 12,
    gap: 4,
  },
  entryRegion: {
    fontSize: 15,
    fontWeight: "500",
    color: "#0A0A0A",
  },
  entryDescription: {
    fontSize: 14,
    color: "#3A3A3A",
    lineHeight: 20,
  },
});
