import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { usePostHog } from 'posthog-react-native';
import { api } from '@convex/_generated/api';
import { useAuth } from '@/lib/auth-store';
import { getErrorCode } from '@/lib/error-utils';
import { isStoreProvider, usePurchaseFlows } from '@/lib/purchase';

const IS_DEV = __DEV__;

export function usePlan() {
  const router = useRouter();
  const posthog = usePostHog();
  const { isAuthenticated } = useAuth();
  const { purchaseViaStore, purchaseViaStripe } = usePurchaseFlows('account_plan');
  const grantDev = useMutation(api.payments.entitlements.grantDev);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const entitlement = useQuery(api.payments.entitlements.getMine, isAuthenticated ? {} : 'skip');

  const planLabel =
    entitlement === undefined
      ? 'Vérification…'
      : entitlement.active
        ? 'Jeu complet'
        : 'Version gratuite';
  const canOpenPlan = entitlement !== undefined && !entitlement.active;

  const openSheet = () => {
    if (!canOpenPlan) return;

    posthog.capture('account_plan_pressed');
    setSheetOpen(true);
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
        Alert.alert('Erreur', 'L’achat a échoué. Réessaie.');
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
