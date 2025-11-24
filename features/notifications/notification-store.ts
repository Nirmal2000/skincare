import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ReminderSlot = 'morning' | 'evening' | 'weekly';

export type PermissionState = 'unknown' | 'granted' | 'denied';

export interface RoutineReminder {
  id: ReminderSlot;
  label: string;
  time: string; // Stored as HH:mm (24-hour)
  enabled: boolean;
  notificationId?: string;
}

interface NotificationSettingsState {
  reminders: Record<ReminderSlot, RoutineReminder>;
  permissionsStatus: PermissionState;
  hasHydrated: boolean;

  updateReminder: (id: ReminderSlot, updates: Partial<RoutineReminder>) => void;
  setPermissionsStatus: (status: PermissionState) => void;
  setHydrated: () => void;
  resetAllNotifications: () => void;
}

const DEFAULT_REMINDERS: Record<ReminderSlot, RoutineReminder> = {
  morning: {
    id: 'morning',
    label: 'AM Routine',
    time: '07:30',
    enabled: false,
  },
  evening: {
    id: 'evening',
    label: 'PM Routine',
    time: '21:00',
    enabled: false,
  },
  weekly: {
    id: 'weekly',
    label: 'Weekly Skin Scan',
    time: '09:00',
    enabled: true,
  },
};

export const useNotificationStore = create<NotificationSettingsState>()(
  persist(
    (set, get) => ({
      reminders: DEFAULT_REMINDERS,
      permissionsStatus: 'unknown',
      hasHydrated: false,

      updateReminder: (id, updates) => {
        set((state) => ({
          reminders: {
            ...state.reminders,
            [id]: {
              ...state.reminders[id],
              ...updates,
            },
          },
        }));
      },

      setPermissionsStatus: (status) => {
        set({ permissionsStatus: status });
      },

      setHydrated: () => {
        set({ hasHydrated: true });
      },

      resetAllNotifications: () => {
        set({
          reminders: DEFAULT_REMINDERS,
        });
      },
    }),
    {
      name: 'notification-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
      partialize: (state) => ({
        reminders: state.reminders,
        permissionsStatus: state.permissionsStatus,
        hasHydrated: state.hasHydrated,
      }),
    }
  )
);

export function useNotificationStoreHydrated(): boolean {
  return useNotificationStore((state) => state.hasHydrated);
}
