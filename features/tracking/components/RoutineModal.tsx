import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'; // ✅ use Swipeable
import { BorderRadius, Colors, Layout, Spacing, Typography } from '../../../constants/Tokens';
import { useScanStore } from '../../scans/stores/scan-store';
import { useTrackingStore } from '../stores/tracking-store';

interface RoutineModalProps {
  date: string;
  visible: boolean;
  onClose: () => void;
}

interface RoutineSectionProps {
  title: string;
  items: { id: string; name: string; completed: boolean }[];
  onToggleItem: (itemId: string) => void;
  onAddItem: (name: string) => void;
  onRemoveItem: (itemId: string) => void;
  editable: boolean;
}

interface SwipeableItemProps {
  item: { id: string; name: string; completed: boolean };
  onToggleItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  disabled?: boolean;
}

function SwipeableItem({
  item,
  onToggleItem,
  onRemoveItem,
  disabled,
}: SwipeableItemProps) {
  const baseContent = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.small,
        paddingHorizontal: Spacing.medium,
        marginBottom: Spacing.small,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.medium,
        minHeight: 48,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {/* Checkbox */}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: item.completed ? Colors.successGreen : Colors.brandSecondary,
          backgroundColor: item.completed ? Colors.successGreen : 'transparent',
          marginRight: Spacing.medium,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {item.completed && (
          <Text
            style={{
              color: Colors.white,
              fontSize: 14,
              fontWeight: 'bold',
            }}
          >
            ✓
          </Text>
        )}
      </View>

      {/* Item Text */}
      <Text
        style={{
          ...Typography.body,
          color: item.completed ? Colors.textSecondary : Colors.textPrimary,
          textDecorationLine: item.completed ? 'line-through' : 'none',
          flex: 1,
        }}
      >
        {item.name}
      </Text>
    </View>
  );

  if (disabled) {
    // Read-only view for past days
    return <View>{baseContent}</View>;
  }

  // delete action UI shown when swiping left
  const renderRightActions = useCallback(() => {
    return (
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          width: 72,
          marginBottom: Spacing.small,
        }}
      >
        <View
          style={{
            backgroundColor: Colors.white,
            borderRadius: BorderRadius.medium,
            paddingHorizontal: Spacing.small,
            paddingVertical: Spacing.small,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="trash" size={24} color="#000000" />
        </View>
      </View>
    );
  }, []);

  const handleSwipeOpen = useCallback(
    async (direction: 'left' | 'right') => {
      // We only care about swipe-left (showing right actions)
      if (direction === 'right') {
        return;
      }

      // Haptic + delete when the row fully opens
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onRemoveItem(item.id);
    },
    [item.id, onRemoveItem]
  );

  return (
    <Swipeable
      overshootRight={false}
      overshootLeft={false}
      enableTrackpadTwoFingerGesture
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen} // called when fully swiped
    >
      <TouchableOpacity
        onPress={async () => {
          onToggleItem(item.id);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        {baseContent}
      </TouchableOpacity>
    </Swipeable>
  );
}

function RoutineSection({
  title,
  items,
  onToggleItem,
  onAddItem,
  onRemoveItem,
  editable,
}: RoutineSectionProps) {
  const [newItemName, setNewItemName] = useState('');

  const handleAddItem = () => {
    if (!editable) return;
    if (newItemName.trim()) {
      onAddItem(newItemName.trim());
      setNewItemName('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={{ marginBottom: Spacing.xl }}>
      {/* Section Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: Spacing.medium,
        }}
      >
        <View
          style={{
            width: 4,
            height: 20,
            backgroundColor: Colors.brandPrimary,
            borderRadius: 2,
            marginRight: Spacing.medium,
          }}
        />
        <Text
          style={{
            ...Typography.h3,
            color: Colors.textPrimary,
          }}
        >
          {title}
        </Text>
        <View
          style={{
            flex: 1,
            height: 1,
            backgroundColor: Colors.brandSecondary,
            marginLeft: Spacing.medium,
          }}
        />
      </View>

      {/* Items List */}
      {items.map((item) => (
        <SwipeableItem
          key={item.id}
          item={item}
          onToggleItem={onToggleItem}
          onRemoveItem={onRemoveItem}
          disabled={!editable}
        />
      ))}

      {/* Add New Item */}
      {editable && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors.brandSecondary,
            borderRadius: BorderRadius.medium,
            paddingHorizontal: Spacing.medium,
            paddingVertical: Spacing.small,
            minHeight: 48,
          }}
        >
          <TextInput
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="Add custom item..."
            placeholderTextColor={Colors.textTertiary}
            style={{
              ...Typography.body,
              color: Colors.textPrimary,
              flex: 1,
              paddingVertical: 0,
            }}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={handleAddItem}
            disabled={!newItemName.trim()}
            style={{
              paddingHorizontal: Spacing.small,
              paddingVertical: Spacing.tiny,
              backgroundColor: newItemName.trim()
                ? Colors.brandPrimary
                : Colors.brandSecondary,
              borderRadius: BorderRadius.small,
            }}
          >
            <Text
              style={{
                ...Typography.button,
                color: newItemName.trim()
                  ? Colors.white
                  : Colors.textTertiary,
                fontSize: 16,
              }}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function RoutineModal({
  date,
  visible,
  onClose,
}: RoutineModalProps) {
  const routine = useTrackingStore((state) => state.getRoutineForDate(date));
  const toggleItem = useTrackingStore((state) => state.toggleItem);
  const addCustomItem = useTrackingStore((state) => state.addCustomItem);
  const removeItem = useTrackingStore((state) => state.removeItem);
  const importFromScan = useTrackingStore((state) => state.importFromScan);

  const getRecentRuns = useScanStore((state) => state.getRecentRuns);

  const isPast = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date + 'T00:00:00');
    d.setHours(0, 0, 0, 0);
    return d < today;
  }, [date]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle import actions
  const handleImportFromScan = async () => {
    if (isPast) return; // 🔒 no imports for past days
    await importFromScan(date);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const hasData =
    routine &&
    (routine.am.length > 0 ||
      routine.pm.length > 0 ||
      routine.lifestyle.length > 0);

  const handleRemoveItem =
    (section: 'am' | 'pm' | 'lifestyle') => (itemId: string) => {
      if (isPast) return; // 🔒 no delete
      removeItem(date, section, itemId);
    };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View
          style={{
            padding: Layout.screenMarginHorizontal,
            paddingBottom: Spacing.xxl,
          }}
        >
          {/* Header */}
          <View
            style={{
              marginBottom: Spacing.large,
              alignItems: 'center',
            }}
          >
            {/* <Text
              style={{
                ...Typography.h3,
                color: Colors.textPrimary,
                marginBottom: Spacing.small,
              }}
            >
              Routine for {formatDate(date)}
            </Text> */}

            {isPast && (
              <Text
                style={{
                  ...Typography.body,
                  color: Colors.textSecondary,
                  marginBottom: Spacing.medium,
                  textAlign: 'center',
                }}
              >
                Past days are locked. You can review them, but not edit.
              </Text>
            )}

            {/* Import Button (only for today/future) */}
            {!isPast && (
              <TouchableOpacity
                onPress={handleImportFromScan}
                style={{
                  backgroundColor: Colors.brandPrimary,
                  paddingVertical: Spacing.medium,
                  paddingHorizontal: Spacing.large,
                  borderRadius: BorderRadius.medium,
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Text
                  style={{
                    ...Typography.button,
                    color: Colors.white,
                  }}
                >
                  Import from Latest Scan
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingBottom: Spacing.xxxl,
              opacity: isPast ? 0.9 : 1,
            }}
          >
            {!hasData ? (
              <View
                style={{
                  alignItems: 'center',
                  paddingVertical: Spacing.xxxl,
                }}
              >
                <Text
                  style={{
                    ...Typography.bodyLarge,
                    color: Colors.textSecondary,
                    textAlign: 'center',
                  }}
                >
                  No routine planned for this day yet.
                  {isPast
                    ? ' Past days cannot be edited.'
                    : ' Use the buttons above to get started!'}
                </Text>
              </View>
            ) : (
              <>
                {/* AM Section */}
                <RoutineSection
                  title="Morning (AM) Routine"
                  items={routine?.am || []}
                  onToggleItem={(itemId) => toggleItem(date, 'am', itemId)}
                  onAddItem={(name) => addCustomItem(date, 'am', name)}
                  onRemoveItem={handleRemoveItem('am')}
                  editable={!isPast}
                />

                {/* PM Section */}
                <RoutineSection
                  title="Evening (PM) Routine"
                  items={routine?.pm || []}
                  onToggleItem={(itemId) => toggleItem(date, 'pm', itemId)}
                  onAddItem={(name) => addCustomItem(date, 'pm', name)}
                  onRemoveItem={handleRemoveItem('pm')}
                  editable={!isPast}
                />

                {/* Lifestyle Section */}
                <RoutineSection
                  title="Lifestyle"
                  items={routine?.lifestyle || []}
                  onToggleItem={(itemId) =>
                    toggleItem(date, 'lifestyle', itemId)
                  }
                  onAddItem={(name) => addCustomItem(date, 'lifestyle', name)}
                  onRemoveItem={handleRemoveItem('lifestyle')}
                  editable={!isPast}
                />
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
