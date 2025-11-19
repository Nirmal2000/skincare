import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Colors, Layout, Spacing, Typography } from '../../../constants/Tokens';
import { useTrackingStore } from '../stores/tracking-store';

interface CalendarViewProps {
  onDatePress: (date: string) => void;
}

type CompletionStatus = 'empty' | 'none' | 'partial' | 'full';

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`; // YYYY-MM-DD in *local* time
};

const parseLocalDateFromString = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day); // local midnight
};

export default function CalendarView({ onDatePress }: CalendarViewProps) {
  const logs = useTrackingStore((state) => state.logs);
  const streakCount = useTrackingStore((state) => state.getStreakCount());

  // Today helpers
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()); // local midnight
  }, []);

  const todayStr = useMemo(() => {
    return getLocalDateString(new Date());
  }, []);


  // Generate marked dates based on completion status
  const markedDates = useMemo(() => {
    const marked: Record<
      string,
      {
        completionStatus?: CompletionStatus;
        isPast?: boolean;
        isToday?: boolean;
        disabled?: boolean;
        disableTouchEvent?: boolean;
      }
    > = {};

    Object.keys(logs).forEach((dateStr) => {
      const routine = logs[dateStr];
      const allItems = [...routine.am, ...routine.pm, ...routine.lifestyle];

      const totalItems = allItems.length;
      const completedItems = allItems.filter((item) => item.completed).length;

      const date = parseLocalDateFromString(dateStr);
      const isPast = date < today;
      const isToday = dateStr === todayStr;


      let completionStatus: CompletionStatus = 'empty';

      if (totalItems === 0) {
        completionStatus = 'empty';
      } else if (completedItems === 0) {
        completionStatus = 'none';
      } else if (completedItems === totalItems) {
        completionStatus = 'full';
      } else {
        completionStatus = 'partial';
      }

      marked[dateStr] = {
        completionStatus,
        isPast,
        isToday,
      };
    });

    // Ensure today is always marked (even if no logs yet)
    if (!marked[todayStr]) {
      marked[todayStr] = {
        completionStatus: 'empty',
        isPast: false,
        isToday: true,
      };
    } else {
      marked[todayStr].isToday = true;
    }

    return marked;
  }, [logs, today, todayStr]);

  const handleDatePress = (date: DateData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDatePress(date.dateString);
  };

  const calendarTheme = {
    backgroundColor: Colors.appBackground,
    calendarBackground: Colors.appBackground,
    textSectionTitleColor: Colors.textSecondary,
    selectedDayBackgroundColor: Colors.successGreen,
    selectedDayTextColor: Colors.white,
    todayTextColor: Colors.brandSecondary,
    dayTextColor: Colors.textPrimary,
    // Dimmed color for disabled (past) days
    textDisabledColor: Colors.textTertiary,
    dotColor: Colors.accentBlue,
    selectedDotColor: Colors.white,
    arrowColor: Colors.brandSecondary,
    monthTextColor: Colors.textPrimary,
    indicatorColor: Colors.brandSecondary,
    textDayFontSize: Typography.body.fontSize,
    textMonthFontSize: Typography.h3.fontSize,
    textDayHeaderFontSize: Typography.caption.fontSize,
    'stylesheet.calendar.header': {
      week: {
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.appBackground }}>
      {/* Header with Streak */}
      <View
        style={{
          paddingHorizontal: Layout.screenMarginHorizontal,
          paddingVertical: Spacing.large,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            ...Typography.h2,
            color: Colors.textPrimary,
            marginBottom: Spacing.small,
          }}
        >
          Your Consistency
        </Text>
        <Text
          style={{
            ...Typography.bodyLarge,
            color: Colors.textSecondary,
          }}
        >
          Current Streak: {streakCount} day{streakCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Calendar */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: Layout.screenMarginHorizontal,
        }}
      >
        <Calendar
          markedDates={markedDates}
          theme={calendarTheme}
          style={{
            borderRadius: 12,
            elevation: 2,
            shadowColor: Colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
          enableSwipeMonths={true}
          hideExtraDays={true}
          showWeekNumbers={false}
          dayComponent={({
            date,
            marking,
          }: {
            date: DateData;
            marking?: any;
          }) => {
            const dateStr = date.dateString;
            const isToday = marking?.isToday || dateStr === todayStr;
            const isPast =
              typeof marking?.isPast === 'boolean'
                ? marking.isPast
                : parseLocalDateFromString(dateStr) < today;
           
            const completionStatus: CompletionStatus =
              marking?.completionStatus ?? 'empty';

            const hasRoutine =
              completionStatus === 'full' ||
              completionStatus === 'partial' ||
              completionStatus === 'none';

            const onPress = () => {
              if (isPast) return; // 🔒 no edits / no modal for past days
              handleDatePress(date);
            };

            let content: React.ReactNode;

            // Past days – show icons instead of date
            if (isPast && hasRoutine) {
              if (completionStatus === 'full') {
                // ✅ fully done – green check
                content = (
                  <Feather
                    name="check-circle"
                    size={24}
                    color={Colors.successGreen}
                  />
                );
              } else if (completionStatus === 'partial') {
                // 🟠 partial – orange check
                content = (
                  <Feather name="check-circle" size={24} color={Colors.warningOrange} />
                );
              } else if (completionStatus === 'none') {
                // ❌ not done – red cross-in-circle
                content = (
                  <Entypo
                    name="circle-with-cross"
                    size={24}
                    color={Colors.errorRed}
                  />
                );
              } else {
                content = (
                  <Text
                    style={{
                      ...Typography.body,
                      color: Colors.textTertiary,
                    }}
                  >
                    {date.day}
                  </Text>
                );
              }
            } else {
              // Today & future days – show day number
              content = (
                <Text
                  style={{
                    ...Typography.body,
                    color: isPast ? Colors.textTertiary : Colors.textPrimary,
                  }}
                >
                  {date.day}
                </Text>
              );
            }

            return (
              <TouchableOpacity
                onPress={onPress}
                disabled={isPast}
                style={{
                  paddingVertical: 4,
                  alignItems: 'center',
                  justifyContent: 'center',                  
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...(isToday
                      ? {
                          borderWidth: 2,
                          borderColor: Colors.brandSecondary, // 🔵 circle around today
                          backgroundColor: Colors.white,
                        }
                      : {}),
                  }}
                >
                  {content}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
}
