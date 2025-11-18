import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from './stores/auth-store';

/**
 * Auth gate hook
 * Redirects to sign-in if no session exists
 * Use in protected routes to enforce authentication
 */
export function useAuthGate() {
  const session = useAuthStore((state) => state.session);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    // Redirect to sign-in if not authenticated and not already in auth flow
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/signin');
    }

    // Redirect to tabs if authenticated and in auth flow
    if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments, router]);

  return { session, isAuthenticated: !!session };
}
