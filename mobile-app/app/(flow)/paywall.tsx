import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SiteConfig } from '@site-config';
import { Text } from '@/components/ui/text';
import { GameButton } from '@/components/game/game-button';
import { GameIconButton } from '@/components/game/game-icon-button';
import { GameLogo } from '@/components/game/game-logo';
import { MenuBackdrop } from '@/components/game/menu-backdrop';
import { LoadingScreen } from '@/components/ui/loading';
import { PaywallFeatureList } from '@/components/flow/paywall-feature-list';
import { usePaywallPurchase } from '@/components/flow/use-paywall-purchase';

// Landscape shop screen: offer and buy button on the left, what it unlocks on
// the right, close button in the corner like the camp.
export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { loading, shouldSkipDevPaywall, isDevPurchase, closePaywall, handlePurchase } =
    usePaywallPurchase();

  if (shouldSkipDevPaywall) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-background">
      <MenuBackdrop dim={0.55} />

      <View
        className="absolute z-10"
        style={{ top: insets.top + 12, right: Math.max(insets.right, 16) }}>
        <GameIconButton icon="close" label="Fermer" onPress={closePaywall} />
      </View>

      <ScrollView
        contentContainerClassName="flex-grow flex-row flex-wrap items-center justify-center gap-x-10 gap-y-6"
        contentContainerStyle={{
          paddingTop: insets.top + 72,
          paddingBottom: insets.bottom + 16,
          paddingLeft: Math.max(insets.left, 24),
          paddingRight: Math.max(insets.right, 24),
        }}
        bounces={false}
        showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={FadeIn.duration(400)}
          className="w-full min-w-[280px] max-w-[400px] flex-1 items-center">
          <GameLogo size="md" tagline={false} />
          <Text className="mt-4 text-center font-pixel-bold text-[22px] uppercase tracking-[2px] text-primary">
            Version complète
          </Text>
          <Text className="mt-1 text-center font-pixel-bold text-[40px] leading-[44px] text-foreground">
            {SiteConfig.payment.priceDisplay}
          </Text>
          <Text className="mb-4 text-center font-sans text-[13px] text-muted-foreground">
            Paiement unique, mises à jour incluses
          </Text>
          <GameButton
            variant="hero"
            size="lg"
            className="w-full"
            onPress={handlePurchase}
            disabled={loading}
            label={loading ? 'Paiement...' : isDevPurchase ? 'Continuer (dev)' : 'Débloquer le jeu'}
          />
          <Text className="mt-2 text-center font-sans text-[12px] text-muted-foreground">
            Achat sécurisé · Restaurable à tout moment
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInRight.duration(400).delay(100)}
          className="w-full min-w-[280px] max-w-[400px] flex-1">
          <PaywallFeatureList />
        </Animated.View>
      </ScrollView>
    </View>
  );
}
