import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import {
  Colors,
  Layout,
  Spacing,
  Typography,
  Shadows,
  CardSizes,
  BorderRadius,
} from '../../../constants/Tokens';
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

const formatDateLabel = (dateStr: string, todayStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (dateStr === todayStr) {
    const formatted = date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return `Today · ${formatted}`;
  }

  const formatted = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return formatted;
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

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Generate marked dates based on completion status
  const markedDates = useMemo(() => {
    const marked: Record<
      string,
      {
        completionStatus?: CompletionStatus;
        isPast?: boolean;
        isToday?: boolean;
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
    const dateStr = date.dateString;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(dateStr);
    onDatePress(dateStr);
  };

  const handleViewRoutinePress = () => {
    if (!selectedDate) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDatePress(selectedDate);
  };

  const calendarTheme = {
    backgroundColor: Colors.surfaceCard,
    calendarBackground: Colors.surfaceCard,
    textSectionTitleColor: Colors.textSecondary,
    selectedDayBackgroundColor: Colors.successGreen,
    selectedDayTextColor: Colors.white,
    todayTextColor: Colors.brandSecondary,
    dayTextColor: Colors.textPrimary,
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
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
        paddingBottom: Spacing.small,
      },
      week: {
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
    },
  } as const;

  const selectedRoutine = logs[selectedDate];
  const selectedAllItems = selectedRoutine
    ? [...selectedRoutine.am, ...selectedRoutine.pm, ...selectedRoutine.lifestyle]
    : [];
  const selectedTotalItems = selectedAllItems.length;
  const selectedCompletedItems = selectedAllItems.filter((i) => i.completed).length;

  let selectedSummaryLabel = 'No routine logged yet';
  let selectedSummaryStatusColor = Colors.textSecondary;
  let selectedSummaryHelper: string | null = null;

  if (selectedTotalItems > 0) {
    selectedSummaryLabel = `${selectedCompletedItems} / ${selectedTotalItems} tasks completed`;
    const ratio = selectedCompletedItems / selectedTotalItems;
    if (ratio === 1) {
      selectedSummaryStatusColor = Colors.successGreen;
    } else if (ratio === 0) {
      selectedSummaryStatusColor = Colors.errorRed;
    } else {
      selectedSummaryStatusColor = Colors.warningOrange;
    }
    selectedSummaryHelper = 'Tap View routine to check off remaining tasks.';
  } else {
    selectedSummaryHelper = 'Tap View routine to plan your day.';
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.appBackground }}>
      {/* Header with Streak */}
      <View
        style={{
          paddingHorizontal: Layout.screenMarginHorizontal,
          paddingTop: Spacing.medium,
          paddingBottom: Spacing.large,
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
            marginBottom: Spacing.small,
          }}
        >
          Current streak: {streakCount} day{streakCount !== 1 ? 's' : ''}
        </Text>

        {/* Streak pill */}
        <View
          style={{
            paddingHorizontal: Spacing.medium,
            paddingVertical: Spacing.tiny,
            borderRadius: BorderRadius.pill,
            backgroundColor: 'rgba(77, 124, 255, 0.08)',
            borderWidth: 1,
            borderColor: 'rgba(77, 124, 255, 0.25)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.small,
          }}
        >
          <Feather name="zap" size={16} color={Colors.brandPrimary} />
          <Text
            style={{
              ...Typography.bodySmall,
              color: Colors.brandPrimary,
            }}
          >
            {streakCount}-day streak
          </Text>
        </View>
      </View>

      {/* Calendar Card */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: Layout.screenMarginHorizontal,
          paddingBottom: Spacing.xl,
        }}
      >
        <View
          style={{
            backgroundColor: Colors.surfaceCard,
            borderRadius: CardSizes.standard.borderRadius,
            padding: CardSizes.standard.padding,
            ...Shadows.card,
          }}
        >
          <Calendar
            markedDates={markedDates}
            theme={calendarTheme}
            style={{
              borderRadius: BorderRadius.medium,
            }}
            enableSwipeMonths={true}
            hideExtraDays={true}
            showWeekNumbers={false}
            dayComponent={({
              date,
              marking,
            }: {
              date: DateData;
              marking?: {
                completionStatus?: CompletionStatus;
                isPast?: boolean;
                isToday?: boolean;
              };
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

              const isSelected = !isPast && dateStr === selectedDate;

              const onPress = () => {
                if (isPast) return; // no edits / no modal for past days
                handleDatePress(date);
              };

              let content: React.ReactNode;
              let circleBackgroundColor = 'transparent';
              let circleBorderColor = 'transparent';
              let circleBorderWidth = 0;
              let textColor = Colors.textPrimary;

              // Base text color
              if (isPast && !hasRoutine) {
                textColor = Colors.textTertiary;
              }

              // Past days – show icons instead of date if routine exists
              if (isPast && hasRoutine) {
                if (completionStatus === 'full') {
                  content = (
                    <Feather
                      name="check-circle"
                      size={22}
                      color={Colors.successGreen}
                    />
                  );
                } else if (completionStatus === 'partial') {
                  content = (
                    <Feather
                      name="check-circle"
                      size={22}
                      color={Colors.warningOrange}
                    />
                  );
                } else if (completionStatus === 'none') {
                  content = (
                    <Entypo
                      name="circle-with-cross"
                      size={22}
                      color={Colors.errorRed}
                    />
                  );
                }
              }

              // Today & future days – show day number
              if (!content) {
                content = (
                  <Text
                    style={{
                      ...Typography.body,
                      color: textColor,
                    }}
                  >
                    {date.day}
                  </Text>
                );
              }

              // Completion tint for non-past days
              if (!isPast && hasRoutine) {
                if (completionStatus === 'full') {
                  circleBackgroundColor = 'rgba(0, 200, 83, 0.12)';
                  circleBorderColor = Colors.successGreen;
                  circleBorderWidth = 1;
                } else if (completionStatus === 'partial') {
                  circleBackgroundColor = 'rgba(255, 149, 0, 0.12)';
                  circleBorderColor = Colors.warningOrange;
                  circleBorderWidth = 1;
                } else if (completionStatus === 'none') {
                  circleBackgroundColor = 'rgba(255, 59, 48, 0.06)';
                }
              }

              // Selected state (today or future)
              if (isSelected) {
                circleBackgroundColor = 'rgba(77, 124, 255, 0.12)';
                circleBorderColor = Colors.brandPrimary;
                circleBorderWidth = 2;
                textColor = Colors.brandPrimary;
                if (!isPast && !hasRoutine) {
                  content = (
                    <Text
                      style={{
                        ...Typography.body,
                        color: Colors.brandPrimary,
                      }}
                    >
                      {date.day}
                    </Text>
                  );
                }
              }

              // Today halo
              const outerHaloBackground = isToday
                ? 'rgba(166, 184, 255, 0.25)'
                : 'transparent';

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
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: outerHaloBackground,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: circleBackgroundColor,
                        borderWidth: circleBorderWidth,
                        borderColor: circleBorderColor,
                      }}
                    >
                      {content}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {/* Legend */}
          <View
            style={{
              marginTop: Spacing.large,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="check-circle" size={14} color={Colors.successGreen} />
              <Text
                style={{
                  ...Typography.caption,
                  color: Colors.textSecondary,
                }}
              >
                Completed
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="check-circle" size={14} color={Colors.warningOrange} />
              <Text
                style={{
                  ...Typography.caption,
                  color: Colors.textSecondary,
                }}
              >
                Partial
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Entypo name="circle-with-cross" size={14} color={Colors.errorRed} />
              <Text
                style={{
                  ...Typography.caption,
                  color: Colors.textSecondary,
                }}
              >
                Missed
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 2,
                  borderColor: Colors.brandSecondary,
                  backgroundColor: Colors.white,
                }}
              />
              <Text
                style={{
                  ...Typography.caption,
                  color: Colors.textSecondary,
                }}
              >
                Today
              </Text>
            </View>
          </View>

          {/* Selected Day Summary */}
          <View
            style={{
              marginTop: Spacing.large,
              paddingHorizontal: Spacing.default,
              paddingVertical: Spacing.default,
              borderRadius: BorderRadius.medium,
              backgroundColor: Colors.backgroundLight,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1, paddingRight: Spacing.small }}>
              <Text
                style={{
                  ...Typography.bodyLarge,
                  color: Colors.textPrimary,
                  marginBottom: Spacing.tiny,
                }}
              >
                {formatDateLabel(selectedDate, todayStr)}
              </Text>
              <Text
                style={{
                  ...Typography.caption,
                  color: selectedSummaryStatusColor,
                }}
              >
                {selectedSummaryLabel}
              </Text>
              {selectedSummaryHelper && (
                <Text
                  style={{
                    ...Typography.caption,
                    color: Colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {selectedSummaryHelper}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleViewRoutinePress}
              style={{
                paddingHorizontal: Spacing.default,
                paddingVertical: Spacing.tiny,
                borderRadius: BorderRadius.pill,
                backgroundColor: Colors.primary,
              }}
            >
              <Text
                style={{
                  ...Typography.button,
                  fontSize: 13,
                  color: Colors.white,
                }}
              >
                View routine
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
