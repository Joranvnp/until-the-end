import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SiteConfig } from '@site-config';
import { Text } from '@/components/ui/text';
import { GamePanel } from '@/components/game/game-panel';
import { PixelFrame } from '@/components/game/pixel-frame';
import { useTheme } from '@/lib/theme-store';

type IoniconName = keyof typeof Ionicons.glyphMap;

const FEATURES: { icon: IoniconName; title: string; subtitle: string }[] = [
  {
    icon: 'diamond-outline',
    title: 'Un seul paiement',
    subtitle: `${SiteConfig.payment.priceDisplay}, une fois pour toutes`,
  },
  {
    icon: 'infinite-outline',
    title: 'Tout le jeu',
    subtitle: 'Toutes les difficultés, défis et tenues',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Sans abonnement',
    subtitle: 'Jamais rien de plus à payer',
  },
];

export function PaywallFeatureList() {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(200)} className="gap-3">
      {FEATURES.map((feature) => (
        <GamePanel key={feature.title} contentClassName="flex-row items-center gap-4 p-3">
          <PixelFrame tone="hero" contentClassName="size-11 items-center justify-center">
            <Ionicons name={feature.icon} size={20} color={colors['hero-foreground']} />
          </PixelFrame>
          <View className="flex-1">
            <Text className="font-pixel-bold text-[16px] uppercase tracking-[1px] text-foreground">
              {feature.title}
            </Text>
            <Text className="font-sans text-[14px] text-muted-foreground">{feature.subtitle}</Text>
          </View>
        </GamePanel>
      ))}
    </Animated.View>
  );
}
