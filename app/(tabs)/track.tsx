import React, { useState } from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import CalendarView from '../../features/tracking/components/CalendarView';
import RoutineModal from '../../features/tracking/components/RoutineModal';
import {
  useTrackingStore,
  useTrackingStoreHydrated,
} from '../../features/tracking/stores/tracking-store';
import { Colors, Spacing } from '@/constants/Tokens';
import { RoutineRemindersCard } from '@/features/notifications/components/RoutineRemindersCard';

export default function TrackScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const isHydrated = useTrackingStoreHydrated();
  const ensureRoutineForDate = useTrackingStore(
    (state) => state.ensureRoutineForDate
  );

  const handleDatePress = (date: string) => {
    ensureRoutineForDate(date);
    setSelectedDate(date);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedDate(null);
  };

  // Show loading state while hydrating
  if (!isHydrated) {
    return <View style={{ flex: 1, backgroundColor: '#FFF5F8' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.appBackground }}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Colors.appBackground }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        >
          <RoutineRemindersCard />

          <View style={{ paddingTop: Spacing.large }}>
            {/* Main Calendar View */}
            <CalendarView onDatePress={handleDatePress} />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Routine Modal */}
      {true && (
        <RoutineModal
          date={selectedDate || '2025-11-19'}
          visible={modalVisible}
          onClose={handleCloseModal}
        />
      )}
    </GestureHandlerRootView>
  );
}
