// app/(auth)/SignInScreen.tsx

import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { handleSupabaseRedirect, supabase } from "@/features/auth/supabase-client";
import { useSupabaseSession } from "@/features/auth/useSupabaseSession";
import { PrimaryButton, SecondaryButton } from "@/lib/ui/facefit-components";

const REDIRECT_URL = "facefit://auth";

export default function SignInScreen() {
  const router = useRouter();
  const { profile } = useSupabaseSession();
  const [pendingProvider, setPendingProvider] = useState<"google" | "apple" | null>(null);

  useEffect(() => {
    if (profile) {
      router.back();
    }
  }, [profile, router]);

  const buttons = useMemo(() => [
    { label: "Continue with Google", provider: "google" as const },
    { label: "Continue with Apple", provider: "apple" as const },
  ], []);

  const handleSignIn = async (provider: "google" | "apple") => {
    try {
      setPendingProvider(provider);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: REDIRECT_URL },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("Failed to start authentication session");

      console.log("Supabase auth URL:", data.url);

      const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URL);
      console.log("AuthSession result", result);

      if (result.type === "success" && result.url) {
        const ok = await handleSupabaseRedirect(result.url);
        if (!ok) throw new Error("Unable to finish sign in");
      } else {
        throw new Error("Authentication was canceled or failed");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Sign in failed", (err as Error).message);
    } finally {
      setPendingProvider(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in to scan</Text>
      <Text style={styles.subtitle}>We use your account to keep scans secure and synced to your device.</Text>
      {buttons.map(({ label, provider }) => (
        <PrimaryButton
          key={provider}
          label={label}
          onPress={() => handleSignIn(provider)}
          disabled={pendingProvider !== null}
        />
      ))}
      <SecondaryButton label="Cancel" onPress={() => router.back()} />
      <Text style={styles.footer}>Redirect URL configured: {REDIRECT_URL}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#0A0A0A",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B6B6B",
    marginBottom: 24,
  },
  footer: {
    fontSize: 13,
    color: "#6B6B6B",
    textAlign: "center",
    marginTop: 24,
  },
});
