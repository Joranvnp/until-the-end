import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useAuth } from '@/lib/auth-store';
import { getErrorCode } from '@/lib/error-utils';
import { isStoreProvider, usePurchaseFlows } from '@/lib/purchase';
import { useStoreDemoMode } from '@/lib/store-demo';

const IS_DEV = __DEV__;

export function usePaywallPurchase() {
  const router = useRouter();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const isStoreDemo = useStoreDemoMode();
  const posthog = usePostHog();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const { purchaseViaStore, purchaseViaStripe } = usePurchaseFlows('paywall');
  const grantDev = useMutation(api.payments.entitlements.grantDev);
  const isStorePreview = preview === '1' || isStoreDemo;
  const shouldSkipDevPaywall = IS_DEV && isAuthenticated && !isStorePreview;

  useEffect(() => {
    if (shouldSkipDevPaywall) {
      router.replace('/(app)/(tabs)/home');
    }
  }, [router, shouldSkipDevPaywall]);

  const navigateToApp = () => {
    router.replace('/(app)/(tabs)/home');
  };

  const closePaywall = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(isAuthenticated ? '/(app)/(tabs)/home' : '/onboarding');
  };

  const handleDevPurchase = async () => {
    posthog.capture('paywall_dev_purchase');
    await grantDev({});
    navigateToApp();
  };

  const handleStripePurchase = async () => {
    setLoading(true);
    try {
      const paid = await purchaseViaStripe();
      if (paid) navigateToApp();
    } catch {
      Alert.alert('Erreur', 'Le paiement a échoué. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  const handleStorePurchase = async () => {
    setLoading(true);
    try {
      await purchaseViaStore();
      navigateToApp();
    } catch (e: unknown) {
      if (getErrorCode(e) !== 'E_USER_CANCELLED') {
        Alert.alert('Erreur', 'L’achat a échoué. Réessaie.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = () => {
    if (!isAuthenticated) {
      router.replace('/onboarding');
      return;
    }
    if (IS_DEV && !isStorePreview) {
      handleDevPurchase();
      return;
    }
    if (isStoreProvider) {
      handleStorePurchase();
    } else {
      handleStripePurchase();
    }
  };

  return {
    loading,
    shouldSkipDevPaywall,
    isDevPurchase: IS_DEV && !isStorePreview,
    closePaywall,
    handlePurchase,
  };
}
