import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { GameButton } from '@/components/game/game-button';
import { GameLogo } from '@/components/game/game-logo';
import { GamePanel } from '@/components/game/game-panel';
import { MenuBackdrop } from '@/components/game/menu-backdrop';
import { useGuest } from '@/lib/guest-store';

// Game home ("camp"): the title art with the main actions, like the web menu.
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isGuest } = useGuest();
  // Le défi du jour et la boutique sont dans le menu du jeu lui-même.
  const play = () => router.push('/(app)/game');

  return (
    <View className="flex-1 bg-background">
      <MenuBackdrop dim={0.35} />
      <ScrollView
        contentContainerClassName="flex-grow justify-between px-6"
        contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 100 }}>
        <GameLogo size="lg" />

        <Animated.View
          entering={FadeInDown.duration(400)}
          className="mt-10 w-full max-w-[420px] self-center">
          <GameButton
            variant="hero"
            size="lg"
            label="Jouer"
            sublabel="Nouvelle partie"
            onPress={play}
          />
          <View className="mt-3 flex-row gap-3">
            <GameButton
              variant="panel"
              label="Défi"
              sublabel="Du jour"
              className="flex-1"
              onPress={play}
            />
            <GameButton
              variant="panel"
              label="Boutique"
              sublabel="Éclats"
              className="flex-1"
              onPress={play}
            />
          </View>

          {isGuest && (
            <GamePanel className="mt-5 p-4">
              <Text className="font-pixel-bold text-[15px] uppercase tracking-[2px] text-foreground">
                Mode invité
              </Text>
              <Text className="mb-3 mt-1 font-sans text-[14px] text-muted-foreground">
                Ta progression reste sur ce téléphone. Crée un compte pour la garder partout.
              </Text>
              <GameButton
                variant="ally"
                label="Créer un compte"
                onPress={() => router.push('/onboarding')}
              />
            </GamePanel>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
