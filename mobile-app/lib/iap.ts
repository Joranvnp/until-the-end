import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useIAP, type Purchase, type Product } from 'expo-iap';
import { SiteConfig } from '@site-config';

const IAP_PRODUCT_ID =
  Platform.OS === 'android'
    ? SiteConfig.payment.productIds.google
    : SiteConfig.payment.productIds.apple;

type IAPResult = {
  connected: boolean;
  product: Product | null;
  loading: boolean;
  purchase: (onReceipt: (purchase: Purchase) => Promise<void>) => Promise<void>;
  finishCurrentTransaction: (purchase: Purchase) => Promise<void>;
  error: string | null;
};

const NOOP_IAP: IAPResult = {
  connected: false,
  product: null,
  loading: false,
  purchase: async () => {
    throw new Error('Achats intégrés indisponibles sur cet appareil');
  },
  finishCurrentTransaction: async () => {},
  error: 'Achats intégrés indisponibles sur cet appareil',
};

const EXPO_GO_IAP: IAPResult = {
  ...NOOP_IAP,
  error: 'Les achats intégrés demandent une build de développement.',
  purchase: async () => {
    throw new Error(
      'Achats intégrés désactivés dans Expo Go. Utilise npm run ios ou npm run android.'
    );
  },
};

export function useStoreIAP(): IAPResult {
  const result = useStoreIAPInternal();

  if (process.env.EXPO_PUBLIC_NOWSTACK_EXPO_GO === '1') {
    return EXPO_GO_IAP;
  }

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return NOOP_IAP;
  }

  return result;
}

function useStoreIAPInternal(): IAPResult {
  const onReceiptRef = useRef<((purchase: Purchase) => Promise<void>) | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);
  const rejectRef = useRef<((error: Error) => void) | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { connected, products, fetchProducts, requestPurchase, finishTransaction } = useIAP({
    onPurchaseSuccess: (purchase) => {
      const handler = onReceiptRef.current;
      if (!handler) return;
      onReceiptRef.current = null;

      handler(purchase)
        .then(() => {
          resolveRef.current?.();
          resolveRef.current = null;
          rejectRef.current = null;
        })
        .catch((err: unknown) => {
          const e = err instanceof Error ? err : new Error(String(err));
          rejectRef.current?.(e);
          resolveRef.current = null;
          rejectRef.current = null;
        });
    },
    onPurchaseError: (purchaseError) => {
      onReceiptRef.current = null;
      setError(purchaseError.message);

      if (rejectRef.current) {
        rejectRef.current(
          Object.assign(new Error(purchaseError.message), {
            code: purchaseError.code,
          })
        );
        resolveRef.current = null;
        rejectRef.current = null;
      }
    },
  });

  useEffect(() => {
    if (connected) {
      fetchProducts({ skus: [IAP_PRODUCT_ID], type: 'inapp' });
    }
  }, [connected, fetchProducts]);

  const product = products.find((p) => p.id === IAP_PRODUCT_ID) ?? null;

  const purchase = useCallback(
    (onReceipt: (purchase: Purchase) => Promise<void>): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        onReceiptRef.current = onReceipt;
        resolveRef.current = resolve;
        rejectRef.current = reject;

        requestPurchase({
          request: {
            apple: { sku: IAP_PRODUCT_ID, quantity: 1 },
            google: { skus: [IAP_PRODUCT_ID] },
          },
          type: 'in-app',
        }).catch((err: unknown) => {
          if (!rejectRef.current) return;
          const rej = rejectRef.current;
          onReceiptRef.current = null;
          resolveRef.current = null;
          rejectRef.current = null;
          rej(err instanceof Error ? err : new Error(String(err)));
        });
      });
    },
    [requestPurchase]
  );

  const finishCurrentTransaction = useCallback(
    async (purchaseToFinish: Purchase) => {
      await finishTransaction({
        purchase: purchaseToFinish,
        isConsumable: false,
      });
    },
    [finishTransaction]
  );

  return {
    connected,
    product,
    loading: false,
    purchase,
    finishCurrentTransaction,
    error,
  };
}
