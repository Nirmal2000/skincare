import React, { useState } from 'react';
import { StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CalendarView from '../../features/tracking/components/CalendarView';
import RoutineModal from '../../features/tracking/components/RoutineModal';
import { useTrackingStoreHydrated } from '../../features/tracking/stores/tracking-store';
import { Colors } from '@/constants/Tokens';

export default function TrackScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const isHydrated = useTrackingStoreHydrated();

  const handleDatePress = (date: string) => {
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
      {/* <SafeAreaView style={{ flex: 1,  }}> */}
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFF5F8"
        />

        {/* Main Calendar View */}
        <CalendarView onDatePress={handleDatePress} />

      {/* Routine Modal */}
      {true && (
        <RoutineModal
          date={selectedDate || '2025-11-19'}
          visible={modalVisible}
          onClose={handleCloseModal}
        />
      )}
      {/* </SafeAreaView> */}
    </GestureHandlerRootView>
  );
}
