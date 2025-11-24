import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { supabase, SUPABASE_REDIRECT_PREFIX } from './supabase-client';

console.log('[OAuth Setup] WebBrowser.maybeCompleteAuthSession() called');
WebBrowser.maybeCompleteAuthSession();

/**
 * Sign in with Google OAuth
 * Opens browser for OAuth flow, returns to app via deep link
 */
export async function signInWithGoogle(): Promise<void> {
  try {
    console.log('[Google Sign-In] Starting Haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('[Google Sign-In] Haptics done');

    console.log('[Google Sign-In] Calling supabase.auth.signInWithOAuth', {
      provider: 'google',
      options: {
        redirectTo: SUPABASE_REDIRECT_PREFIX,
        skipBrowserRedirect: false,
      }
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: SUPABASE_REDIRECT_PREFIX,
        skipBrowserRedirect: false,
      },
    });

    console.log('[Google Sign-In] Supabase response:', { data: !!data, error });

    if (error) {
      console.error('[Google Sign-In] Supabase OAuth error:', error);
      throw error;
    }

    console.log('[Google Sign-In] OAuth URL:', data?.url);

    if (data?.url) {
      console.log('[Google Sign-In] Opening WebBrowser auth session');
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        SUPABASE_REDIRECT_PREFIX
      );
      console.log('[Google Sign-In] WebBrowser result:', {
        type: result.type,
        url: result.type === 'success' ? result.url : undefined,
      });

      if (result.type === 'success' && result.url) {
        // Parse the redirect URL to extract tokens from fragment
        // Supabase returns tokens in URL fragment (after #), not query params
        const url = result.url;
        console.log('[Google Sign-In] Full redirect URL:', url);

        // Extract fragment (after #) and parse it as query params
        const fragmentMatch = url.match(/#(.+)$/);
        const fragment = fragmentMatch ? fragmentMatch[1] : '';

        console.log('[Google Sign-In] URL fragment:', fragment);

        // Parse fragment as query string
        const params: Record<string, string> = {};
        fragment.split('&').forEach((pair) => {
          const [key, value] = pair.split('=');
          if (key && value) {
            params[key] = decodeURIComponent(value);
          }
        });

        console.log('[Google Sign-In] Parsed params:', {
          hasAccessToken: !!params.access_token,
          hasRefreshToken: !!params.refresh_token,
        });

        const { access_token, refresh_token } = params;

        if (access_token && refresh_token) {
          console.log('[Google Sign-In] Tokens found, setting session');
          console.log('[Google Sign-In] Access Token:', access_token);
          console.log('[Google Sign-In] Refresh Token:', refresh_token);
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: access_token as string,
            refresh_token: refresh_token as string,
          });

          if (sessionError) {
            console.error('[Google Sign-In] Session error:', sessionError);
            throw sessionError;
          }

          console.log('[Google Sign-In] Session set successfully');
        } else {
          console.error('[Google Sign-In] No tokens in redirect URL');
          throw new Error('No authentication tokens received');
        }
      } else if (result.type === 'cancel') {
        console.log('[Google Sign-In] User cancelled authentication');
        throw new Error('Authentication cancelled');
      } else if (result.type === 'dismiss') {
        console.log('[Google Sign-In] Authentication dismissed');
        throw new Error('Authentication dismissed');
      }
    } else {
      console.log('[Google Sign-In] No OAuth URL returned');
      throw new Error('No OAuth URL received from Supabase');
    }
  } catch (error) {
    console.error('[Google Sign-In] Catch block error:', error);
    throw error;
  }
}

/**
 * Sign in with Apple OAuth
 * Opens browser for OAuth flow, returns to app via deep link
 */
export async function signInWithApple(): Promise<void> {
  try {
    console.log('[Apple Sign-In] Starting Haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('[Apple Sign-In] Haptics done');

    console.log('[Apple Sign-In] Calling supabase.auth.signInWithOAuth');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: SUPABASE_REDIRECT_PREFIX,
        skipBrowserRedirect: false,
      },
    });

    console.log('[Apple Sign-In] Supabase response:', { data: !!data, error });

    if (error) {
      console.error('[Apple Sign-In] Supabase OAuth error:', error);
      throw error;
    }

    console.log('[Apple Sign-In] OAuth URL:', data?.url);

    if (data?.url) {
      console.log('[Apple Sign-In] Opening WebBrowser auth session');
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        SUPABASE_REDIRECT_PREFIX
      );
      console.log('[Apple Sign-In] WebBrowser result:', {
        type: result.type,
        url: result.type === 'success' ? result.url : undefined,
      });

      if (result.type === 'success' && result.url) {
        // Parse the redirect URL to extract tokens from fragment
        // Supabase returns tokens in URL fragment (after #), not query params
        const url = result.url;
        console.log('[Apple Sign-In] Full redirect URL:', url);

        // Extract fragment (after #) and parse it as query params
        const fragmentMatch = url.match(/#(.+)$/);
        const fragment = fragmentMatch ? fragmentMatch[1] : '';

        console.log('[Apple Sign-In] URL fragment:', fragment);

        // Parse fragment as query string
        const params: Record<string, string> = {};
        fragment.split('&').forEach((pair) => {
          const [key, value] = pair.split('=');
          if (key && value) {
            params[key] = decodeURIComponent(value);
          }
        });

        console.log('[Apple Sign-In] Parsed params:', {
          hasAccessToken: !!params.access_token,
          hasRefreshToken: !!params.refresh_token,
        });

        const { access_token, refresh_token } = params;

        if (access_token && refresh_token) {
          console.log('[Apple Sign-In] Tokens found, setting session');
          console.log('[Apple Sign-In] Access Token:', access_token);
          console.log('[Apple Sign-In] Refresh Token:', refresh_token);
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: access_token as string,
            refresh_token: refresh_token as string,
          });

          if (sessionError) {
            console.error('[Apple Sign-In] Session error:', sessionError);
            throw sessionError;
          }

          console.log('[Apple Sign-In] Session set successfully');
        } else {
          console.error('[Apple Sign-In] No tokens in redirect URL');
          throw new Error('No authentication tokens received');
        }
      } else if (result.type === 'cancel') {
        console.log('[Apple Sign-In] User cancelled authentication');
        throw new Error('Authentication cancelled');
      } else if (result.type === 'dismiss') {
        console.log('[Apple Sign-In] Authentication dismissed');
        throw new Error('Authentication dismissed');
      }
    } else {
      console.log('[Apple Sign-In] No OAuth URL returned');
      throw new Error('No OAuth URL received from Supabase');
    }
  } catch (error) {
    console.error('[Apple Sign-In] Catch block error:', error);
    throw error;
  }
}

/**
 * Handle OAuth redirect from deep link
 * Call this in app root when deep link is received (e.g., from Safari or email)
 */
export async function handleOAuthRedirect(url: string): Promise<boolean> {
  try {
    console.log('[OAuth Redirect] Handling deep link:', url);

    // Supabase returns tokens in URL fragment (after #), not query params
    const fragmentMatch = url.match(/#(.+)$/);
    const fragment = fragmentMatch ? fragmentMatch[1] : '';

    if (!fragment) {
      console.log('[OAuth Redirect] No fragment found in URL');
      return false;
    }

    console.log('[OAuth Redirect] Fragment:', fragment);

    // Parse fragment as query string
    const params: Record<string, string> = {};
    fragment.split('&').forEach((pair) => {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });

    const { access_token, refresh_token } = params;

    if (access_token && refresh_token) {
      console.log('[OAuth Redirect] Tokens found, setting session');
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        console.error('[OAuth Redirect] Session error:', error);
        throw error;
      }

      console.log('[OAuth Redirect] Session set successfully');
      return true; // Successfully handled OAuth redirect
    }

    console.log('[OAuth Redirect] No tokens found in fragment');
    return false; // Not an OAuth redirect
  } catch (error) {
    console.error('[OAuth Redirect] Error:', error);
    throw error;
  }
}
