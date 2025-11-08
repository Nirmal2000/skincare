import { useRouter } from "expo-router";
import { useCallback } from "react";

import { useSupabaseSession } from "@/features/auth/useSupabaseSession";

export function useAuthGate() {
  const { profile, loading } = useSupabaseSession();
  const router = useRouter();

  const requireAuth = useCallback(
    (action?: () => void) => {
      if (loading) {
        return;
      }
      if (!profile) {
        router.push("/(auth)/signin");
        return;
      }
      action?.();
    },
    [profile, loading, router],
  );

  return {
    profile,
    loading,
    requireAuth,
  };
}
