import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthGate } from '@/features/auth/useAuthGate';
import { useScanStore } from '@/features/scans/stores/scan-store';
import { Colors, Spacing } from '@/constants/Tokens';
import ScanLoadingScreen from './components/ScanLoadingScreen';
import ScanLoadingOverlay from './components/ScanLoadingOverlay';
import { IssueVisualizationScreen } from './components/IssueVisualizationScreen';

/**
 * Result Detail Screen
 * Displays:
 * 1. Loading state: Face image + facial area analysis + progress bars
 * 2. Results state: Skin analysis results
 * Full implementation: T044-T055
 */
export default function ResultScreen() {
  const { runId } = useLocalSearchParams<{ runId: string }>();
  const { session } = useAuthGate();
  const uploadRun = useScanStore((state) => state.uploadRun);
  const pollRunStatus = useScanStore((state) => state.pollRunStatus);
  const getRunById = useScanStore((state) => state.getRunById);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to store updates for this specific run
  const run = useScanStore((state) => state.runs.find((r) => r.id === runId));

  useEffect(() => {
    if (!runId || !session) return;

    const initializePolling = async () => {
      try {
        const currentRun = getRunById(runId);
        if (!currentRun) {
          setError('Scan run not found');
          return;
        }

        // If not yet uploaded, upload first
        if (currentRun.status === 'captured') {
          await uploadRun(runId, undefined, session.access_token);
        }

        // Start polling
        await pollRunStatus(runId, session.access_token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('[Result Screen] Error:', err);
      }
    };

    initializePolling();
  }, [runId, session, getRunById, uploadRun, pollRunStatus]);

  if (!runId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid scan ID</Text>
      </View>
    );
  }

  if (!run) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Scan not found</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  // Loading state: Show face image, facial areas, and progress bars
  // Only show loading for analysis, not for routine generation
  if (run.status !== 'completed' && run.status !== 'routine_pending' && run.status !== 'routine_ready') {
    console.log('[Result Screen] Status:', run.status);
    return (
      <View style={styles.loadingContainer}>
        <ScanLoadingScreen photoUri={run.photoUri} />

        <View style={styles.progressBarContainer}>
          <ScanLoadingOverlay />
        </View>
      </View>
    );
  }

  // Completed state: Show issue visualization
  console.log('[Result Screen] Rendering issue visualization, result:', run.result ? 'present' : 'missing');
  return <IssueVisualizationScreen run={run} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
    paddingHorizontal: Spacing.large,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
  },

  progressBarContainer: {
    paddingHorizontal: Spacing.default,
    paddingBottom: Spacing.xl,
  },

  resultText: {
    marginTop: Spacing.large,
    fontSize: 20,
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  subtext: {
    marginTop: Spacing.small,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.large,
  },
});
