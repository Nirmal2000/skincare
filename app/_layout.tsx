import * as Linking from "expo-linking";
import { Stack } from "expo-router";
import { useEffect } from "react";

import {
  handleSupabaseRedirect,
  SUPABASE_REDIRECT_PREFIX,
} from "@/features/auth/supabase-client";

function useSupabaseLinking() {
  useEffect(() => {
    const handleUrl = (url?: string | null) => {
      if (!url || !url.startsWith(SUPABASE_REDIRECT_PREFIX)) {
        return;
      }
      console.log("Processing Supabase redirect:", url);
      handleSupabaseRedirect(url);
    };

    const subscription = Linking.addEventListener("url", ({ url }) =>
      handleUrl(url),
    );

    Linking.getInitialURL().then(handleUrl);

    return () => {
      subscription.remove();
    };
  }, []);
}

export default function RootLayout() {
  useSupabaseLinking();

  return (
    <Stack>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(auth)/signin"
        options={{ presentation: "modal", headerShown: false }}
      />
    </Stack>
  );
}
