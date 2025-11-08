import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type {
  ProblemListItem,
  RegionId,
  RegionReport as RegionReportData,
} from "@/features/results/region-config";
import type { RegionSelectHandler } from "../types";

type RegionReportProps = {
  regions: RegionReportData[];
  allProblems: ProblemListItem[];
  selectedRegionId: RegionId | null;
  onSelectRegion: RegionSelectHandler;
  onRegionLayout: (regionId: RegionId, offset: number) => void;
  analysisSummary?: string | null;
};

export const RegionReport = forwardRef<ScrollView, RegionReportProps>(
  (
    {
      regions,
      allProblems,
      selectedRegionId,
      onSelectRegion,
      onRegionLayout,
      analysisSummary,
    },
    ref,
  ) => {
    const [openSections, setOpenSections] = useState<
      Partial<Record<RegionId, boolean>>
    >({});

  useEffect(() => {
    if (selectedRegionId) {
      setOpenSections((current) => ({
        ...current,
        [selectedRegionId]: true,
      }));
    }
  }, [selectedRegionId]);

  const visibleRegions = useMemo(
    () => regions.filter((region) => region.issues.length > 0),
    [regions],
  );

    return (
      <ScrollView
        ref={ref}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <Text style={styles.heading}>Your skin analysis</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>All areas we noticed</Text>
        {allProblems.length === 0 ? (
          <Text style={styles.emptyText}>No concerns detected.</Text>
        ) : (
          allProblems.map((problem) => (
            <Pressable
              key={problem.id}
              style={styles.problemRow}
              onPress={() => onSelectRegion(problem.regionId, { scroll: false })}
            >
              <View>
                <Text style={styles.problemRegion}>{problem.regionLabel}</Text>
                <Text style={styles.problemLabel}>{problem.label}</Text>
              </View>
              <Text style={styles.problemConfidence}>
                {formatConfidence(problem.confidence)}
              </Text>
            </Pressable>
          ))
        )}
      </View>

      {analysisSummary ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Summary</Text>
          <Text style={styles.metaText}>{analysisSummary}</Text>
        </View>
      ) : null}

      {visibleRegions.map((region) => {
        const open = openSections[region.id] ?? false;
        return (
          <View
            key={region.id}
            onLayout={(event: LayoutChangeEvent) => {
              onRegionLayout(region.id, event.nativeEvent.layout.y);
            }}
            style={styles.card}
          >
            <Pressable
              style={styles.accordionHeader}
              onPress={() => {
                onSelectRegion(region.id, { scroll: false });
                setOpenSections((current) => ({
                  ...current,
                  [region.id]: !open,
                }));
              }}
            >
              <Text
                style={[
                  styles.cardTitle,
                  selectedRegionId === region.id ? styles.selectedText : null,
                ]}
              >
                {region.label}
              </Text>
              <Text style={styles.chevron}>{open ? "−" : "+"}</Text>
            </Pressable>
            {open ? (
              <View style={styles.issueList}>
                {region.issues.map((issue) => (
                  <View key={issue.key} style={styles.issueRow}>
                    <Text style={styles.issueLabel}>{issue.label}</Text>
                    <Text style={styles.issueConfidence}>
                      Confidence {formatConfidence(issue.confidence)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}

      <View style={[styles.card, { marginBottom: 32 }]}>
        <Text style={styles.cardTitle}>Care tips</Text>
        <Text style={styles.metaText}>
          Apply a gentle cleanser, let skin dry fully, then follow the steps
          suggested for each region.
        </Text>
      </View>
      <View style={[styles.card, { marginBottom: 48 }]}>
        <Text style={styles.cardTitle}>Disclaimer</Text>
        <Text style={styles.metaText}>
          FaceFit suggestions are not medical advice. Consult a dermatologist
          for persistent issues.
        </Text>
      </View>
      </ScrollView>
    );
  },
);
RegionReport.displayName = "RegionReport";

function formatConfidence(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0A0A0A",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  emptyText: {
    color: "#6B6B6B",
  },
  problemRow: {
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  problemRegion: {
    fontSize: 12,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  problemLabel: {
    fontSize: 15,
    color: "#0A0A0A",
  },
  problemConfidence: {
    fontSize: 12,
    color: "#6B6B6B",
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chevron: {
    fontSize: 24,
    color: "#0A0A0A",
  },
  issueList: {
    gap: 8,
  },
  issueRow: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  issueLabel: {
    fontSize: 15,
    color: "#0A0A0A",
  },
  issueConfidence: {
    fontSize: 12,
    color: "#6B6B6B",
  },
  metaText: {
    fontSize: 13,
    color: "#6B6B6B",
  },
  selectedText: {
    color: "#0A0A0A",
    textDecorationLine: "underline",
  },
});
