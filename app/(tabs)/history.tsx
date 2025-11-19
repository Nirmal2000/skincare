import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

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
            <Svg width="120" height="120" viewBox="0 0 24 24" fill="none" style={styles.emptyIcon}>
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5 8a1 1 0 0 1-2 0V5.923c0-.76.082-1.185.319-1.627.223-.419.558-.754.977-.977C4.738 3.082 5.162 3 5.923 3H8a1 1 0 0 1 0 2H5.923c-.459 0-.57.022-.684.082a.364.364 0 0 0-.157.157c-.06.113-.082.225-.082.684V8zm3 11a1 1 0 1 1 0 2H5.923c-.76 0-1.185-.082-1.627-.319a2.363 2.363 0 0 1-.977-.977C3.082 19.262 3 18.838 3 18.077V16a1 1 0 1 1 2 0v2.077c0 .459.022.57.082.684.038.07.087.12.157.157.113.06.225.082.684.082H8zm7-15a1 1 0 0 0 1 1h2.077c.459 0 .57.022.684.082.07.038.12.087.157.157.06.113.082.225.082.684V8a1 1 0 1 0 2 0V5.923c0-.76-.082-1.185-.319-1.627a2.363 2.363 0 0 0-.977-.977C19.262 3.082 18.838 3 18.077 3H16a1 1 0 0 0-1 1zm4 12a1 1 0 1 1 2 0v2.077c0 .76-.082 1.185-.319 1.627a2.364 2.364 0 0 1-.977.977c-.442.237-.866.319-1.627.319H16a1 1 0 1 1 0-2h2.077c.459 0 .57-.022.684-.082a.363.363 0 0 0 .157-.157c.06-.113.082-.225.082-.684V16zM3 11a1 1 0 1 0 0 2h18a1 1 0 1 0 0-2H3z"
                fill={Colors.textTertiary}
              />
            </Svg>
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
    minHeight: 500,
  },
  emptyIcon: {
    marginBottom: Spacing.large,
    opacity: 0.5,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
    textAlign: 'center',
  },
  emptyMessage: {
    ...Typography.bodyLarge,
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
