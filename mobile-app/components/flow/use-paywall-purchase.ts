import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { useAction, useMutation } from 'convex/react';
import { useStripe } from '@stripe/stripe-react-native';
import { api } from '@convex/_generated/api';
import { SiteConfig } from '@site-config';
import { useStoreIAP } from '@/lib/iap';
import { useAuth } from '@/lib/auth-store';
import { getErrorCode, getPackageName } from '@/lib/error-utils';
import { useStoreDemoMode } from '@/lib/store-demo';

const IS_DEV = __DEV__;
const currentPaymentProvider =
  Platform.OS === 'ios'
    ? SiteConfig.payment.providers.ios
    : Platform.OS === 'android'
      ? SiteConfig.payment.providers.android
      : SiteConfig.payment.providers.web;

export function usePaywallPurchase() {
  const router = useRouter();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const isStoreDemo = useStoreDemoMode();
  const posthog = usePostHog();
  const { email, isAuthenticated } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const iap = useStoreIAP();
  const grantDev = useMutation(api.payments.entitlements.grantDev);
  const validatePurchase = useAction(api.payments.iap.validatePurchase);
  const createPaymentSheet = useAction(api.payments.stripe.createPaymentSheet);
  const confirmPayment = useAction(api.payments.stripe.confirmPayment);
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
    posthog.capture('paywall_stripe_started');
    try {
      const sheet = await createPaymentSheet({ email: email ?? undefined });
      const init = await initPaymentSheet({
        merchantDisplayName: SiteConfig.company.name,
        customerId: sheet.customer,
        customerEphemeralKeySecret: sheet.ephemeralKey,
        paymentIntentClientSecret: sheet.paymentIntent,
        allowsDelayedPaymentMethods: false,
      });

      if (init.error) {
        Alert.alert('Erreur', init.error.message);
        return;
      }

      const presented = await presentPaymentSheet();
      if (presented.error) {
        Alert.alert('Erreur', presented.error.message);
        return;
      }

      const confirmation = await confirmPayment({
        paymentIntentId: sheet.paymentIntentId,
      });
      if (!confirmation.paid) {
        Alert.alert('Paiement en attente', 'Ton paiement n’est pas encore terminé.');
        return;
      }

      posthog.capture('paywall_stripe_success');
      navigateToApp();
    } catch {
      Alert.alert('Erreur', 'Le paiement a échoué. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  const handleStorePurchase = async () => {
    setLoading(true);
    posthog.capture('paywall_iap_started');
    try {
      await iap.purchase(async (purchase) => {
        const purchaseToken = purchase.purchaseToken;
        const transactionId = purchase.transactionId ?? purchase.id;
        if (!purchaseToken || !transactionId) {
          throw new Error('Le reçu de l’achat est introuvable.');
        }

        await validatePurchase({
          platform: Platform.OS === 'android' ? 'android' : 'ios',
          productId: purchase.productId,
          purchaseToken,
          transactionId,
          packageName:
            Platform.OS === 'android'
              ? getPackageName(purchase, SiteConfig.androidPackage ?? SiteConfig.bundleId)
              : undefined,
          purchaseState: purchase.purchaseState,
        });
        await iap.finishCurrentTransaction(purchase);
        posthog.capture('paywall_iap_success');
        navigateToApp();
      });
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
    if (currentPaymentProvider === 'apple_iap' || currentPaymentProvider === 'google_play') {
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
