import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/theme-store';
import { useSheetTransition } from './use-sheet-transition';

type ChangeNameSheetProps = {
  visible: boolean;
  currentName: string | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onErrorChange: (message: string | null) => void;
  onSubmit: (name: string) => Promise<void>;
};

export function ChangeNameSheet({
  visible,
  currentName,
  saving,
  error,
  onClose,
  onErrorChange,
  onSubmit,
}: ChangeNameSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors, resolved } = useTheme();
  const [draftName, setDraftName] = useState('');
  const sheetProgress = useSheetTransition(visible);

  useEffect(() => {
    if (visible) {
      setDraftName(currentName ?? '');
      onErrorChange(null);
    }
  }, [currentName, onErrorChange, visible]);

  const submitName = async () => {
    const trimmedName = draftName.trim();
    if (!trimmedName) {
      onErrorChange('Name is required.');
      return;
    }

    await onSubmit(trimmedName);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end">
        <View className="flex-1 justify-end">
          <BlurView intensity={28} tint={resolved} style={StyleSheet.absoluteFill} />
          <View className="bg-black/10" style={StyleSheet.absoluteFill} />
          <Pressable
            accessibilityLabel="Close change name sheet"
            accessibilityRole="button"
            disabled={saving}
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            accessibilityViewIsModal
            className="rounded-t-[28px] bg-background px-6 pt-4"
            style={{
              paddingBottom: insets.bottom + 16,
              opacity: sheetProgress,
              transform: [
                {
                  translateY: sheetProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [28, 0],
                  }),
                },
              ],
            }}>
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="font-pixel-bold text-[20px] text-foreground">Change name</Text>
              <Button
                variant="secondary"
                size="icon"
                disabled={saving}
                accessibilityLabel="Close"
                onPress={onClose}
                className="rounded-none">
                <Ionicons name="close" size={18} color={colors['muted-foreground']} />
              </Button>
            </View>

            <Input
              label="Name"
              value={draftName}
              onChangeText={(text) => {
                setDraftName(text);
                if (error) onErrorChange(null);
              }}
              maxLength={64}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!saving}
              textContentType="name"
              returnKeyType="done"
              onSubmitEditing={() => void submitName()}
            />
            {error && <Text className="mt-2 text-[13px] text-destructive">{error}</Text>}

            <View className="mt-5">
              <Button
                disabled={saving}
                accessibilityLabel={saving ? 'Changing name' : 'Change the name'}
                onPress={() => void submitName()}
                className="rounded-none">
                {saving ? (
                  <ActivityIndicator color={colors['primary-foreground']} />
                ) : (
                  <Text className="font-pixel-bold text-[17px] text-primary-foreground">
                    Change the name
                  </Text>
                )}
              </Button>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
