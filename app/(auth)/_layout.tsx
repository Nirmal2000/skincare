import { Stack } from 'expo-router';

/**
 * Auth Layout
 * Stack navigator for authentication flow
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="signin" />
    </Stack>
  );
}
