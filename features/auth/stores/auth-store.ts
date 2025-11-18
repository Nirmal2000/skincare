import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '../supabase-client';

interface AuthStore {
  /** Current Supabase session */
  session: Session | null;
  /** Loading state for auth operations */
  isLoading: boolean;
  /** Whether the store has been hydrated from storage */
  hasHydrated: boolean;

  // Actions
  /** Set current session */
  setSession: (session: Session | null) => void;
  /** Sign out current user and clear all stores */
  signOut: () => Promise<void>;
  /** Refresh current session */
  refreshSession: () => Promise<void>;
  /** Initialize auth state from stored session */
  initialize: () => Promise<void>;
  /** Mark store as hydrated */
  setHydrated: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: false,
      hasHydrated: false,

      setSession: (session) => {
        set({ session });
      },

      setHydrated: () => {
        set({ hasHydrated: true });
      },

      signOut: async () => {
        try {
          set({ isLoading: true });

          // Sign out from Supabase
          await supabase.auth.signOut();

          // Clear session from store
          set({ session: null });

          // Clear other stores (will be imported when needed to avoid circular deps)
          // This is called from those stores directly to avoid circular imports
        } catch (error) {
          console.error('Error signing out:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      refreshSession: async () => {
        try {
          set({ isLoading: true });

          const { data, error } = await supabase.auth.refreshSession();

          if (error) throw error;

          if (data.session) {
            set({ session: data.session });
          }
        } catch (error) {
          console.error('Error refreshing session:', error);
          // Don't throw - just log, as this may happen during normal flow
        } finally {
          set({ isLoading: false });
        }
      },

      initialize: async () => {
        try {
          set({ isLoading: true });

          const { data, error } = await supabase.auth.getSession();

          if (error) throw error;

          if (data.session) {
            set({ session: data.session });
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist session, not loading states
        session: state.session,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.session !== null);
}

/**
 * Hook to get current user
 */
export function useCurrentUser() {
  return useAuthStore((state) => state.session?.user);
}

/**
 * Hook to get access token for API calls
 */
export function useAccessToken(): string | null {
  return useAuthStore((state) => state.session?.access_token ?? null);
}
