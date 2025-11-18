import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  UpgradedFaceAnalysisResult,
  RoutineIntake,
  RoutinePlan,
} from '../../../types/api';
import {
  startAnalysis,
  pollUntilComplete,
  APIError,
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

interface ScanStore {
  runs: ScanRun[];
  currentRunId: string | null;
  isLoading: boolean;
  hasHydrated: boolean;

  // Selectors
  getCurrentRun: () => ScanRun | undefined;
  getRunById: (id: string) => ScanRun | undefined;
  getRecentRuns: (limit: number) => ScanRun[];

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
