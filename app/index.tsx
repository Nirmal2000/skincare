import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useOnboarding } from "@/features/onboarding/onboarding-store";

export default function Index() {
  const { onboarding, ready } = useOnboarding();

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <Redirect
      href={onboarding.completed ? "/(tabs)/home" : "/(onboarding)/welcome"}
    />
  );
}
