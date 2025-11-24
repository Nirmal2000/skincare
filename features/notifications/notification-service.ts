import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Colors } from '@/constants/Tokens';
import type { PermissionState, ReminderSlot } from './notification-store';

const ROUTINE_CHANNEL_ID = 'routine-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function configureNotificationChannels() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ROUTINE_CHANNEL_ID, {
      name: 'Routine Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: Colors.brandPrimary,
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

export async function getNotificationPermissions(): Promise<PermissionState> {
  const settings = await Notifications.getPermissionsAsync();
  return settings.status === 'granted'
    ? 'granted'
    : settings.status === 'denied'
      ? 'denied'
      : 'unknown';
}

export async function requestNotificationPermissions(): Promise<PermissionState> {
  const settings = await Notifications.requestPermissionsAsync();
  return settings.status === 'granted'
    ? 'granted'
    : settings.status === 'denied'
      ? 'denied'
      : 'unknown';
}

const reminderCopy: Record<ReminderSlot, { title: string; body: string }> = {
  morning: {
    title: 'AM Routine Reminder',
    body: 'Good morning! It’s time to complete your skincare routine.',
  },
  evening: {
    title: 'PM Routine Reminder',
    body: 'Unwind with your nightly routine to keep your glow consistent.',
  },
  weekly: {
    title: 'Weekly Skin Scan',
    body: 'Take a moment to scan your skin and track progress for the week.',
  },
};

function parseTimeString(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map((value) => parseInt(value, 10));
  return {
    hour: Number.isNaN(hour) ? 8 : hour,
    minute: Number.isNaN(minute) ? 0 : minute,
  };
}

export async function scheduleRoutineReminder(slot: ReminderSlot, time: string): Promise<string> {
  await configureNotificationChannels();
  const { hour, minute } = parseTimeString(time);
  const { title, body } = reminderCopy[slot];

  const trigger =
    slot === 'weekly'
      ? {
          weekday: 1, // Sunday
          hour,
          minute,
          second: 0,
          repeats: true,
          channelId: Platform.OS === 'android' ? ROUTINE_CHANNEL_ID : undefined,
        }
      : {
          hour,
          minute,
          second: 0,
          repeats: true,
          channelId: Platform.OS === 'android' ? ROUTINE_CHANNEL_ID : undefined,
        };

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
    },
    trigger,
  });
}

export async function cancelScheduledReminder(notificationId: string) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('[Notifications] Failed to cancel notification:', error);
  }
}
