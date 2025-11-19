import { Stack } from 'expo-router';

export default function SubscriptionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        presentation: 'modal',
      }}
    >
      <Stack.Screen
        name="paywall"
        options={{
          title: 'Upgrade to Pro',
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="manage"
        options={{
          title: 'Manage Subscription',
          headerLargeTitle: false,
        }}
      />
    </Stack>
  );
}
