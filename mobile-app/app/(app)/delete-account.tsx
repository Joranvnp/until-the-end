import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { api } from '@convex/_generated/api';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth-store';
import { useTheme } from '@/lib/theme-store';
import { usePostHog } from 'posthog-react-native';

const HOLD_DURATION_MS = 5000;
const COVERED_TEXT_COLOR = '#FECACA';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { userId, signOut } = useAuth();
  const { colors } = useTheme();
  const posthog = usePostHog();
  const anonymizeAccount = useMutation(api.users.account.anonymizeAccount);
  const holdProgress = useSharedValue(0);
  const deleteFill = useSharedValue(0);
  const [deleting, setDeleting] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const deleteStartedRef = useRef(false);

  const navigateAfterDeletion = useCallback(async () => {
    await signOut();
    router.replace({
      pathname: '/onboarding',
      params: { accountDeleted: '1' },
    });
  }, [router, signOut]);

  const startDeletion = useCallback(async () => {
    if (!userId || deleting || deleteStartedRef.current) return;

    deleteStartedRef.current = true;
    setDeleting(true);
    setIsHolding(false);
    posthog.capture('account_delete_hold_completed');

    try {
      await anonymizeAccount({});
      posthog.capture('account_deleted');
      deleteFill.value = withTiming(
        1,
        { duration: 700, easing: Easing.inOut(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(navigateAfterDeletion)();
        }
      );
    } catch (error) {
      console.error(error);
      deleteStartedRef.current = false;
      holdProgress.value = withTiming(0, { duration: 180 });
      deleteFill.value = 0;
      setDeleting(false);
      Alert.alert('Une erreur est survenue', 'Impossible de supprimer le compte. Réessaie.');
    }
  }, [
    anonymizeAccount,
    deleteFill,
    deleting,
    holdProgress,
    navigateAfterDeletion,
    posthog,
    userId,
  ]);

  const handlePressIn = () => {
    if (deleting || !userId) return;

    setIsHolding(true);
    void Haptics.selectionAsync();
    holdProgress.value = withTiming(1, { duration: HOLD_DURATION_MS, easing: Easing.linear });
  };

  const handlePressOut = () => {
    if (deleting || deleteStartedRef.current) return;

    setIsHolding(false);
    cancelAnimation(holdProgress);
    holdProgress.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) });
  };

  const handleLongPress = () => {
    if (deleting || !userId) return;

    holdProgress.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    void startDeletion();
  };

  const iconHaloStyle = useAnimatedStyle(() => ({
    opacity: 0.9 + holdProgress.value * 0.1,
    transform: [{ scale: 1 + holdProgress.value * 0.05 }],
  }));

  const deleteFillStyle = useAnimatedStyle(() => ({
    height: Math.max(holdProgress.value, deleteFill.value) * height,
  }));

  const renderHoldButtonContent = (covered = false) => (
    <View className="h-full flex-row items-center gap-3 px-4">
      <View
        className={
          covered
            ? 'h-11 w-11 items-center justify-center rounded-none bg-black/5'
            : 'bg-background/90 h-11 w-11 items-center justify-center rounded-none'
        }>
        {deleting ? (
          <ActivityIndicator color={covered ? COVERED_TEXT_COLOR : colors.destructive} />
        ) : (
          <Ionicons
            name={isHolding ? 'timer-outline' : 'finger-print-outline'}
            size={21}
            color={covered ? COVERED_TEXT_COLOR : colors.destructive}
          />
        )}
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className={
            covered
              ? 'font-pixel-bold text-[16px] text-[#FECACA]'
              : 'font-pixel-bold text-[16px] text-destructive'
          }>
          {deleting
            ? 'Suppression…'
            : isHolding
              ? 'Continue d’appuyer'
              : 'Maintiens pour supprimer'}
        </Text>
        <Text
          className={
            covered
              ? 'font-sans text-[12px] leading-4 text-[#FCA5A5]'
              : 'font-sans text-[12px] leading-4 text-muted-foreground'
          }>
          {deleting ? 'Effacement du compte' : isHolding ? 'Presque fini' : '5 secondes'}
        </Text>
      </View>
      <Ionicons
        name={isHolding ? 'trash-bin-outline' : 'chevron-forward'}
        size={20}
        color={covered ? COVERED_TEXT_COLOR : colors.destructive}
      />
    </View>
  );

  const renderScreenContent = (covered = false) => (
    <>
      <View className="flex-row items-center px-5 pb-3" style={{ paddingTop: insets.top + 12 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour aux réglages"
          onPress={() => router.back()}
          disabled={deleting}
          className={
            covered
              ? 'size-10 items-center justify-center rounded-none bg-black/5'
              : 'size-10 items-center justify-center rounded-none bg-secondary active:opacity-70'
          }
          hitSlop={8}>
          <Ionicons
            name="chevron-back"
            size={21}
            color={covered ? COVERED_TEXT_COLOR : colors.foreground}
          />
        </Pressable>
      </View>

      <View className="flex-1 justify-center px-8">
        <View className="items-center">
          <Animated.View
            className="mb-9 h-32 w-32 items-center justify-center"
            style={iconHaloStyle}>
            <View
              className={
                covered
                  ? 'absolute h-28 w-28 rounded-none bg-black/5'
                  : 'bg-destructive/10 absolute h-28 w-28 rounded-none'
              }
            />
            <View
              className={
                covered
                  ? 'h-24 w-24 items-center justify-center rounded-none bg-black/5'
                  : 'h-24 w-24 items-center justify-center rounded-none bg-destructive'
              }>
              <Ionicons name="trash-outline" size={39} color={COVERED_TEXT_COLOR} />
            </View>
          </Animated.View>
          <Text
            className={
              covered
                ? 'mb-3 text-center font-pixel-bold text-[30px] leading-[36px] text-[#FECACA]'
                : 'mb-3 text-center font-pixel-bold text-[30px] leading-[36px] text-foreground'
            }>
            Tu nous quittes ?
          </Text>
          <Text
            className={
              covered
                ? 'mb-7 text-center font-sans text-[16px] leading-[23px] text-[#FCA5A5]'
                : 'mb-7 text-center font-sans text-[16px] leading-[23px] text-muted-foreground'
            }>
            D’accord. Juste une chose avant.
          </Text>
          <Text
            className={
              covered
                ? 'max-w-[300px] text-center font-sans text-[16px] leading-[25px] text-[#FECACA]'
                : 'max-w-[300px] text-center font-sans text-[16px] leading-[25px] text-foreground'
            }>
            Cela supprime ton compte, tes éclats, tes tenues et tes records. Impossible de les
            récupérer ensuite.
          </Text>
        </View>
      </View>

      <View className="px-6" style={{ paddingBottom: insets.bottom + 18 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Maintiens cinq secondes pour supprimer le compte"
          accessibilityHint="Garde le doigt appuyé jusqu’à ce que l’écran se remplisse."
          accessibilityState={{ busy: deleting, disabled: deleting || !userId }}
          delayLongPress={HOLD_DURATION_MS}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={handleLongPress}
          disabled={deleting || !userId}
          className={
            covered
              ? 'h-[68px] overflow-hidden rounded-[28px] border border-[#FCA5A5] bg-black/5 disabled:opacity-70'
              : 'bg-destructive/10 h-[68px] overflow-hidden rounded-[28px] border border-border active:opacity-90 disabled:opacity-70'
          }>
          {renderHoldButtonContent(covered)}
        </Pressable>
      </View>
    </>
  );

  return (
    <View className="flex-1 bg-background">
      <Animated.View
        pointerEvents="none"
        className="absolute inset-x-0 bottom-0 bg-destructive"
        style={deleteFillStyle}
      />

      {renderScreenContent(false)}

      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="absolute inset-x-0 bottom-0 overflow-hidden"
        style={deleteFillStyle}>
        <View className="absolute inset-x-0 bottom-0" style={{ height }}>
          {renderScreenContent(true)}
        </View>
      </Animated.View>
    </View>
  );
}
