import { Alert, Platform } from 'react-native';
import { useAction } from 'convex/react';
import { usePostHog } from 'posthog-react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { api } from '@convex/_generated/api';
import { SiteConfig } from '@site-config';
import { useAuth } from '@/lib/auth-store';
import { useStoreIAP } from '@/lib/iap';
import { getPackageName } from '@/lib/error-utils';

const currentPaymentProvider =
  Platform.OS === 'ios'
    ? SiteConfig.payment.providers.ios
    : Platform.OS === 'android'
      ? SiteConfig.payment.providers.android
      : SiteConfig.payment.providers.web;

export const isStoreProvider =
  currentPaymentProvider === 'apple_iap' || currentPaymentProvider === 'google_play';

/**
 * Achat du jeu complet, partagé par le paywall et la fiche « Offre » du compte.
 * `eventPrefix` distingue les deux écrans dans PostHog (`paywall`, `account_plan`).
 */
export function usePurchaseFlows(eventPrefix: string) {
  const posthog = usePostHog();
  const { email } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const iap = useStoreIAP();
  const validatePurchase = useAction(api.payments.iap.validatePurchase);
  const createPaymentSheet = useAction(api.payments.stripe.createPaymentSheet);
  const confirmPayment = useAction(api.payments.stripe.confirmPayment);

  /** Résout une fois le reçu validé par Convex et la transaction terminée. */
  const purchaseViaStore = async () => {
    posthog.capture(`${eventPrefix}_iap_started`);
    await iap.purchase(async (storePurchase) => {
      const purchaseToken = storePurchase.purchaseToken;
      const transactionId = storePurchase.transactionId ?? storePurchase.id;
      if (!purchaseToken || !transactionId) {
        throw new Error('Le reçu de l’achat est introuvable.');
      }

      await validatePurchase({
        platform: Platform.OS === 'android' ? 'android' : 'ios',
        productId: storePurchase.productId,
        purchaseToken,
        transactionId,
        packageName:
          Platform.OS === 'android'
            ? getPackageName(storePurchase, SiteConfig.androidPackage ?? SiteConfig.bundleId)
            : undefined,
        purchaseState: storePurchase.purchaseState,
      });
      await iap.finishCurrentTransaction(storePurchase);
      posthog.capture(`${eventPrefix}_iap_success`);
    });
  };

  /** Renvoie `true` seulement si le paiement est confirmé côté serveur. */
  const purchaseViaStripe = async () => {
    posthog.capture(`${eventPrefix}_stripe_started`);
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
      return false;
    }

    const presented = await presentPaymentSheet();
    if (presented.error) {
      Alert.alert('Erreur', presented.error.message);
      return false;
    }

    const confirmation = await confirmPayment({ paymentIntentId: sheet.paymentIntentId });
    if (!confirmation.paid) {
      Alert.alert('Paiement en attente', 'Ton paiement n’est pas encore terminé.');
      return false;
    }

    posthog.capture(`${eventPrefix}_stripe_success`);
    return true;
  };

  return { purchaseViaStore, purchaseViaStripe };
}
