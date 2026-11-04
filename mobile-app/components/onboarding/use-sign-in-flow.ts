import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '@/lib/auth-store';
import { safeCapture } from '@/lib/posthog';

export type SignInView = 'main' | 'email' | 'otp';
export type SignInMethod = 'email_otp' | 'apple' | 'github' | 'google';

export function useSignInFlow(onSuccess?: () => void) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<SignInView>('main');
  const [loading, setLoading] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(false);
  const signInMethod = useRef<SignInMethod>('email_otp');
  const signInEmail = useRef('');

  const formOpacity = useSharedValue(1);
  const formTranslateX = useSharedValue(0);

  const animateViewChange = useCallback(
    (nextView: SignInView) => {
      formOpacity.value = withTiming(0, {
        duration: 100,
        easing: Easing.in(Easing.quad),
      });
      formTranslateX.value = withTiming(-16, {
        duration: 100,
        easing: Easing.in(Easing.quad),
      });
      setTimeout(() => {
        setView(nextView);
        formTranslateX.value = 16;
        formOpacity.value = withTiming(1, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        });
        formTranslateX.value = withSpring(0, {
          damping: 22,
          stiffness: 220,
          mass: 0.7,
        });
      }, 110);
    },
    [formOpacity, formTranslateX]
  );

  const formAnimStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateX: formTranslateX.value }],
  }));

  useEffect(() => {
    if (waitingForAuth && isAuthenticated) {
      // Reset before navigating so this effect cannot re-fire on re-render
      // (onSuccess is often a new function identity on every parent render).
      setWaitingForAuth(false);
      setLoading(false);
      safeCapture('user_signed_in', { method: signInMethod.current });
      if (signInMethod.current === 'email_otp') {
        safeCapture('user_identified', { email: signInEmail.current });
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.replace('/(app)/(tabs)/home');
      }
    }
  }, [waitingForAuth, isAuthenticated, router, onSuccess]);

  useEffect(() => {
    if (!waitingForAuth) return;
    const timeout = setTimeout(() => {
      setWaitingForAuth(false);
      setLoading(false);
      Alert.alert('Oups', 'La connexion a pris trop de temps. Réessaie.');
    }, 15000);
    return () => clearTimeout(timeout);
  }, [waitingForAuth]);

  const startWaiting = useCallback((method: SignInMethod, email?: string) => {
    signInMethod.current = method;
    if (email !== undefined) signInEmail.current = email;
    setWaitingForAuth(true);
  }, []);

  return {
    view,
    animateViewChange,
    formAnimStyle,
    loading,
    setLoading,
    waitingForAuth,
    startWaiting,
  };
}
