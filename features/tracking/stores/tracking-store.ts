import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Items that can be tracked in the daily routine
 */
export interface ProductItem {
  id: string; // Unique identifier
  name: string; // Product name (e.g., "Vitamin C Serum")
  completed: boolean;
}

export interface LifestyleItem {
  id: string; // Unique identifier
  name: string; // Lifestyle recommendation (e.g., "Get 8+ hours of sleep")
  completed: boolean;
}

/**
 * Daily routine structure with AM, PM, and Lifestyle sections
 */
export interface DailyRoutine {
  am: ProductItem[];      // AM topical products
  pm: ProductItem[];      // PM topical products
  lifestyle: LifestyleItem[];  // Lifestyle habits
}

/**
 * Main tracking store state
 */
interface TrackingState {
  // Daily routines keyed by date string in YYYY-MM-DD format
  logs: Record<string, DailyRoutine>;

  // Loading state
  isLoading: boolean;

  // Hydration state for persistence
  hasHydrated: boolean;

  // Selectors
  getRoutineForDate: (date: string) => DailyRoutine | null;
  getStreakCount: () => number;
  getCompletionStats: (date: string) => {
    totalItems: number;
    completedItems: number;
    percentage: number;
    isFullyCompleted: boolean;
  };

  // Actions
  toggleItem: (
    date: string,
    section: 'am' | 'pm' | 'lifestyle',
    itemId: string
  ) => void;

  addCustomItem: (
    date: string,
    section: 'am' | 'pm' | 'lifestyle',
    name: string
  ) => void;

  removeItem: (
    date: string,
    section: 'am' | 'pm' | 'lifestyle',
    itemId: string
  ) => void;

  // Import routines from scan results
  importFromScan: (date: string) => void;

  // Utility actions
  clearAll: () => void;
  setHydrated: () => void;

  // Create initial routine for a date
  initializeRoutineForDate: (date: string) => void;
  ensureRoutineForDate: (date: string) => void;
}

/**
 * Helper function to create a new empty routine
 */
const createEmptyRoutine = (): DailyRoutine => ({
  am: [],
  pm: [],
  lifestyle: [],
});

const cloneRoutineForNewDate = (routine: DailyRoutine): DailyRoutine => ({
  am: routine.am.map((item) => ({
    id: generateId(),
    name: item.name,
    completed: false,
  })),
  pm: routine.pm.map((item) => ({
    id: generateId(),
    name: item.name,
    completed: false,
  })),
  lifestyle: routine.lifestyle.map((item) => ({
    id: generateId(),
    name: item.name,
    completed: false,
  })),
});

const getDateFromString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};
const FALLBACK_LOOKBACK_DAYS = 31;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Generate a unique ID for items
 */
const generateId = (): string => {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if a date is in the past
 */
const isPastDate = (dateStr: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + 'T00:00:00');
  return date < today;
};

/**
 * Check if a date is today
 */
const isToday = (dateStr: string): boolean => {
  const today = new Date();
  const date = new Date(dateStr + 'T00:00:00');
  return today.toDateString() === date.toDateString();
};

/**
 * Calculate completion stats for a routine
 */
const calculateStats = (routine: DailyRoutine) => {
  const allItems = [...routine.am, ...routine.pm, ...routine.lifestyle];
  const totalItems = allItems.length;
  const completedItems = allItems.filter(item => item.completed).length;
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const isFullyCompleted = totalItems > 0 && completedItems === totalItems;

  return {
    totalItems,
    completedItems,
    percentage,
    isFullyCompleted,
  };
};

export const useTrackingStore = create<TrackingState>()(
  persist(
    (set, get) => ({
      logs: {},
      isLoading: false,
      hasHydrated: false,

      getRoutineForDate: (date: string) => {
        return get().logs[date] || null;
      },

      getStreakCount: () => {
        const logs = get().logs;
        const dates = Object.keys(logs).sort((a, b) =>
          new Date(b).getTime() - new Date(a).getTime()
        );

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check consecutive days starting from today going backwards
        for (let i = 0; i < dates.length; i++) {
          const dateStr = dates[i];
          const date = new Date(dateStr + 'T00:00:00');

          // Stop if we hit a future date
          if (date > today) continue;

          const routine = logs[dateStr];
          const stats = calculateStats(routine);

          if (stats.isFullyCompleted) {
            streak++;
          } else {
            break; // Streak broken
          }
        }

        return streak;
      },

      getCompletionStats: (date: string) => {
        const routine = get().logs[date];
        if (!routine) return { totalItems: 0, completedItems: 0, percentage: 0, isFullyCompleted: false };
        return calculateStats(routine);
      },

      toggleItem: (date, section, itemId) => {
        set((state) => {
          const routine = state.logs[date] || createEmptyRoutine();

          const updatedRoutine = {
            ...routine,
            [section]: routine[section].map(item =>
              item.id === itemId
                ? { ...item, completed: !item.completed }
                : item
            ),
          };

          return {
            logs: {
              ...state.logs,
              [date]: updatedRoutine,
            },
          };
        });
      },

      addCustomItem: (date, section, name) => {
        set((state) => {
          const routine = state.logs[date] || createEmptyRoutine();
          const newItem = {
            id: generateId(),
            name: name.trim(),
            completed: false,
          };

          const updatedRoutine = {
            ...routine,
            [section]: [...routine[section], newItem],
          };

          return {
            logs: {
              ...state.logs,
              [date]: updatedRoutine,
            },
          };
        });
      },

      removeItem: (date, section, itemId) => {
        set((state) => {
          const routine = state.logs[date];
          if (!routine) return state;

          const updatedRoutine = {
            ...routine,
            [section]: routine[section].filter(item => item.id !== itemId),
          };

          return {
            logs: {
              ...state.logs,
              [date]: updatedRoutine,
            },
          };
        });
      },

      importFromScan: async (date) => {
        try {
          // Import from scan store - get the most recent completed scan
          const ScanStore = (await import('../../scans/stores/scan-store')).useScanStore.getState();
          const recentRuns = ScanStore.getRecentRuns(10); // Get recent 10 scans
          const latestCompletedRun = recentRuns.find(run => run.status === 'routine_ready' || run.status === 'completed');

          if (!latestCompletedRun?.routine) {
            console.log('No completed scan with routine found');
            get().initializeRoutineForDate(date);
            return;
          }

          // Convert scan routine to tracking items
          const routinePlan = latestCompletedRun.routine;

          const importedRoutine: DailyRoutine = {
            am: routinePlan.routine.am.map(step => ({
              id: generateId(),
              name: step.products.map(p => p.name).join(', ') || step.instructions.how,
              completed: false,
            })),
            pm: routinePlan.routine.pm.map(step => ({
              id: generateId(),
              name: step.products.map(p => p.name).join(', ') || step.instructions.how,
              completed: false,
            })),
            lifestyle: [
              // Sleep recommendation
              routinePlan.lifestyle.sleep ? {
                id: generateId(),
                name: routinePlan.lifestyle.sleep,
                completed: false,
              } : null,
              // Stress recommendation
              routinePlan.lifestyle.stress ? {
                id: generateId(),
                name: routinePlan.lifestyle.stress,
                completed: false,
              } : null,
              // Sun recommendation
              routinePlan.lifestyle.sun ? {
                id: generateId(),
                name: routinePlan.lifestyle.sun,
                completed: false,
              } : null,
              // Habits recommendation
              routinePlan.lifestyle.habits ? {
                id: generateId(),
                name: routinePlan.lifestyle.habits,
                completed: false,
              } : null,
              // Routine hygiene recommendation
              routinePlan.lifestyle.routine_hygiene ? {
                id: generateId(),
                name: routinePlan.lifestyle.routine_hygiene,
                completed: false,
              } : null,
            ].filter((item): item is LifestyleItem => item !== null),
          };

          set((state) => ({
            logs: {
              ...state.logs,
              [date]: importedRoutine,
            },
          }));

          console.log('[Tracking Store] Imported routine from scan:', date, importedRoutine);
        } catch (error) {
          console.error('Failed to import from scan:', error);
          // Fallback: initialize empty routine
          get().initializeRoutineForDate(date);
        }
      },



      clearAll: () => {
        set({ logs: {} });
      },

      setHydrated: () => {
        set({ hasHydrated: true });
      },

      initializeRoutineForDate: (date) => {
        set((state) => {
          if (state.logs[date]) return state; // Already exists

          return {
            logs: {
              ...state.logs,
              [date]: createEmptyRoutine(),
            },
          };
        });
      },
      ensureRoutineForDate: (date) => {
        set((state) => {
          if (state.logs[date]) {
            return state;
          }

          const targetDate = getDateFromString(date);
          const lookbackThreshold = targetDate.getTime() - FALLBACK_LOOKBACK_DAYS * DAY_IN_MS;

          const candidateDate = Object.keys(state.logs)
            .filter((dateKey) => {
              const routine = state.logs[dateKey];
              if (!routine) return false;
              const hasItems =
                routine.am.length > 0 ||
                routine.pm.length > 0 ||
                routine.lifestyle.length > 0;
              if (!hasItems) return false;

              const candidateTime = getDateFromString(dateKey).getTime();
              return candidateTime < targetDate.getTime() && candidateTime >= lookbackThreshold;
            })
            .sort(
              (a, b) =>
                getDateFromString(b).getTime() - getDateFromString(a).getTime()
            )[0];

          if (!candidateDate) {
            return state;
          }

          return {
            logs: {
              ...state.logs,
              [date]: cloneRoutineForNewDate(state.logs[candidateDate]),
            },
          };
        });
      },
    }),
    {
      name: 'tracking-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
      // Only persist logs and hasHydrated
      partialize: (state) => ({
        logs: state.logs,
        hasHydrated: state.hasHydrated,
      }),
    }
  )
);

/**
 * Hook to check if tracking store has been hydrated
 */
export function useTrackingStoreHydrated(): boolean {
  return useTrackingStore((state) => state.hasHydrated);
}
