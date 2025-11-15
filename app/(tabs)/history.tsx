import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthGate } from "@/features/auth/useAuthGate";
import { getExpiryBadge, type ScanRecord } from "@/features/scans/scan-store";
import { useScanHistory, type HistoryEntry } from "@/features/scans/use-scan-history";
import type { FaceAnalysisTaskResponse } from "@/features/scans/face-analysis-api";
import {
  Card,
  PrimaryButton
} from "@/lib/ui/facefit-components";
import { useTabBarAutoHideScrollHandler } from "@/features/navigation/tab-bar-visibility";

export default function HistoryScreen() {
  const router = useRouter();
  const { profile, loading: authLoading, requireAuth } = useAuthGate();
  const { records, loading, refreshing, refresh, remove } = useScanHistory();
  const scrollHandler = useTabBarAutoHideScrollHandler();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (!profile) {
    return (
      <View style={styles.safeArea}>
        <View style={[styles.container, { paddingTop: insets.top + 16, justifyContent: "center", gap: 16 }]}>
          <Card style={{ gap: 12 }}>
            <Text style={styles.title}>Sign in to view history</Text>
            <Text style={styles.subtitle}>
              Saved scans stay on-device but require a signed-in session to
              display here.
            </Text>
            <PrimaryButton
              label={authLoading ? "Checking..." : "Sign in"}
              onPress={() => requireAuth()}
              disabled={authLoading}
            />
          </Card>
        </View>
      </View>
    );
  }

  const handleOpen = (entry: HistoryEntry) => {
    const { record, task } = entry;
    console.log("[History] opening scan", { id: record.id });
    const nextParams: Record<string, string> = {
      imageUri: encodeURIComponent(record.imageUri),
      source: record.source,
      readonly: "true",
      taskId: record.id,
    };
    if (task?.result) {
      nextParams.initialResult = encodeURIComponent(JSON.stringify(task.result));
    }
    if (!task?.result && task?.error) {
      nextParams.initialText = encodeURIComponent(task.error);
    }
    router.push({
      pathname: "/(tabs)/result",
      params: nextParams,
    });
  };

  const confirmDelete = (record: ScanRecord) => {
    Alert.alert(
      "Delete scan",
      "This removes the image and tip from your device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => remove(record.id),
        },
      ],
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <View style={{ gap: 8 }}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>
            Latest scans appear here for the duration of your auto-delete
            window.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator />
          </View>
        ) : (
          <Animated.FlatList
            data={records}
            keyExtractor={(item) => item.record.id}
            contentContainerStyle={
              records.length === 0
                ? styles.emptyList
                : { paddingBottom: 24, gap: 0 }
            }
            refreshing={refreshing}
            onRefresh={refresh}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
                <HistoryCard
                  entry={item}
                  onOpen={() => handleOpen(item)}
                  onDelete={() => confirmDelete(item.record)}
                />
            )}
            ListEmptyComponent={
              <Card style={{ gap: 12, alignItems: "flex-start" }}>
                <Text style={styles.subtitle}>
                  No saved scans yet. Capture a fresh photo to see it here.
                </Text>                
              </Card>
            }
          />
        )}
        
      </View>
    </View>
  );
}

function HistoryCard({
  entry,
  onOpen,
  onDelete,
}: {
  entry: HistoryEntry;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { record, task } = entry;
  const badge = getExpiryBadge(record);
  const timestamp = formatTimestamp(record.capturedAt);
  const statusLabel = task?.status ? formatStatusLabel(task.status) : "Pending sync";

  return (
    <Card style={styles.card}>
      <Pressable onPress={onOpen} style={{ borderRadius: 16, overflow: "hidden" }}>
        <Image source={{ uri: record.imageUri }} style={styles.cardImage} />
      </Pressable>
      <Text style={styles.cardTimestamp}>{timestamp}</Text>
      <View
        style={[
          styles.badge,
          badge.expired ? styles.badgeExpired : styles.badgeActive,
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            badge.expired ? styles.badgeTextExpired : styles.badgeTextActive,
          ]}
        >
          {badge.label}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={onOpen}>
          <Text style={styles.linkText}>Open</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatusLabel(status: FaceAnalysisTaskResponse["status"]) {
  switch (status) {
    case "queued":
      return "Queued";
    case "global_profile_complete":
      return "Profile analyzed";
    case "texture_complete":
      return "Texture analyzed";
    case "pigmentation_complete":
      return "Pigmentation analyzed";
    case "acne_complete":
      return "Acne analyzed";
    case "aging_complete":
      return "Aging analyzed";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return status ?? "Unknown";
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B6B6B",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
  },
  card: {
    width: "100%",
    gap: 8,
  },
  cardImage: {
    width: "100%",
    height: 160,
  },
  cardTimestamp: {
    fontSize: 14,
    color: "#0A0A0A",
    fontWeight: "500",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  badgeActive: {
    backgroundColor: "#EDF9F1",
  },
  badgeExpired: {
    backgroundColor: "#FDECEA",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  badgeTextActive: {
    color: "#0A7A45",
  },
  badgeTextExpired: {
    color: "#C03515",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkText: {
    color: "#0A0A0A",
    fontWeight: "600",
  },
  deleteText: {
    color: "#C03515",
    fontWeight: "600",
  },
});
