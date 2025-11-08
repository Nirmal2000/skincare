import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useSettings } from "@/features/settings/settings-store";
import { decodeAnalysisPayload } from "@/features/scans/analysis-payload";
import type {
  FaceAnalysisAttribute,
  FaceAnalysisResult,
  SkinTypeAttribute,
} from "@/features/scans/face-analysis-api";
import {
  saveScan,
  type ScanSource,
  type StoredFaceAnalysis,
} from "@/features/scans/scan-store";
import {
  Card,
  PrimaryButton,
  SecondaryButton,
} from "@/lib/ui/facefit-components";

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
  const structuredAnalysis =
    analysisPayload?.kind === "structured" ? analysisPayload.data : null;
  const analysisText =
    analysisPayload?.kind === "text" ? analysisPayload.data : null;

  const friendlySource =
    source === "gallery"
      ? "Gallery upload"
      : source === "camera"
        ? "Camera capture"
        : "Unknown source";

  const handleSave = async () => {
    if (!decodedUri || !analysisPayload || !source) {
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const faceAnalysis: StoredFaceAnalysis =
        analysisPayload.kind === "structured"
          ? analysisPayload.data
          : analysisPayload.data;
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.previewShell}>
          <Image source={{ uri: decodedUri }} style={styles.previewImage} />
        </View>

        {structuredAnalysis ? (
          <>
            <Card style={{ gap: 12 }} title="Skin overview">
              <Text style={styles.resultText}>
                {formatSkinType(structuredAnalysis.skin_type)}
              </Text>
              <Text style={styles.metaText}>
                Confidence {formatConfidence(structuredAnalysis.skin_type.confidence)}
              </Text>
              <View style={styles.breakdownList}>
                {Object.entries(structuredAnalysis.skin_type.details).map(
                  ([key, value]) => (
                    <View key={key} style={styles.breakdownRow}>
                      <Text style={styles.attributeLabel}>
                        {formatAttributeKey(key)}
                      </Text>
                      <Text style={styles.attributeValue}>
                        {formatPercentage(value)}
                      </Text>
                    </View>
                  ),
                )}
              </View>
              <Text style={styles.metaText}>
                {friendlySource} • Auto-delete in {settings.autoDeleteDays} days
              </Text>
            </Card>

            <Card style={{ gap: 12 }} title="Attribute scores">
              {renderAttributeList(structuredAnalysis)}
            </Card>
          </>
        ) : null}

        {analysisText ? (
          <Card style={{ gap: 12 }} title="Analysis result">
            <Text style={styles.resultText}>{analysisText}</Text>
            <Text style={styles.metaText}>
              {friendlySource} • Auto-delete in {settings.autoDeleteDays} days
            </Text>
          </Card>
        ) : null}

        <Card style={{ gap: 8 }} title="Care tips">
          <Text style={styles.cardCopy}>
            Apply a gentle cleanser, let skin dry fully, then follow the tip
            above. Results stay on-device only.
          </Text>
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={styles.cardTitle}>Disclaimer</Text>
          <Text style={styles.cardCopy}>
            FaceFit suggestions are not medical advice. Seek a dermatologist for
            persistent issues.
          </Text>
        </Card>

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 24,
    gap: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    padding: 24,
    gap: 12,
    justifyContent: "center",
  },
  previewShell: {
    height: 360,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#0A0A0A",
  },
  previewImage: {
    flex: 1,
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
  resultText: {
    fontSize: 18,
    color: "#0A0A0A",
    fontWeight: "600",
  },
  metaText: {
    fontSize: 14,
    color: "#6B6B6B",
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
  actions: {
    gap: 12,
  },
  error: {
    color: "#C03515",
    fontSize: 14,
  },
  breakdownList: {
    gap: 6,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  attributeLabel: {
    fontSize: 14,
    color: "#0A0A0A",
    fontWeight: "500",
  },
  attributeValue: {
    fontSize: 14,
    color: "#0A0A0A",
    fontWeight: "600",
  },
  attributeMeta: {
    fontSize: 12,
    color: "#6B6B6B",
  },
  confidenceText: {
    fontSize: 12,
    color: "#0A0A0A",
    fontWeight: "600",
  },
  attributeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5E5",
  },
});

function renderAttributeList(analysis: FaceAnalysisResult) {
  const entries = Object.entries(analysis).filter(
    ([key]) => key !== "skin_type",
  );

  if (entries.length === 0) {
    return <Text style={styles.cardCopy}>No additional attributes provided.</Text>;
  }

  return entries.map(([key, attribute]) => {
    const score = attribute as FaceAnalysisAttribute;
    return (
      <View key={key} style={styles.attributeRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.attributeLabel}>{formatAttributeKey(key)}</Text>
          <Text style={styles.attributeMeta}>Value {score.value}</Text>
        </View>
        <Text style={styles.confidenceText}>
          {formatConfidence(score.confidence)}
        </Text>
      </View>
    );
  });
}

function formatSkinType(attribute: SkinTypeAttribute) {
  const [winner] = Object.entries(attribute.details).sort(
    (a, b) => b[1] - a[1],
  );
  const label = winner ? formatAttributeKey(winner[0]) : "Unknown";
  return `${label} skin`;
}

function formatConfidence(value: number) {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}% confidence`;
}

function formatPercentage(value: number) {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function formatAttributeKey(key: string) {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
