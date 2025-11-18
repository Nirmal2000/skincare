import Constants from 'expo-constants';

/**
 * Application configuration from environment variables
 */

export const Config = {
  /**
   * Supabase configuration
   */
  supabase: {
    url: Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },

  /**
   * Backend face analysis API base URL
   */
  faceApi: {
    baseUrl: Constants.expoConfig?.extra?.EXPO_PUBLIC_FACE_API_BASE_URL || process.env.EXPO_PUBLIC_FACE_API_BASE_URL || '',
  },

  /**
   * OAuth redirect URI for Supabase auth
   */
  auth: {
    redirectUri: 'betterskin://auth',
  },
} as const;

/**
 * Validate required configuration
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Config.supabase.url) {
    errors.push('Missing EXPO_PUBLIC_SUPABASE_URL in environment');
  }

  if (!Config.supabase.anonKey) {
    errors.push('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY in environment');
  }

  if (!Config.faceApi.baseUrl) {
    errors.push('Missing EXPO_PUBLIC_FACE_API_BASE_URL in environment');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
