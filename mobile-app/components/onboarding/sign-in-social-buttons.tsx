import { Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SiteConfig } from '@site-config';
import { Text } from '@/components/ui/text';
import { Banner } from '@/components/ui/banner';
import { useAuthProviders } from '@/lib/auth-providers';
import { useTheme } from '@/lib/theme-store';
import { useSocialSignIn } from '@/components/onboarding/use-social-sign-in';
import type { SignInMethod } from '@/components/onboarding/use-sign-in-flow';

function ProviderLoadingSlots({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} className="mb-3 h-[52px] w-full rounded-none bg-muted opacity-60" />
      ))}
    </>
  );
}

export function SignInSocialButtons({
  loading,
  setLoading,
  onSignedIn,
  onEmailPress,
}: {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onSignedIn: (method: SignInMethod) => void;
  onEmailPress: () => void;
}) {
  const { providers, isLoading: providersLoading } = useAuthProviders();
  const { colors } = useTheme();
  const { signInWithApple, signInWithGoogle, signInWithGithub } = useSocialSignIn({
    setLoading,
    onSignedIn,
  });
  const isExpoGoPreview = process.env.EXPO_PUBLIC_NOWSTACK_EXPO_GO === '1';
  const supportsSocialAuth = !isExpoGoPreview;

  const showAppleProvider =
    supportsSocialAuth &&
    SiteConfig.features.enableAppleSignIn &&
    Platform.OS === 'ios' &&
    providers?.apple;
  const showGithubProvider =
    supportsSocialAuth && SiteConfig.features.enableGitHubSignIn && providers?.github;
  const showGoogleProvider =
    supportsSocialAuth && SiteConfig.features.enableGoogleSignIn && providers?.google;
  const providerLoadingSlotCount =
    Number(supportsSocialAuth && Platform.OS === 'ios' && SiteConfig.features.enableAppleSignIn) +
    Number(supportsSocialAuth && SiteConfig.features.enableGitHubSignIn) +
    Number(supportsSocialAuth && SiteConfig.features.enableGoogleSignIn);
  const showProviderLoadingSlots = providersLoading && providerLoadingSlotCount > 0;

  return (
    <>
      {isExpoGoPreview && (
        <Banner
          className="mb-3"
          variant="warning"
          title="Aperçu Expo Go"
          description="La connexion par e-mail marche ici. Apple, GitHub et les achats demandent un build de développement."
        />
      )}

      {showProviderLoadingSlots && <ProviderLoadingSlots count={providerLoadingSlotCount} />}

      {showAppleProvider && (
        <Pressable
          onPress={signInWithApple}
          disabled={loading}
          className="mb-3 h-[52px] w-full flex-row items-center justify-center rounded-none bg-black active:opacity-80">
          <Ionicons name="logo-apple" size={20} color="white" />
          <Text className="ml-2 font-pixel-bold text-[16px] text-white">Continuer avec Apple</Text>
        </Pressable>
      )}

      {showGithubProvider && (
        <Pressable
          onPress={signInWithGithub}
          disabled={loading}
          className="mb-3 h-[52px] w-full flex-row items-center justify-center rounded-none bg-black active:opacity-80">
          <Ionicons name="logo-github" size={20} color="white" />
          <Text className="ml-2 font-pixel-bold text-[16px] text-white">Continuer avec GitHub</Text>
        </Pressable>
      )}

      {showGoogleProvider && (
        <Pressable
          onPress={signInWithGoogle}
          disabled={loading}
          className="mb-3 h-[52px] w-full flex-row items-center justify-center rounded-none bg-muted active:opacity-80">
          <Text className="font-pixel-bold text-[16px] text-foreground">G</Text>
          <Text className="ml-2 font-pixel-bold text-[16px] text-foreground">
            Continuer avec Google
          </Text>
        </Pressable>
      )}

      <Pressable
        onPress={onEmailPress}
        disabled={loading}
        className="h-[52px] w-full flex-row items-center justify-center border-2 border-primary bg-hero active:opacity-80">
        <Ionicons name="mail-outline" size={20} color={colors.primary} />
        <Text className="ml-2 font-pixel-bold text-[16px] uppercase tracking-[1px] text-primary">
          Continuer avec un e-mail
        </Text>
      </Pressable>
    </>
  );
}
