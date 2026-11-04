"use node";

import Stripe from "stripe";
import { v } from "convex/values";
import { authAction } from "../functions";
import { internal } from "../_generated/api";
import { SiteConfig } from "../siteConfig";

const returnTarget = v.union(v.literal("app"), v.literal("accountPlan"));

const returnPaths = {
  app: "/app",
  accountPlan: "/account/plan",
} as const;

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY in Convex environment");
  }
  return new Stripe(secretKey);
}

const localWebOrigins = (ports: number[]) =>
  ports.flatMap((port) => [
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
  ]);

function trustedWebOrigins() {
  const origins = [
    ...SiteConfig.auth.trustedOrigins,
    process.env.SITE_URL,
    ...localWebOrigins([3000, 3001, 3002, 3100, 3101, 3102, 3103, 5174]),
  ].filter((origin): origin is string => Boolean(origin));

  return new Set(
    origins.flatMap((origin) => {
      try {
        const url = new URL(origin);
        return url.protocol === "http:" || url.protocol === "https:"
          ? [url.origin]
          : [];
      } catch {
        return [];
      }
    }),
  );
}

function buildReturnUrl(
  origin: string,
  target: "app" | "accountPlan" | undefined,
  fallback: "app" | "accountPlan",
) {
  const originUrl = new URL(origin);
  if (!trustedWebOrigins().has(originUrl.origin)) {
    throw new Error("Origin is not trusted for Stripe redirects.");
  }

  return new URL(returnPaths[target ?? fallback], originUrl);
}

function assertExpectedPaymentMetadata(
  metadata: Stripe.Metadata | null | undefined,
  tokenIdentifier: string,
) {
  if (
    metadata?.app !== SiteConfig.slug ||
    metadata.product !== SiteConfig.payment.productIds.stripe ||
    metadata.entitlementKey !== SiteConfig.payment.entitlementKey ||
    metadata.tokenIdentifier !== tokenIdentifier
  ) {
    throw new Error("Stripe payment metadata does not match this account.");
  }
}

export const createPaymentSheet = authAction({
  args: { email: v.optional(v.string()) },
  handler: async (ctx, { email }) => {
    const stripe = getStripe();
    const customerEmail = email ?? ctx.identity.email ?? undefined;

    const customer = await stripe.customers.create({
      email: customerEmail,
      metadata: {
        app: SiteConfig.slug,
        tokenIdentifier: ctx.identity.tokenIdentifier,
      },
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2025-03-31.basil" },
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: SiteConfig.payment.priceAmount,
      currency: SiteConfig.payment.currency,
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      setup_future_usage: "off_session",
      metadata: {
        app: SiteConfig.slug,
        product: SiteConfig.payment.productIds.stripe,
        entitlementKey: SiteConfig.payment.entitlementKey,
        priceId: process.env[SiteConfig.payment.stripe.priceEnvVar] ?? "",
        tokenIdentifier: ctx.identity.tokenIdentifier,
      },
    });

    return {
      paymentIntent: paymentIntent.client_secret!,
      ephemeralKey: ephemeralKey.secret!,
      customer: customer.id,
      paymentIntentId: paymentIntent.id,
      publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    };
  },
});

export const confirmPayment = authAction({
  args: { paymentIntentId: v.string() },
  handler: async (ctx, { paymentIntentId }) => {
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    const paid = pi.status === "succeeded";

    if (paid) {
      assertExpectedPaymentMetadata(pi.metadata, ctx.identity.tokenIdentifier);

      await ctx.runMutation(internal.payments.entitlements.internalGrant, {
        identity: {
          tokenIdentifier: ctx.identity.tokenIdentifier,
          email: ctx.identity.email ?? undefined,
          authId: ctx.identity.subject ?? undefined,
          name: ctx.identity.name ?? undefined,
        },
        source: "stripe",
        status: "active",
        productId: SiteConfig.payment.productIds.stripe,
        transactionId: paymentIntentId,
        stripeCustomerId:
          typeof pi.customer === "string" ? pi.customer : pi.customer?.id,
        stripePaymentIntentId: paymentIntentId,
        providerEnvironment: pi.livemode ? "live" : "test",
      });
    }

    return { status: pi.status, paid };
  },
});

export const createCheckout = createPaymentSheet;

export const createCheckoutSession = authAction({
  args: { origin: v.string(), returnTarget: v.optional(returnTarget) },
  handler: async (ctx, { origin, returnTarget }) => {
    const stripe = getStripe();
    const successUrl = buildReturnUrl(origin, returnTarget, "app");
    successUrl.searchParams.set("checkout_session_id", "{CHECKOUT_SESSION_ID}");
    const cancelUrl = buildReturnUrl(origin, returnTarget, "app");

    const priceId = process.env[SiteConfig.payment.stripe.priceEnvVar];
    const lineItem = priceId
      ? { price: priceId, quantity: 1 }
      : {
          price_data: {
            currency: SiteConfig.payment.currency,
            unit_amount: SiteConfig.payment.priceAmount,
            product_data: {
              name: `${SiteConfig.title} Lifetime Access`,
            },
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: ctx.identity.email ?? undefined,
      customer_creation: "always",
      line_items: [lineItem],
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      metadata: {
        app: SiteConfig.slug,
        product: SiteConfig.payment.productIds.stripe,
        entitlementKey: SiteConfig.payment.entitlementKey,
        tokenIdentifier: ctx.identity.tokenIdentifier,
      },
      payment_intent_data: {
        metadata: {
          app: SiteConfig.slug,
          product: SiteConfig.payment.productIds.stripe,
          entitlementKey: SiteConfig.payment.entitlementKey,
          tokenIdentifier: ctx.identity.tokenIdentifier,
        },
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    return { url: session.url, sessionId: session.id };
  },
});

export const createBillingPortal = authAction({
  args: { origin: v.string(), returnTarget: v.optional(returnTarget) },
  handler: async (ctx, { origin, returnTarget }) => {
    const customerId: string | null = await ctx.runQuery(
      internal.payments.entitlements.internalGetStripeCustomerId,
      { tokenIdentifier: ctx.identity.tokenIdentifier },
    );

    if (!customerId) {
      throw new Error("No Stripe customer is linked to this account.");
    }

    const stripe = getStripe();
    const returnUrl = buildReturnUrl(origin, returnTarget, "accountPlan");
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl.toString(),
    });

    if (!portal.url) {
      throw new Error("Stripe did not return a billing portal URL.");
    }

    return { url: portal.url };
  },
});

export const confirmCheckoutSession = authAction({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";

    if (paid) {
      assertExpectedPaymentMetadata(
        session.metadata,
        ctx.identity.tokenIdentifier,
      );

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      const stripeCustomerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;

      if (!stripeCustomerId) {
        throw new Error("Stripe checkout did not return a customer.");
      }

      await ctx.runMutation(internal.payments.entitlements.internalGrant, {
        identity: {
          tokenIdentifier: ctx.identity.tokenIdentifier,
          email: ctx.identity.email ?? undefined,
          authId: ctx.identity.subject ?? undefined,
          name: ctx.identity.name ?? undefined,
        },
        source: "stripe",
        status: "active",
        productId: SiteConfig.payment.productIds.stripe,
        transactionId: paymentIntentId ?? session.id,
        stripeCustomerId,
        stripePaymentIntentId: paymentIntentId,
        providerEnvironment: session.livemode ? "live" : "test",
      });
    }

    return { paid, paymentStatus: session.payment_status };
  },
});
