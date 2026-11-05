import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { GameButton } from '@/components/game/game-button';
import { GameIconButton } from '@/components/game/game-icon-button';
import { GameLogo } from '@/components/game/game-logo';
import { MenuBackdrop } from '@/components/game/menu-backdrop';
import { useAuth } from '@/lib/auth-store';
import { useGuest } from '@/lib/guest-store';

// Camp, in landscape: logo on the left, the main actions on the right and the
// small corner buttons on top, like the title screens of Stardew Valley or Terraria.
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isGuest } = useGuest();
  // Le défi du jour et la boutique sont dans le menu du jeu lui-même.
  const play = () => router.push('/(app)/game');
  const openAccount = () => router.push(isAuthenticated ? '/(app)/account' : '/onboarding');

  return (
    <View className="flex-1 bg-background">
      <MenuBackdrop art="camp" dim={0.4} />

      <View
        className="absolute z-10 flex-row gap-2"
        style={{ top: insets.top + 12, right: Math.max(insets.right, 16) }}>
        <GameIconButton
          icon="help-circle-outline"
          label="Aide"
          onPress={() => router.push('/(app)/tutorials')}
        />
        <GameIconButton
          icon={isAuthenticated ? 'person-outline' : 'person-add-outline'}
          label={isAuthenticated ? 'Mon compte' : 'Créer un compte'}
          onPress={openAccount}
        />
        <GameIconButton
          icon="settings-outline"
          label="Réglages"
          onPress={() => router.push('/(app)/settings')}
        />
      </View>

      <ScrollView
        contentContainerClassName="flex-grow flex-row flex-wrap items-center justify-center gap-x-10 gap-y-6"
        contentContainerStyle={{
          paddingTop: insets.top + 72,
          paddingBottom: insets.bottom + 16,
          paddingLeft: Math.max(insets.left, 24),
          paddingRight: Math.max(insets.right, 24),
        }}
        bounces={false}>
        <Animated.View
          entering={FadeIn.duration(500)}
          className="min-w-[280px] flex-1 items-center">
          <GameLogo size="lg" />
          {isGuest && (
            <Text className="mt-4 max-w-[320px] text-center font-sans text-[13px] text-muted-foreground">
              Mode invité : ta progression reste sur ce téléphone.
            </Text>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInRight.duration(400).delay(100)}
          className="w-full min-w-[280px] max-w-[380px] flex-1">
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
            <GameButton
              variant="ally"
              label="Créer un compte"
              sublabel="Garde ta progression partout"
              className="mt-3"
              onPress={() => router.push('/onboarding')}
            />
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
