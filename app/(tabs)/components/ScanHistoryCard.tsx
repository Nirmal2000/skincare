import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/Tokens';
import { ScanRun } from '@/features/scans/stores/scan-store';

interface ScanHistoryCardProps {
  scan: ScanRun;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (scanId: string) => void;
}

export function ScanHistoryCard({
  scan,
  isSelectionMode = false,
  isSelected = false,
  onSelect
}: ScanHistoryCardProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isSelectionMode && onSelect) {
      onSelect(scan.id);
    } else {
      router.push({
        pathname: '/(results)/[runId]',
        params: { runId: scan.id },
      });
    }
  };

  // Format date
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Get status display info
  const getStatusInfo = (status: ScanRun['status']) => {
    switch (status) {
      case 'completed':
      case 'routine_ready':
        return { label: 'Completed', color: Colors.successGreen };
      case 'processing':
      case 'queued':
      case 'uploading':
        return { label: 'Processing', color: '#FF9800' };
      case 'failed':
        return { label: 'Failed', color: '#FF6B6B' };
      default:
        return { label: 'Pending', color: Colors.textTertiary };
    }
  };

  // Count total issues
  const getIssueCount = (): number => {
    if (!scan.result?.issues) return 0;

    return Object.values(scan.result.issues).reduce(
      (total, issueArray) => total + issueArray.length,
      0
    );
  };

  const statusInfo = getStatusInfo(scan.status);
  const issueCount = getIssueCount();
  const overallScore = scan.result?.global_profile?.scores?.overall;

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      {/* Left: Circular thumbnail */}
      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: scan.photoUri }} style={styles.thumbnail} />
        {isSelected && (
          <View style={styles.selectionOverlay}>
            <Ionicons name="checkmark-circle" size={40} color={Colors.white} />
          </View>
        )}
      </View>

      {/* Right: Scan details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.dateText}>{formatDate(scan.createdAt)}</Text>

        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>
        </View>

        {overallScore !== undefined && (
          <Text style={styles.scoreText}>Score: {Math.round(overallScore)}/100</Text>
        )}

        {issueCount > 0 && (
          <Text style={styles.issueText}>
            {issueCount} issue{issueCount !== 1 ? 's' : ''} detected
          </Text>
        )}
      </View>

      {/* Right arrow indicator (only show in normal mode) */}
      {!isSelectionMode && (
        <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.default,
    marginBottom: Spacing.default,
    shadowColor: Colors.textPrimary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundLight,
    borderWidth: 2,
    borderColor: Colors.backgroundLight,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: Spacing.default,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.tiny,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.tiny,
  },
  statusBadge: {
    paddingHorizontal: Spacing.small,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  issueText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
