import { Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { SiteConfig } from '@site-config';
import { authClient } from '@/lib/auth-client';
import { getErrorCode } from '@/lib/error-utils';
import { safeCapture } from '@/lib/posthog';
import type { SignInMethod } from '@/components/onboarding/use-sign-in-flow';

type SocialSignInOptions = {
  setLoading: (loading: boolean) => void;
  onSignedIn: (method: SignInMethod) => void;
};

export function useSocialSignIn({ setLoading, onSignedIn }: SocialSignInOptions) {
  const signInWithApple = async () => {
    safeCapture('apple_sign_in_started');
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert('Erreur', 'Impossible de récupérer les identifiants Apple.');
        return;
      }

      const { error } = await authClient.signIn.social({
        provider: 'apple',
        idToken: { token: credential.identityToken },
      });

      if (error) {
        Alert.alert('Erreur', error.message ?? 'La connexion avec Apple a échoué.');
        return;
      }

      onSignedIn('apple');
    } catch (e: unknown) {
      if (getErrorCode(e) !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Erreur', 'La connexion avec Apple a échoué. Réessaie.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    safeCapture('google_sign_in_started');
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: `${SiteConfig.slug}://`,
      });

      onSignedIn('google');
    } catch (e: unknown) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : 'La connexion avec Google a échoué. Réessaie.'
      );
    } finally {
      setLoading(false);
    }
  };

  const signInWithGithub = async () => {
    safeCapture('github_sign_in_started');
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: `${SiteConfig.slug}://`,
      });

      onSignedIn('github');
    } catch (e: unknown) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : 'La connexion avec GitHub a échoué. Réessaie.'
      );
    } finally {
      setLoading(false);
    }
  };

  return { signInWithApple, signInWithGoogle, signInWithGithub };
}
