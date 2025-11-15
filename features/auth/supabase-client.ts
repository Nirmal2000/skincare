// features/auth/supabase-client.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import "react-native-url-polyfill/auto";

// Initialize Supabase client
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase credentials in expo.extra");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Deep-link prefix
const REDIRECT_PREFIX = "betterskin://auth";
export const SUPABASE_REDIRECT_PREFIX = REDIRECT_PREFIX;

// Handle redirect URLs
export async function handleSupabaseRedirect(url?: string | null): Promise<boolean> {
  if (!url || !url.startsWith(REDIRECT_PREFIX)) {
    console.debug("Supabase redirect ignored (url mismatch)", url);
    return false;
  }
  console.log("Supabase redirect raw:", url);

  // Parse the URL
  const parsed = Linking.parse(url);
  const { queryParams } = parsed;

  const getSingleValue = (value?: string | string[] | null): string | undefined => {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value ?? undefined;
  };

  // Manually extract fragment part
  const fragmentStart = url.indexOf("#");
  let fragParams: URLSearchParams | null = null;
  if (fragmentStart >= 0) {
    const fragmentString = url.substring(fragmentStart + 1);
    fragParams = new URLSearchParams(fragmentString);
  }

  const access_token = getSingleValue(queryParams?.access_token) ?? fragParams?.get("access_token") ?? undefined;
  const refresh_token = getSingleValue(queryParams?.refresh_token) ?? fragParams?.get("refresh_token") ?? undefined;

  if (access_token && refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) {
      console.warn("Supabase setSession failed:", error.message);
      return false;
    }
    console.log("Supabase session set:", data.session);
    return true;
  }

  const authorizationCode = getSingleValue(queryParams?.code);
  if (authorizationCode) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(url);
    if (error) {
      console.warn("Supabase OAuth exchange failed", error.message);
      return false;
    }
    return Boolean(data.session);
  }

  console.warn("No token or code found in redirect URL", url);
  return false;
}

// Complete any pending browser sessions on app start
WebBrowser.maybeCompleteAuthSession();
