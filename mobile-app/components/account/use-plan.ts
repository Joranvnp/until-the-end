import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAction, useMutation, useQuery } from 'convex/react';
import { usePostHog } from 'posthog-react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { api } from '@convex/_generated/api';
import { SiteConfig } from '@site-config';
import { useAuth } from '@/lib/auth-store';
import { useStoreIAP } from '@/lib/iap';
import { getErrorCode, getPackageName } from '@/lib/error-utils';

const IS_DEV = __DEV__;
const currentPaymentProvider =
  Platform.OS === 'ios'
    ? SiteConfig.payment.providers.ios
    : Platform.OS === 'android'
      ? SiteConfig.payment.providers.android
      : SiteConfig.payment.providers.web;
const isStoreProvider =
  currentPaymentProvider === 'apple_iap' || currentPaymentProvider === 'google_play';

export function usePlan() {
  const router = useRouter();
  const posthog = usePostHog();
  const { email, isAuthenticated } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const iap = useStoreIAP();
  const grantDev = useMutation(api.payments.entitlements.grantDev);
  const validatePurchase = useAction(api.payments.iap.validatePurchase);
  const createPaymentSheet = useAction(api.payments.stripe.createPaymentSheet);
  const confirmPayment = useAction(api.payments.stripe.confirmPayment);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const entitlement = useQuery(api.payments.entitlements.getMine, isAuthenticated ? {} : 'skip');

  const planLabel =
    entitlement === undefined
      ? 'Checking...'
      : entitlement.active
        ? 'Lifetime access'
        : 'No active plan';
  const canOpenPlan = entitlement !== undefined && !entitlement.active;

  const openSheet = () => {
    if (!canOpenPlan) return;

    posthog.capture('account_plan_pressed');
    setSheetOpen(true);
  };

  const purchaseViaStore = async () => {
    posthog.capture('account_plan_iap_started');
    await iap.purchase(async (storePurchase) => {
      const purchaseToken = storePurchase.purchaseToken;
      const transactionId = storePurchase.transactionId ?? storePurchase.id;
      if (!purchaseToken || !transactionId) {
        throw new Error('Store purchase is missing receipt data.');
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
      posthog.capture('account_plan_iap_success');
    });
  };

  const purchaseViaStripe = async () => {
    posthog.capture('account_plan_stripe_started');
    const sheet = await createPaymentSheet({ email: email ?? undefined });
    const init = await initPaymentSheet({
      merchantDisplayName: SiteConfig.company.name,
      customerId: sheet.customer,
      customerEphemeralKeySecret: sheet.ephemeralKey,
      paymentIntentClientSecret: sheet.paymentIntent,
      allowsDelayedPaymentMethods: false,
    });

    if (init.error) {
      Alert.alert('Error', init.error.message);
      return false;
    }

    const presented = await presentPaymentSheet();
    if (presented.error) {
      Alert.alert('Error', presented.error.message);
      return false;
    }

    const confirmation = await confirmPayment({
      paymentIntentId: sheet.paymentIntentId,
    });
    if (!confirmation.paid) {
      Alert.alert('Payment pending', 'Your payment is not complete yet.');
      return false;
    }

    posthog.capture('account_plan_stripe_success');
    return true;
  };

  const purchase = async () => {
    if (loading) return;
    if (!isAuthenticated) {
      setSheetOpen(false);
      router.replace('/onboarding');
      return;
    }

    setLoading(true);
    try {
      if (IS_DEV) {
        posthog.capture('account_plan_dev_purchase');
        await grantDev({});
        setSheetOpen(false);
        return;
      }

      if (isStoreProvider) {
        await purchaseViaStore();
        setSheetOpen(false);
        return;
      }

      const paid = await purchaseViaStripe();
      if (paid) setSheetOpen(false);
    } catch (purchaseError) {
      if (getErrorCode(purchaseError) !== 'E_USER_CANCELLED') {
        Alert.alert('Error', 'Purchase failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    planLabel,
    canOpenPlan,
    sheetOpen,
    loading,
    openSheet,
    closeSheet: () => setSheetOpen(false),
    purchase,
  };
}
