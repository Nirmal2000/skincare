import { RoutineIntake } from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Onboarding Answer Set
 * Stores user's answers to 8-question onboarding flow
 */
export interface OnboardingAnswerSet {
  /** All answers to routine intake questions */
  answers: Partial<RoutineIntake>;
  /** Onboarding completion flag */
  complete: boolean;
  /** Timestamp of completion */
  completedAt: number | null;
  /** Whether user has seen the hero screen (first-launch flag) */
  hasSeenHero: boolean;
}

interface OnboardingStore extends OnboardingAnswerSet {
  /** Whether the store has been hydrated from storage */
  hasHydrated: boolean;

  // Actions
  /** Set answer for a specific question */
  setAnswer: <K extends keyof RoutineIntake>(
    key: K,
    value: RoutineIntake[K]
  ) => void;
  /** Mark onboarding as complete */
  markComplete: () => void;
  /** Mark hero screen as seen */
  markHeroSeen: () => void;
  /** Reset all onboarding data */
  reset: () => void;
  /** Get current answers as RoutineIntake object */
  getIntake: () => RoutineIntake;
  /** Mark store as hydrated */
  setHydrated: () => void;
}

const defaultState: OnboardingAnswerSet = {
  answers: {
    sensitivity: 'unsure',
    pregnancy: 'prefer_not_to_say',
    rx_topical: 'unsure',
    allergies: [],
    fitzpatrick: 'unsure',
    current_actives: [],
    country: null,
    budget_preference: 'no_pref',
  },
  complete: false,
  completedAt: null,
  hasSeenHero: false,
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...defaultState,
      hasHydrated: false,

      setAnswer: (key, value) => {
        set((state) => ({
          answers: {
            ...state.answers,
            [key]: value,
          },
        }));
      },

      markComplete: () => {
        set({
          complete: true,
          completedAt: Date.now(),
        });
      },

      markHeroSeen: () => {
        set({ hasSeenHero: true });
      },

      reset: () => {
        set(defaultState);
      },

      getIntake: () => {
        const state = get();
        return {
          sensitivity: state.answers.sensitivity ?? 'unsure',
          pregnancy: state.answers.pregnancy ?? 'prefer_not_to_say',
          rx_topical: state.answers.rx_topical ?? 'unsure',
          allergies: state.answers.allergies ?? [],
          fitzpatrick: state.answers.fitzpatrick ?? 'unsure',
          current_actives: state.answers.current_actives ?? [],
          country: state.answers.country ?? null,
          budget_preference: state.answers.budget_preference ?? 'no_pref',
        };
      },

      setHydrated: () => {
        set({ hasHydrated: true });
      },
    }),
    {
      name: 'onboarding-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

/**
 * Hook to check if onboarding is complete
 */
export function useOnboardingComplete(): boolean {
  return useOnboardingStore((state) => state.complete);
}
