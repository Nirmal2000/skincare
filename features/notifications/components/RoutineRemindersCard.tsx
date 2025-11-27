import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Feather from '@expo/vector-icons/Feather';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BorderRadius,
  Colors,
  Layout,
  Spacing,
  Typography,
} from '@/constants/Tokens';
import {
  ReminderSlot,
  RoutineReminder,
  useNotificationStore,
  useNotificationStoreHydrated,
} from '../notification-store';
import {
  cancelScheduledReminder,
  configureNotificationChannels,
  getNotificationPermissions,
  requestNotificationPermissions,
  scheduleRoutineReminder,
} from '../notification-service';

const VISIBLE_REMINDERS: ReminderSlot[] = ['morning', 'evening'];
const SCHEDULABLE_REMINDERS: ReminderSlot[] = ['morning', 'evening', 'weekly'];

const formatDisplayTime = (time: string) => {
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const minutes = minuteStr || '00';
  if (Number.isNaN(hour)) hour = 0;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalizedHour}:${minutes.padStart(2, '0')} ${suffix}`;
};

const timeStringFromDate = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const dateFromTimeString = (time: string) => {
  const date = new Date();
  const [hour, minute] = time.split(':').map((value) => parseInt(value, 10));
  date.setHours(Number.isNaN(hour) ? 8 : hour);
  date.setMinutes(Number.isNaN(minute) ? 0 : minute);
  date.setSeconds(0, 0);
  return date;
};

export function RoutineRemindersCard() {
  const reminders = useNotificationStore((state) => state.reminders);
  const updateReminder = useNotificationStore((state) => state.updateReminder);
  const permissionsStatus = useNotificationStore(
    (state) => state.permissionsStatus
  );
  const setPermissionsStatus = useNotificationStore(
    (state) => state.setPermissionsStatus
  );
  const hydrated = useNotificationStoreHydrated();
  const [pendingSlot, setPendingSlot] = useState<ReminderSlot | null>(null);
  const [iosPickerSlot, setIosPickerSlot] = useState<ReminderSlot | null>(null);
  const [iosPickerDate, setIosPickerDate] = useState<Date>(new Date());

  useEffect(() => {
    if (!hydrated) return;
    let isMounted = true;

    const bootstrap = async () => {
      await configureNotificationChannels();
      const status = await getNotificationPermissions();
      if (isMounted) {
        setPermissionsStatus(status);
      }
    };

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, [hydrated, setPermissionsStatus]);

  useEffect(() => {
    if (!hydrated || permissionsStatus !== 'granted') return;

    const ensureSchedules = async () => {
      for (const slot of SCHEDULABLE_REMINDERS) {
        const reminder = reminders[slot];
        if (reminder.enabled && !reminder.notificationId) {
          try {
            const notificationId = await scheduleRoutineReminder(
              slot,
              reminder.time
            );
            updateReminder(slot, { notificationId });
          } catch (error) {
            console.warn('[Notifications] Failed to reschedule reminder', error);
          }
        }
      }
    };

    ensureSchedules();
  }, [hydrated, permissionsStatus, reminders, updateReminder]);

  const handleToggleReminder = async (
    reminder: RoutineReminder,
    enabled: boolean
  ) => {
    if (pendingSlot) return;
    setPendingSlot(reminder.id);

    try {
      if (enabled) {
        let status = permissionsStatus;

        if (status !== 'granted') {
          status = await requestNotificationPermissions();
          setPermissionsStatus(status);
        }

        if (status !== 'granted') {
          Alert.alert(
            'Notifications disabled',
            'Enable notifications in Settings to receive routine reminders.'
          );
          setPendingSlot(null);
          return;
        }

        const notificationId = await scheduleRoutineReminder(
          reminder.id,
          reminder.time
        );
        updateReminder(reminder.id, { enabled: true, notificationId });
      } else {
        if (reminder.notificationId) {
          await cancelScheduledReminder(reminder.notificationId);
        }
        updateReminder(reminder.id, { enabled: false, notificationId: undefined });
      }
    } catch (error) {
      console.error('[Notifications] Failed to toggle reminder', error);
      Alert.alert('Something went wrong', 'Please try again in a moment.');
    } finally {
      setPendingSlot(null);
    }
  };

  const handleTimeSelection = (slot: ReminderSlot) => {
    if (slot === 'weekly') {
      return;
    }
    const current = dateFromTimeString(reminders[slot].time);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'time',
        is24Hour: false,
        value: current,
        onChange: (_event: DateTimePickerEvent, date?: Date) => {
          if (date) {
            saveTimeForSlot(slot, date);
          }
        },
      });
      return;
    }

    setIosPickerSlot(slot);
    setIosPickerDate(current);
  };

  const saveTimeForSlot = async (slot: ReminderSlot, date: Date) => {
    if (slot === 'weekly') return;
    const nextTime = timeStringFromDate(date);
    const reminder = reminders[slot];

    if (reminder.time === nextTime) {
      return;
    }

    try {
      updateReminder(slot, { time: nextTime });

      if (reminder.enabled) {
        if (reminder.notificationId) {
          await cancelScheduledReminder(reminder.notificationId);
        }

        const notificationId = await scheduleRoutineReminder(slot, nextTime);
        updateReminder(slot, { notificationId });
      }
    } catch (error) {
      console.error('[Notifications] Failed to update reminder time', error);
      Alert.alert('Unable to update', 'Please try again in a few seconds.');
    }
  };

  const reminderList = useMemo(
    () => VISIBLE_REMINDERS.map((slot) => reminders[slot]),
    [reminders]
  );

  const renderReminderRow = (reminder: RoutineReminder) => {
    const description = reminder.enabled
      ? 'Tap below to adjust the reminder time.'
      : 'Reminders are off for this slot.';

    return (
      <View
        key={reminder.id}
        style={{
          paddingVertical: Spacing.medium,
          borderBottomWidth:
            reminder.id === VISIBLE_REMINDERS[VISIBLE_REMINDERS.length - 1]
              ? 0
              : 1,
          borderColor: Colors.borderSoft,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: Spacing.small,
          }}
        >
          <View style={{ flex: 1, paddingRight: Spacing.small }}>
            <Text style={{ ...Typography.h4, color: Colors.textPrimary }}>
              {reminder.label}
            </Text>
            <Text
              style={{
                ...Typography.bodySmall,
                color: reminder.enabled
                  ? Colors.textSecondary
                  : Colors.textTertiary,
                marginTop: 2,
              }}
            >
              {description}
            </Text>
          </View>

          <Switch
            value={reminder.enabled}
            onValueChange={(value) => handleToggleReminder(reminder, value)}
            trackColor={{
              false: Colors.borderSoft,
              true: Colors.brandPrimary,
            }}
            thumbColor={Colors.white}
            ios_backgroundColor={Colors.borderSoft}
            disabled={!!pendingSlot}
          />
        </View>

        <Pressable
          onPress={() => handleTimeSelection(reminder.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: Spacing.small,
            paddingHorizontal: Spacing.medium,
            backgroundColor: Colors.backgroundLight,
            borderRadius: BorderRadius.medium,
          }}
        >
          <Text style={{ ...Typography.body, color: Colors.textPrimary }}>
            Reminder time · {formatDisplayTime(reminder.time)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text
              style={{
                ...Typography.bodySmall,
                color: Colors.brandPrimary,
              }}
            >
              Edit
            </Text>
            <Feather name="chevron-right" size={16} color={Colors.brandPrimary} />
          </View>
        </Pressable>
      </View>
    );
  };

  const showSettingsNudge =
    permissionsStatus === 'denied' &&
    reminderList.some((reminder) => reminder.enabled);

  return (
    <View
      style={{
        marginHorizontal: Layout.screenMarginHorizontal,
        marginTop: Spacing.large,
        backgroundColor: Colors.surfaceCard,
        padding: Spacing.large,
        borderRadius: BorderRadius.large,
        ...{
          shadowColor: Colors.black,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 3,
        },
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: Spacing.small,
        }}
      >
        <View style={{ flex: 1, paddingRight: Spacing.small }}>
          <Text style={{ ...Typography.h3, color: Colors.textPrimary }}>
            Routine reminders
          </Text>
          <Text
            style={{
              ...Typography.bodySmall,
              color: Colors.textSecondary,
              marginTop: Spacing.tiny,
            }}
          >
            Schedule gentle nudges that match your personal rhythm—AM or PM.
          </Text>
        </View>
        {pendingSlot && <ActivityIndicator color={Colors.brandPrimary} />}
      </View>

      {reminderList.map(renderReminderRow)}

      {permissionsStatus === 'denied' && (
        <View
          style={{
            marginTop: Spacing.medium,
            padding: Spacing.medium,
            borderRadius: BorderRadius.medium,
            backgroundColor: '#FFF5E6',
          }}
        >
          <Text
            style={{
              ...Typography.bodySmall,
              color: Colors.warningOrange,
              marginBottom: Spacing.small,
            }}
          >
            Notifications are disabled for BetterSkin. Turn them on in Settings
            to receive reminders.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openSettings()}
            style={{
              paddingVertical: Spacing.small,
              paddingHorizontal: Spacing.medium,
              borderRadius: BorderRadius.medium,
              backgroundColor: Colors.brandPrimary,
              alignSelf: 'flex-start',
            }}
          >
            <Text
              style={{ ...Typography.bodySmall, color: Colors.white }}
            >
              Open Settings
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={!!iosPickerSlot} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.overlayDark,
            justifyContent: 'center',
            padding: Spacing.large,
          }}
        >
          <View
            style={{
              backgroundColor: Colors.surfaceCard,
              borderRadius: BorderRadius.large,
              padding: Spacing.large,
            }}
          >
            <Text
              style={{
                ...Typography.h4,
                color: Colors.textPrimary,
                marginBottom: Spacing.medium,
              }}
            >
              Select time
            </Text>
            <DateTimePicker
              mode="time"
              display="spinner"
              value={iosPickerDate}
              themeVariant="light"
              textColor={Colors.textPrimary}
              onChange={(_event, date) => {
                if (date) {
                  setIosPickerDate(date);
                }
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                marginTop: Spacing.medium,
                gap: Spacing.small,
              }}
            >
              <TouchableOpacity
                onPress={() => setIosPickerSlot(null)}
                style={{
                  paddingVertical: Spacing.small,
                  paddingHorizontal: Spacing.large,
                }}
              >
                <Text style={{ ...Typography.body, color: Colors.textSecondary }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (iosPickerSlot) {
                    saveTimeForSlot(iosPickerSlot, iosPickerDate);
                  }
                  setIosPickerSlot(null);
                }}
                style={{
                  paddingVertical: Spacing.small,
                  paddingHorizontal: Spacing.large,
                  backgroundColor: Colors.brandPrimary,
                  borderRadius: BorderRadius.medium,
                }}
              >
                <Text style={{ ...Typography.body, color: Colors.white }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
