import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase, SUPABASE_REDIRECT_PREFIX } from './supabase-client';
import * as Haptics from 'expo-haptics';

WebBrowser.maybeCompleteAuthSession();

/**
 * Sign in with Google OAuth
 * Opens browser for OAuth flow, returns to app via deep link
 */
export async function signInWithGoogle(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: SUPABASE_REDIRECT_PREFIX,
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      throw error;
    }

    if (data?.url) {
      await WebBrowser.openAuthSessionAsync(data.url, SUPABASE_REDIRECT_PREFIX);
    }
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

/**
 * Sign in with Apple OAuth
 * Opens browser for OAuth flow, returns to app via deep link
 */
export async function signInWithApple(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: SUPABASE_REDIRECT_PREFIX,
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      throw error;
    }

    if (data?.url) {
      await WebBrowser.openAuthSessionAsync(data.url, SUPABASE_REDIRECT_PREFIX);
    }
  } catch (error) {
    console.error('Error signing in with Apple:', error);
    throw error;
  }
}

/**
 * Handle OAuth redirect from deep link
 * Call this in app root when deep link is received
 */
export async function handleOAuthRedirect(url: string): Promise<boolean> {
  try {
    const parsedUrl = Linking.parse(url);
    const { queryParams } = parsedUrl;

    if (queryParams?.access_token && queryParams?.refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token: queryParams.access_token as string,
        refresh_token: queryParams.refresh_token as string,
      });

      if (error) {
        throw error;
      }

      return true; // Successfully handled OAuth redirect
    }

    return false; // Not an OAuth redirect
  } catch (error) {
    console.error('Error handling OAuth redirect:', error);
    throw error;
  }
}
