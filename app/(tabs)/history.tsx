import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, Typography } from '@/constants/Tokens';
import { useAuthGate } from '@/features/auth/useAuthGate';
import { useScanStore } from '@/features/scans/stores/scan-store';

import { ScanHistoryCard } from '@/features/results/ScanHistoryCard';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuthGate();
  const deleteRun = useScanStore((state) => state.deleteRun);

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Get all scans for the current user, sorted by most recent
  const allRuns = useScanStore((state) => state.runs);
  const userScans = allRuns
    .filter((run) => run.userId === session?.user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Selection handlers
  const handleEnterSelectionMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSelectionMode(true);
  };

  const handleExitSelectionMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds(new Set(userScans.map((scan) => scan.id)));
  };

  const handleToggleSelection = (scanId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(scanId)) {
        newSet.delete(scanId);
      } else {
        newSet.add(scanId);
      }
      return newSet;
    });
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Scans',
      `Are you sure you want to delete ${selectedIds.size} scan${selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            selectedIds.forEach((id) => deleteRun(id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            handleExitSelectionMode();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={[styles.headerTop, { paddingTop: 12 }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>History</Text>
            <Text style={styles.headerSubtitle}>
              {isSelectionMode
                ? `${selectedIds.size} selected`
                : `${userScans.length} scan${userScans.length !== 1 ? 's' : ''}`}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {isSelectionMode ? (
              <>
                <Pressable style={styles.headerButton} onPress={handleSelectAll}>
                  <Text style={styles.headerButtonText}>Select All</Text>
                </Pressable>
                <Pressable style={styles.headerButton} onPress={handleExitSelectionMode}>
                  <Text style={styles.headerButtonText}>Cancel</Text>
                </Pressable>
              </>
            ) : (
              userScans.length > 0 && (
                <Pressable style={styles.headerButton} onPress={handleEnterSelectionMode}>
                  <Text style={styles.headerButtonText}>Select</Text>
                </Pressable>
              )
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(
              insets.bottom + (isSelectionMode && selectedIds.size > 0 ? 100 : 0),
              Spacing.large
            ),
          },
        ]}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        {userScans.length > 0 ? (
          userScans.map((scan) => (
            <ScanHistoryCard
              key={scan.id}
              scan={scan}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.has(scan.id)}
              onSelect={handleToggleSelection}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="camera-outline"
              size={64}
              color={Colors.textTertiary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No Scans Yet</Text>
            <Text style={styles.emptyMessage}>
              Your scan history will appear here once you complete your first
              skin analysis.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Delete Button */}
      {isSelectionMode && selectedIds.size > 0 && (
        <Pressable
          style={[
            styles.deleteButton,
            { bottom: Math.max(insets.bottom + Spacing.large, Spacing.xl) },
          ]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={28} color={Colors.white} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
  headerArea: {
    backgroundColor: Colors.appBackground,
    paddingHorizontal: Spacing.large,
    paddingBottom: Spacing.default,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.small,
  },
  headerButton: {
    paddingHorizontal: Spacing.default,
    paddingVertical: Spacing.small,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brandPrimary,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.tiny,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.large,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    marginBottom: Spacing.large,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  deleteButton: {
    position: 'absolute',
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
});
