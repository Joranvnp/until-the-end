"use node";

import { createHash } from "node:crypto";
import { v } from "convex/values";
import { authAction } from "../functions";
import { internal } from "../_generated/api";
import { SiteConfig } from "../siteConfig";

function decodeJWSPayload(jws: string): Record<string, unknown> {
  const parts = jws.split(".");
  if (parts.length !== 3) {
    throw new Error(
      `Invalid JWS format: expected 3 parts, got ${parts.length}`,
    );
  }
  const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
  return JSON.parse(payload) as Record<string, unknown>;
}

function hashPurchaseToken(purchaseToken: string) {
  return createHash("sha256").update(purchaseToken).digest("hex");
}

function expectedProductId(platform: "ios" | "android") {
  return platform === "ios"
    ? SiteConfig.payment.productIds.apple
    : SiteConfig.payment.productIds.google;
}

export const validatePurchase = authAction({
  args: {
    platform: v.union(v.literal("ios"), v.literal("android")),
    productId: v.string(),
    purchaseToken: v.string(),
    transactionId: v.string(),
    packageName: v.optional(v.string()),
    purchaseState: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    valid: boolean;
    transactionId: string;
    productId: string;
    environment: string | undefined;
    active: boolean;
  }> => {
    const configuredProductId = expectedProductId(args.platform);
    if (args.productId !== configuredProductId) {
      throw new Error(
        `Product ID mismatch: expected ${configuredProductId}, got ${args.productId}`,
      );
    }

    if (!args.purchaseToken) {
      throw new Error("No purchase token provided by client");
    }

    let providerEnvironment: string | undefined;
    let normalizedTransactionId = args.transactionId;

    if (args.platform === "ios") {
      // expo-iap exposes StoreKit 2's JWS representation as purchaseToken.
      const payload = decodeJWSPayload(args.purchaseToken);

      const payloadProductId = String(payload.productId ?? "");
      const payloadBundleId = String(payload.bundleId ?? "");
      const payloadEnvironment = String(payload.environment ?? "");
      const payloadTransactionId = String(
        payload.transactionId ?? payload.originalTransactionId ?? "",
      );

      if (payloadProductId !== configuredProductId) {
        throw new Error(
          `Product ID mismatch: expected ${configuredProductId}, got ${payloadProductId}`,
        );
      }

      if (payloadBundleId !== SiteConfig.bundleId) {
        throw new Error(
          `Bundle ID mismatch: expected ${SiteConfig.bundleId}, got ${payloadBundleId}`,
        );
      }

      if (payloadTransactionId !== args.transactionId) {
        throw new Error(
          `Transaction ID mismatch: expected ${args.transactionId}, got ${payloadTransactionId}`,
        );
      }

      providerEnvironment = payloadEnvironment;
      normalizedTransactionId =
        payloadEnvironment === "Xcode"
          ? `xcode_${payloadTransactionId}`
          : payloadTransactionId;
    }

    if (args.platform === "android") {
      if (args.packageName && args.packageName !== SiteConfig.androidPackage) {
        throw new Error(
          `Package mismatch: expected ${SiteConfig.androidPackage}, got ${args.packageName}`,
        );
      }

      if (args.purchaseState && args.purchaseState !== "purchased") {
        throw new Error(`Purchase is not complete: ${args.purchaseState}`);
      }

      providerEnvironment = "google_play";
    }

    const result: { active: boolean } = await ctx.runMutation(
      internal.payments.entitlements.internalGrant,
      {
        identity: {
          tokenIdentifier: ctx.identity.tokenIdentifier,
          email: ctx.identity.email ?? undefined,
          authId: ctx.identity.subject ?? undefined,
          name: ctx.identity.name ?? undefined,
        },
        source: args.platform === "ios" ? "apple_iap" : "google_play",
        status: "active",
        productId: args.productId,
        transactionId: normalizedTransactionId,
        purchaseTokenHash: hashPurchaseToken(args.purchaseToken),
        providerEnvironment,
      },
    );

    return {
      valid: true,
      transactionId: normalizedTransactionId,
      productId: args.productId,
      environment: providerEnvironment,
      active: result.active,
    };
  },
});
