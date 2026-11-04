import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SiteConfig } from '@site-config';
import { Text } from '@/components/ui/text';
import { GameButton } from '@/components/game/game-button';
import { GameLogo } from '@/components/game/game-logo';
import { GamePanel } from '@/components/game/game-panel';
import { MenuBackdrop } from '@/components/game/menu-backdrop';
import { SignInForm } from '@/components/onboarding/sign-in-form';
import { useGuest } from '@/lib/guest-store';

type TitleView = 'menu' | 'signin' | 'signup';

// Title screen: the menu art and logo, then the three ways in.
export default function TitleScreen() {
  const router = useRouter();
  const { enterGuest, leaveGuest } = useGuest();
  const [view, setView] = useState<TitleView>('menu');

  const playAsGuest = async () => {
    await enterGuest();
    router.replace('/(app)/(tabs)/home');
  };

  const onSignedIn = () => {
    void leaveGuest();
    router.replace('/(app)/(tabs)/home');
  };

  return (
    <View className="flex-1 bg-background">
      <MenuBackdrop dim={view === 'menu' ? 0.3 : 0.55} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView className="flex-1">
          <ScrollView
            contentContainerClassName="flex-grow justify-between px-6 py-8"
            keyboardShouldPersistTaps="handled"
            bounces={false}>
            <Animated.View entering={FadeIn.duration(600)} className="mt-6 items-center">
              <GameLogo size={view === 'menu' ? 'lg' : 'md'} tagline={view === 'menu'} />
            </Animated.View>

            {view === 'menu' ? (
              <Animated.View
                key="menu"
                entering={FadeInDown.duration(400).delay(150)}
                className="mt-10 w-full max-w-[420px] self-center">
                <GameButton
                  variant="hero"
                  size="lg"
                  label="Jouer en invité"
                  sublabel="Sans compte, ta partie reste sur ce téléphone"
                  onPress={playAsGuest}
                />
                <GameButton
                  variant="ally"
                  label="S'inscrire"
                  sublabel="Sauvegarde ta progression et tes éclats"
                  className="mt-3"
                  onPress={() => setView('signup')}
                />
                <GameButton
                  variant="panel"
                  label="Se connecter"
                  sublabel="J'ai déjà un compte"
                  className="mt-3"
                  onPress={() => setView('signin')}
                />
                <Text className="mt-6 text-center font-sans text-[12px] text-muted-foreground">
                  v{SiteConfig.version}
                </Text>
              </Animated.View>
            ) : (
              <Animated.View
                key={view}
                entering={FadeInDown.duration(300)}
                className="mt-8 w-full max-w-[420px] self-center">
                <GamePanel className="p-5">
                  <Text className="mb-1 font-pixel-bold text-[20px] uppercase tracking-[2px] text-foreground">
                    {view === 'signup' ? "S'inscrire" : 'Se connecter'}
                  </Text>
                  <Text className="mb-4 font-sans text-[15px] text-muted-foreground">
                    {view === 'signup'
                      ? 'Un compte garde ta progression sur tous tes appareils.'
                      : 'Content de te revoir, commandant.'}
                  </Text>
                  <SignInForm mode={view} onSuccess={onSignedIn} />
                </GamePanel>
                <Pressable
                  onPress={() => setView('menu')}
                  className="mt-3 h-[48px] items-center justify-center active:opacity-70">
                  <Text className="font-pixel-bold text-[16px] uppercase tracking-[2px] text-muted-foreground">
                    Retour
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
