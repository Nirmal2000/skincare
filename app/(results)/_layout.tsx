import { Stack } from 'expo-router';
import { Colors } from '@/constants/Tokens';

export default function ResultsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.darkBackground,
        },
        animation: 'fade',
      }}
    />
  );
}
