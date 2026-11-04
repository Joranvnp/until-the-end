import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SiteConfig } from '@site-config';
import { Text } from '@/components/ui/text';
import { GameButton } from '@/components/game/game-button';
import { LoadingScreen } from '@/components/ui/loading';
import { PaywallFeatureList } from '@/components/flow/paywall-feature-list';
import { PaywallHero } from '@/components/flow/paywall-hero';
import { usePaywallPurchase } from '@/components/flow/use-paywall-purchase';

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { loading, shouldSkipDevPaywall, isDevPurchase, closePaywall, handlePurchase } =
    usePaywallPurchase();

  if (shouldSkipDevPaywall) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}>
        <PaywallHero onClose={closePaywall} />

        <View className="px-7">
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Text className="text-center font-pixel-bold text-[30px] uppercase leading-[36px] tracking-[2px] text-primary">
              Version complète
            </Text>
            <Text className="mt-2 text-center font-sans text-[16px] leading-6 text-muted-foreground">
              Un seul paiement. Le jeu entier, pour toujours.
            </Text>
          </Animated.View>

          <PaywallFeatureList />

          <Animated.View
            entering={FadeInDown.duration(400).delay(350)}
            className="mt-12 items-center">
            <View className="flex-row items-end gap-1">
              <Text className="font-pixel-bold text-[56px] leading-[56px] tracking-tight text-foreground">
                {SiteConfig.payment.priceDisplay}
              </Text>
            </View>
            <Text className="mt-2 font-sans text-[14px] text-muted-foreground">
              paiement unique, toutes les mises à jour incluses
            </Text>
          </Animated.View>
        </View>
      </ScrollView>

      <View
        className="absolute inset-x-0 bottom-0 border-t-2 border-edge bg-background px-6"
        style={{ paddingBottom: insets.bottom + 8, paddingTop: 12 }}>
        <GameButton
          variant="hero"
          size="lg"
          onPress={handlePurchase}
          disabled={loading}
          label={loading ? 'Paiement...' : isDevPurchase ? 'Continuer (dev)' : 'Débloquer le jeu'}
        />
        <Text className="mt-3 text-center font-sans text-[12px] text-muted-foreground">
          Achat unique sécurisé · Restaurable à tout moment
        </Text>
      </View>
    </View>
  );
}
