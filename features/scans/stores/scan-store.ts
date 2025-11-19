import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  IssueItem,
  RoutineIntake,
  RoutinePlan,
  UpgradedFaceAnalysisResult,
} from '../../../types/api';
import {
  pollUntilComplete,
  startAnalysis
} from '../face-analysis-api';

/**
 * Represents a single face scan analysis with photo and results
 */
export interface ScanRun {
  id: string; // UUID or generated ID
  userId: string; // Supabase user ID
  photoUri: string; // Local file URI from camera
  taskId: string | null; // Backend task ID from /start-task
  status: ScanRunStatus;
  landmarks: any[] | null; // Face landmarks from ML Kit detection at capture time
  previewDimensions: { width: number; height: number } | null; // Camera preview size when landmarks were captured
  photoDimensions: { width: number; height: number } | null; // Actual photo dimensions
  result: UpgradedFaceAnalysisResult | null; // From backend
  routineIntake: RoutineIntake | null; // User's routine questionnaire
  routine: RoutinePlan | null; // From backend /recommend
  error: string | null; // Error message if failed
  createdAt: string; // ISO timestamp when photo captured
  updatedAt: string; // ISO timestamp of last update
  completedAt: string | null; // ISO timestamp when analysis finished
}

export type ScanRunStatus =
  | 'captured' // Photo taken, not yet uploaded
  | 'uploading' // Sending to /start-task
  | 'queued' // Backend received, awaiting processing
  | 'processing' // Backend analyzing
  | 'completed' // Analysis done, result available
  | 'routine_pending' // User filled intake, routine generating
  | 'routine_ready' // Routine generated
  | 'failed'; // Analysis or upload failed

// Metric types for dashboard/stats
export interface SkinHealthMetrics {
  score: number;
  skinAge: {
    estimated: number;
    relative: 'younger' | 'similar' | 'older' | 'unknown';
  };
  skinType: string;
  skinTone: string;
}

export interface ScoreConcern {
  category: keyof typeof SCORE_CATEGORIES;
  score: number;
  label: string;
}

export interface IssuesSummary {
  total: number;
  critical: number; // intensity > 0.7
  byCategory: Record<string, number>;
}

// Score categories for grouping concerns/strengths
const SCORE_CATEGORIES = {
  'Texture & Pores': ['roughness', 'pores', 'blackheads'],
  'Acne & Oil': ['acne', 'oily_shine'],
  'Aging': ['wrinkles', 'pigmentation'],
  'Health': ['hydration', 'sensitivity_redness', 'dark_circles'],
} as const;

// Helper to format skin tone for display
const formatSkinTone = (skinTone: UpgradedFaceAnalysisResult['global_profile']['skin_tone']): string => {
  const lightness = skinTone.lightness.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const undertone = skinTone.undertone === 'unknown' ? '' : ` with ${skinTone.undertone} undertones`;
  return `${lightness}${undertone}`;
};

interface ScanStore {
  runs: ScanRun[];
  currentRunId: string | null;
  isLoading: boolean;
  hasHydrated: boolean;

  // Selectors
  getCurrentRun: () => ScanRun | undefined;
  getRunById: (id: string) => ScanRun | undefined;
  getRecentRuns: (limit: number) => ScanRun[];

  // Metric selectors
  getLatestCompletedScan: () => ScanRun | null;
  getSkinHealthMetrics: () => SkinHealthMetrics | null;
  getTopConcerns: (limit?: number) => ScoreConcern[];
  getTopStrengths: (limit?: number) => ScoreConcern[];
  getIssuesCount: () => IssuesSummary;

  // Actions
  createRun: (photoUri: string, userId: string) => string; // Returns run ID
  updateRun: (id: string, updates: Partial<ScanRun>) => void;
  deleteRun: (id: string) => void;
  clearAll: () => void;
  setHydrated: () => void;

  // Async Actions
  uploadRun: (
    runId: string,
    userAge: number | undefined,
    token: string
  ) => Promise<void>;
  pollRunStatus: (runId: string, token: string) => Promise<void>;
}

export const useScanStore = create<ScanStore>()(
  persist(
    (set, get) => ({
      runs: [],
      currentRunId: null,
      isLoading: false,
      hasHydrated: false,

      getCurrentRun: () => {
        const { runs, currentRunId } = get();
        return runs.find((r) => r.id === currentRunId);
      },

      getRunById: (id) => {
        return get().runs.find((r) => r.id === id);
      },

      getRecentRuns: (limit) => {
        return get()
          .runs.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, limit);
      },

      getLatestCompletedScan: () => {
        const recentRuns = get().getRecentRuns(1);
        return recentRuns.find(run => run.status === 'completed') || null;
      },

      getSkinHealthMetrics: (): SkinHealthMetrics | null => {
        const latestScan = get().getLatestCompletedScan();
        if (!latestScan?.result) return null;

        const profile = latestScan.result.global_profile;
        return {
          score: profile.scores.overall,
          skinAge: {
            estimated: profile.skin_age.estimated_age,
            relative: profile.skin_age.relative_to_real_age
          },
          skinType: profile.skin_type.label.charAt(0).toUpperCase() + profile.skin_type.label.slice(1),
          skinTone: formatSkinTone(profile.skin_tone)
        };
      },

      getTopConcerns: (limit = 3): ScoreConcern[] => {
        const latestScan = get().getLatestCompletedScan();
        if (!latestScan?.result) return [];

        const scores = latestScan.result.global_profile.scores;
        const concerns: ScoreConcern[] = [];

        // Calculate average score for each category
        Object.entries(SCORE_CATEGORIES).forEach(([categoryName, scoreKeys]) => {
          const validScores = scoreKeys
            .map(key => scores[key as keyof typeof scores])
            .filter(score => score !== undefined && score !== null);

          if (validScores.length > 0) {
            const avgScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
            concerns.push({
              category: categoryName as keyof typeof SCORE_CATEGORIES,
              score: Math.round(avgScore),
              label: categoryName
            });
          }
        });

        // Sort by lowest score first (concerns), take limit
        return concerns
          .sort((a, b) => a.score - b.score)
          .slice(0, limit);
      },

      getTopStrengths: (limit = 3): ScoreConcern[] => {
        const latestScan = get().getLatestCompletedScan();
        if (!latestScan?.result) return [];

        const scores = latestScan.result.global_profile.scores;
        const strengths: ScoreConcern[] = [];

        // Calculate average score for each category
        Object.entries(SCORE_CATEGORIES).forEach(([categoryName, scoreKeys]) => {
          const validScores = scoreKeys
            .map(key => scores[key as keyof typeof scores])
            .filter(score => score !== undefined && score !== null);

          if (validScores.length > 0) {
            const avgScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
            strengths.push({
              category: categoryName as keyof typeof SCORE_CATEGORIES,
              score: Math.round(avgScore),
              label: categoryName
            });
          }
        });

        // Sort by highest score first (strengths), take limit
        return strengths
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      },

      getIssuesCount: (): IssuesSummary => {
        const latestScan = get().getLatestCompletedScan();
        if (!latestScan?.result) {
          return { total: 0, critical: 0, byCategory: {} };
        }

        const issues = latestScan.result.issues;
        let total = 0;
        let critical = 0;
        const byCategory: Record<string, number> = {};

        // Count issues by category
        Object.entries(issues).forEach(([categoryName, issueList]) => {
          const categoryCount = issueList.length;
          byCategory[categoryName] = categoryCount;
          total += categoryCount;

          // Count critical issues (high intensity)
          critical += issueList.filter((issue: IssueItem) => issue.intensity > 0.7).length;
        });

        return { total, critical, byCategory };
      },

      createRun: (photoUri, userId) => {
        const runId = `run-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const run: ScanRun = {
          id: runId,
          userId,
          photoUri,
          taskId: null,
          status: 'captured',
          landmarks: null,
          previewDimensions: null,
          photoDimensions: null,
          result: null,
          routineIntake: null,
          routine: null,
          error: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
        };

        set((state) => ({
          runs: [run, ...state.runs],
          currentRunId: runId,
        }));

        console.log('[Scan Store] Created run:', runId);
        return runId;
      },

      updateRun: (id, updates) => {
        set((state) => ({
          runs: state.runs.map((run) =>
            run.id === id
              ? {
                  ...run,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : run
          ),
        }));
        console.log('[Scan Store] Updated run:', id, updates);
      },

      deleteRun: (id) => {
        set((state) => ({
          runs: state.runs.filter((r) => r.id !== id),
          currentRunId: state.currentRunId === id ? null : state.currentRunId,
        }));
        console.log('[Scan Store] Deleted run:', id);
      },

      clearAll: () => {
        set({ runs: [], currentRunId: null });
        console.log('[Scan Store] Cleared all runs');
      },

      setHydrated: () => {
        set({ hasHydrated: true });
        console.log('[Scan Store] Hydrated from storage');
      },

      uploadRun: async (runId, userAge, token) => {
        try {
          set((state) => ({
            runs: state.runs.map((run) =>
              run.id === runId
                ? {
                    ...run,
                    status: 'uploading' as ScanRunStatus,
                  }
                : run
            ),
          }));

          const run = get().getRunById(runId);
          if (!run) {
            throw new Error(`Run ${runId} not found`);
          }

          const response = await startAnalysis(run.photoUri, userAge, token);

          set((state) => ({
            runs: state.runs.map((r) =>
              r.id === runId
                ? {
                    ...r,
                    taskId: response.task_id,
                    status: 'queued' as ScanRunStatus,
                    updatedAt: new Date().toISOString(),
                  }
                : r
            ),
          }));

          console.log('[Scan Store] Upload complete:', runId, response.task_id);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Upload failed';
          set((state) => ({
            runs: state.runs.map((run) =>
              run.id === runId
                ? {
                    ...run,
                    status: 'failed' as ScanRunStatus,
                    error: errorMessage,
                  }
                : run
            ),
          }));
          console.error('[Scan Store] Upload failed:', runId, error);
          throw error;
        }
      },

      pollRunStatus: async (runId, token) => {
        try {
          const run = get().getRunById(runId);
          if (!run) {
            throw new Error(`Run ${runId} not found`);
          }

          if (!run.taskId) {
            throw new Error(`Task ID not found for run ${runId}`);
          }

          const response = await pollUntilComplete(run.taskId, token);

          set((state) => ({
            runs: state.runs.map((r) =>
              r.id === runId
                ? {
                    ...r,
                    status: 'completed' as ScanRunStatus,
                    result: response.result || null,
                    completedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }
                : r
            ),
          }));

          console.log('[Scan Store] Polling complete:', runId);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Polling failed';
          set((state) => ({
            runs: state.runs.map((run) =>
              run.id === runId
                ? {
                    ...run,
                    status: 'failed' as ScanRunStatus,
                    error: errorMessage,
                  }
                : run
            ),
          }));
          console.error('[Scan Store] Polling failed:', runId, error);
          throw error;
        }
      },
    }),
    {
      name: 'scan-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

/**
 * Hook to check if scan store has been hydrated
 */
export function useScanStoreHydrated(): boolean {
  return useScanStore((state) => state.hasHydrated);
}
