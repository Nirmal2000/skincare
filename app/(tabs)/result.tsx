import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image as RNImage,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import { useSettings } from "@/features/settings/settings-store";
import { decodeAnalysisPayload } from "@/features/scans/analysis-payload";
import type { FaceAnalysisResult } from "@/features/scans/face-analysis-api";
import {
  saveScan,
  type ScanSource,
  type StoredFaceAnalysis,
} from "@/features/scans/scan-store";
import { PrimaryButton, SecondaryButton } from "@/lib/ui/facefit-components";
import {
  buildRegionReports,
  type RegionId,
} from "@/features/results/region-config";
import type { FaceLandmarkMap } from "@/features/scans/landmark-points";
import { FacePreview } from "./result/components/FacePreview";
import { RegionReport } from "./result/components/RegionReport";
import type { RegionSelectHandler } from "./result/types";

function toSingle(value?: string | string[]) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
}

function decodeUri(value: string | null) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { settings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId | null>(null);
  const reportRef = useRef<ScrollView | null>(null);
  const sectionOffsetsRef = useRef<Partial<Record<RegionId, number>>>({});

  const rawUri = toSingle(params.imageUri);
  const decodedUri = useMemo(() => decodeUri(rawUri), [rawUri]);
  const analysisParam = toSingle(params.analysis);
  const sourceParam = toSingle(params.source);
  const readOnly = toSingle(params.readonly) === "true";
  const source: ScanSource | null =
    sourceParam === "camera" || sourceParam === "gallery"
      ? sourceParam
      : null;
  const analysisPayload = useMemo(
    () => decodeAnalysisPayload(analysisParam),
    [analysisParam],
  );
  let landmarks: FaceLandmarkMap | null = null;
  if (analysisPayload && analysisPayload.kind === "structured") {
    landmarks = analysisPayload.landmarks ?? null;
  }
  const structuredAnalysis = useMemo<FaceAnalysisResult | null>(() => {
    if (!analysisPayload) {
      return null;
    }
    if (analysisPayload.kind === "structured") {
      return analysisPayload.data as FaceAnalysisResult;
    }
    return null;
  }, [analysisPayload]);
  const analysisText = useMemo<string | null>(() => {
    if (!analysisPayload) {
      return null;
    }
    if (analysisPayload.kind === "text") {
      return analysisPayload.data as string;
    }
    return null;
  }, [analysisPayload]);

  useEffect(() => {
    if (!decodedUri) {
      setImageSize(null);
      return;
    }
    RNImage.getSize(
      decodedUri,
      (width, height) => setImageSize({ width, height }),
      () => setImageSize(null),
    );
  }, [decodedUri]);

  const regionReports = useMemo(
    () => buildRegionReports(structuredAnalysis, landmarks),
    [structuredAnalysis, landmarks],
  );

  useEffect(() => {
    if (!selectedRegionId && regionReports.regions.length > 0) {
      setSelectedRegionId(regionReports.regions[0].id);
    }
  }, [regionReports.regions, selectedRegionId]);

  const handleRegionLayout = useCallback((regionId: RegionId, offset: number) => {
    sectionOffsetsRef.current[regionId] = offset;
  }, []);

  const handleSelectRegion = useCallback<RegionSelectHandler>(
    (regionId: RegionId, options) => {
      setSelectedRegionId(regionId);
      if (options?.scroll) {
        const target = sectionOffsetsRef.current[regionId];
        if (target != null) {
          reportRef.current?.scrollTo({
            y: Math.max(target - 24, 0),
            animated: true,
          });
        }
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [],
  );

  const handleSave = async () => {
    if (!decodedUri || !analysisPayload || !source) {
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const faceAnalysis: StoredFaceAnalysis =
        structuredAnalysis ?? analysisText ?? "";
      await saveScan({
        tempImageUri: decodedUri,
        faceAnalysis,
        retentionDays: settings.autoDeleteDays,
        source,
      });
      router.replace("/(tabs)/history");
    } catch (err) {
      console.warn("Save scan failed", err);
      setError("Unable to save locally. Clear space or try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!decodedUri || !analysisPayload || !source) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.title}>Result expired</Text>
          <Text style={styles.subtitle}>
            We could not load the last scan payload. Please capture a new photo.
          </Text>
          <PrimaryButton
            label="Back to Scan"
            onPress={() => router.replace("/(tabs)/scan")}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!structuredAnalysis) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.title}>Structured data unavailable</Text>
          <Text style={styles.subtitle}>
            We couldn’t load the detailed analysis for this scan. Capture a new
            photo to generate a full report.
          </Text>
          <PrimaryButton
            label="Back to Scan"
            onPress={() => router.replace("/(tabs)/scan")}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.resultsContainer}>
        <View style={styles.faceSection}>
          <FacePreview
            imageUri={decodedUri}
            regions={regionReports.regions}
            selectedRegionId={selectedRegionId}
            onSelectRegion={handleSelectRegion}
            imageSize={imageSize}
          />
        </View>
        <View style={styles.reportSection}>
          <RegionReport
            ref={reportRef}
            regions={regionReports.regions}
            allProblems={regionReports.allProblems}
            selectedRegionId={selectedRegionId}
            onSelectRegion={handleSelectRegion}
            onRegionLayout={handleRegionLayout}
            analysisSummary={analysisText}
          />
          {!readOnly ? (
            <View style={styles.actions}>
              <PrimaryButton
                label={saving ? "Saving..." : "Save locally"}
                onPress={handleSave}
                disabled={saving}
              />
              <SecondaryButton
                label="Scan again"
                onPress={() => router.replace("/(tabs)/scan")}
                disabled={saving}
              />
            </View>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  resultsContainer: {
    flex: 1,
  },
  faceSection: {
    flex: 1,
    backgroundColor: "#000000",
  },
  reportSection: {
    flex: 1,
    backgroundColor: "#FDFDFD",
  },
  actions: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
  error: {
    color: "#C03515",
    textAlign: "center",
    paddingBottom: 16,
  },
  emptyState: {
    flex: 1,
    padding: 24,
    gap: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#0A0A0A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B6B6B",
    marginBottom: 16,
  },
});
