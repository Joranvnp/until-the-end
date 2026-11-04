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
        Alert.alert('Error', 'Could not get Apple credentials.');
        return;
      }

      const { error } = await authClient.signIn.social({
        provider: 'apple',
        idToken: { token: credential.identityToken },
      });

      if (error) {
        Alert.alert('Error', error.message ?? 'Apple sign-in failed.');
        return;
      }

      onSignedIn('apple');
    } catch (e: unknown) {
      if (getErrorCode(e) !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Error', 'Apple sign-in failed. Please try again.');
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
        'Error',
        e instanceof Error ? e.message : 'Google sign-in failed. Please try again.'
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
        'Error',
        e instanceof Error ? e.message : 'GitHub sign-in failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return { signInWithApple, signInWithGoogle, signInWithGithub };
}
