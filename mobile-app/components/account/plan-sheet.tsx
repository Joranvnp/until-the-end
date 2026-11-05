import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SiteConfig } from '@site-config';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/theme-store';
import { PLAN_FEATURES } from './content';
import { useSheetTransition } from './use-sheet-transition';

type PlanSheetProps = {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onPurchase: () => Promise<void>;
};

export function PlanSheet({ visible, loading, onClose, onPurchase }: PlanSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors, resolved } = useTheme();
  const sheetProgress = useSheetTransition(visible);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <BlurView intensity={28} tint={resolved} style={StyleSheet.absoluteFill} />
        <View className="bg-black/10" style={StyleSheet.absoluteFill} />
        <Pressable
          accessibilityLabel="Fermer les offres"
          accessibilityRole="button"
          disabled={loading}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          accessibilityViewIsModal
          className="rounded-t-[28px] bg-background pt-4"
          style={{
            maxHeight: '86%',
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
          <View className="mb-2 flex-row items-center justify-between px-6">
            <Text className="font-pixel-bold text-[20px] text-foreground">Offre</Text>
            <Button
              variant="secondary"
              size="icon"
              disabled={loading}
              accessibilityLabel="Fermer"
              onPress={onClose}
              className="rounded-none">
              <Ionicons name="close" size={18} color={colors['muted-foreground']} />
            </Button>
          </View>

          <ScrollView
            className="flex-shrink"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 18 }}>
            <Text className="mt-3 font-pixel-bold text-[30px] leading-[36px] text-foreground">
              Jeu complet à vie
            </Text>
            <Text className="mt-2 text-[15px] leading-6 text-muted-foreground">
              Débloque tout le jeu une fois pour toutes, sans abonnement.
            </Text>

            <View className="mt-7 flex-row items-end gap-1">
              <Text className="font-pixel-bold text-[44px] leading-[48px] text-foreground">
                {SiteConfig.payment.priceDisplay}
              </Text>
              <Text className="pb-2 text-[14px] text-muted-foreground">une seule fois</Text>
            </View>

            <View className="mt-7 gap-5">
              {PLAN_FEATURES.map((feature) => (
                <View key={feature.title} className="flex-row gap-4">
                  <View className="mt-0.5 size-11 items-center justify-center rounded-none bg-secondary">
                    <Ionicons name={feature.icon} size={20} color={colors.foreground} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="font-pixel-bold text-[16px] text-foreground">
                      {feature.title}
                    </Text>
                    <Text className="mt-0.5 text-[14px] leading-5 text-muted-foreground">
                      {feature.subtitle}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View className="px-6 pt-2">
            <Button
              disabled={loading}
              accessibilityLabel={loading ? 'Déblocage du jeu complet' : 'Débloquer le jeu complet'}
              onPress={() => void onPurchase()}
              className="rounded-none">
              {loading ? (
                <ActivityIndicator color={colors['primary-foreground']} />
              ) : (
                <Text className="font-pixel-bold text-[17px] text-primary-foreground">
                  Débloquer le jeu complet
                </Text>
              )}
            </Button>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
