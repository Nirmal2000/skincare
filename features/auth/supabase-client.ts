import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '@/constants/Config';

// Supabase redirect prefix for OAuth flows
export const SUPABASE_REDIRECT_PREFIX = Config.auth.redirectUri;

/**
 * Supabase client instance
 * Configured with AsyncStorage for session persistence
 */
export const supabase = createClient(
  Config.supabase.url,
  Config.supabase.anonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

/**
 * Handle OAuth redirect from deep link
 * @param url - Deep link URL (e.g., facefit://auth?access_token=...)
 */
export async function handleSupabaseRedirect(url: string) {
  try {
    // Extract query params from URL
    const urlObj = new URL(url);
    const accessToken = urlObj.searchParams.get('access_token');
    const refreshToken = urlObj.searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      // Set session from OAuth redirect
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        throw error;
      }

      return data.session;
    }

    return null;
  } catch (error) {
    console.error('Error handling Supabase redirect:', error);
    throw error;
  }
}

/**
 * Get current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error);
    return null;
  }

  return data.session;
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}
