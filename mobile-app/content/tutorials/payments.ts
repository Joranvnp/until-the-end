import type { Tutorial } from './tutorials';

const PLATFORM_SNIPPET = `// app/(flow)/paywall.tsx
if (__DEV__) {
  // Dev mode: grant a local Convex entitlement
  await grantDev({});
} else if (currentPaymentProvider === "apple_iap" || currentPaymentProvider === "google_play") {
  // Store builds: use native store billing for digital goods
  await handleStorePurchase();
} else {
  // Web or external Android distribution: Stripe PaymentSheet
  await handleStripePurchase();
}`;

const IAP_SNIPPET = `// lib/iap.ts - useStoreIAP() hook
const iap = useStoreIAP();

await iap.purchase(async (purchase) => {
  await validatePurchase({
    platform: Platform.OS === "android" ? "android" : "ios",
    productId: purchase.productId,
    purchaseToken: purchase.purchaseToken,
    transactionId: purchase.transactionId ?? purchase.id,
  });
  await iap.finishCurrentTransaction(purchase);
  navigateToApp();
});`;

const STRIPE_SNIPPET = `// Stripe flow (web / external Android)
const sheet = await createPaymentSheet({});
await initPaymentSheet({
  customerId: sheet.customer,
  customerEphemeralKeySecret: sheet.ephemeralKey,
  paymentIntentClientSecret: sheet.paymentIntent,
});
await presentPaymentSheet();
await confirmPayment({ paymentIntentId: sheet.paymentIntentId });`;

export const paymentsTutorial: Tutorial = {
  slug: 'payments',
  title: 'How Payments Work',
  description: 'iOS IAP + Android Stripe',
  sections: [
    {
      title: 'Platform detection',
      body: 'Store-distributed digital goods use native store billing. Stripe stays available for web and external Android distribution. Dev mode grants the same Convex entitlement without a charge.',
      code: { title: 'paywall.tsx', snippet: PLATFORM_SNIPPET },
    },
    {
      title: 'Store IAP flow',
      body: 'expo-iap handles StoreKit and Google Play Billing. The useStoreIAP() hook wraps purchase and receipt handling, then Convex grants the shared entitlement.',
      code: { title: 'paywall.tsx', snippet: IAP_SNIPPET },
    },
    {
      title: 'Stripe flow',
      body: 'Convex creates a PaymentIntent server-side, the client presents the Stripe Payment Sheet, then Convex grants the same entitlement after the intent succeeds.',
      code: { title: 'paywall.tsx', snippet: STRIPE_SNIPPET },
    },
    {
      title: 'Price config',
      body: 'Price, provider, product IDs, and entitlement key live in site-config.ts. Update the config once, then sync App Store Connect, Google Play Console, Stripe, and Convex env to match.',
    },
  ],
};
