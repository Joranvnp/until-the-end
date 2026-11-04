import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { authMutation, authQuery } from "../functions";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { LumailTags } from "../emailTags";
import { SiteConfig } from "../siteConfig";
import { bumpCounter } from "../admin/metrics";

const entitlementStatus = v.union(
  v.literal("active"),
  v.literal("pending"),
  v.literal("revoked"),
  v.literal("refunded"),
);

const paymentSource = v.union(
  v.literal("apple_iap"),
  v.literal("google_play"),
  v.literal("stripe"),
  v.literal("dev"),
);

const identityArg = v.object({
  tokenIdentifier: v.string(),
  email: v.optional(v.string()),
  authId: v.optional(v.string()),
  name: v.optional(v.string()),
});

async function syncPaidLumailTags(
  ctx: Pick<MutationCtx, "db" | "scheduler">,
  userId: Id<"users">,
  previousStatus: "active" | "pending" | "revoked" | "refunded" | undefined,
  nextStatus: "active" | "pending" | "revoked" | "refunded",
) {
  const user = await ctx.db.get(userId);
  const email = user?.email?.trim();
  if (!email) return;

  if (nextStatus === "active") {
    await ctx.scheduler.runAfter(0, internal.email.upsertSubscriber, {
      email,
      name: user?.name,
      tags: [LumailTags.premium],
      removeTags: [LumailTags.churn],
    });
    return;
  }

  if (
    previousStatus === "active" &&
    (nextStatus === "revoked" || nextStatus === "refunded")
  ) {
    await ctx.scheduler.runAfter(0, internal.email.upsertSubscriber, {
      email,
      name: user?.name,
      tags: [LumailTags.churn],
      removeTags: [LumailTags.premium],
    });
  }
}

async function upsertEntitlement(
  ctx: Pick<MutationCtx, "db" | "scheduler">,
  args: {
    userId: Id<"users">;
    key: string;
    status: "active" | "pending" | "revoked" | "refunded";
    source: "apple_iap" | "google_play" | "stripe" | "dev";
    productId: string;
    transactionId?: string;
    purchaseTokenHash?: string;
    stripeCustomerId?: string;
    stripePaymentIntentId?: string;
    providerEnvironment?: string;
  },
) {
  const now = Date.now();

  if (args.transactionId) {
    const existingTransaction = await ctx.db
      .query("entitlements")
      .withIndex("by_source_transaction", (q) =>
        q.eq("source", args.source).eq("transactionId", args.transactionId),
      )
      .first();

    if (existingTransaction && existingTransaction.userId !== args.userId) {
      throw new Error("This purchase is already linked to another account.");
    }
  }

  if (args.purchaseTokenHash) {
    const existingToken = await ctx.db
      .query("entitlements")
      .withIndex("by_purchase_token_hash", (q) =>
        q.eq("purchaseTokenHash", args.purchaseTokenHash),
      )
      .first();

    if (existingToken && existingToken.userId !== args.userId) {
      throw new Error(
        "This purchase token is already linked to another account.",
      );
    }
  }

  const existing = await ctx.db
    .query("entitlements")
    .withIndex("by_user_key", (q) =>
      q.eq("userId", args.userId).eq("key", args.key),
    )
    .first();

  const patch = {
    status: args.status,
    source: args.source,
    productId: args.productId,
    transactionId: args.transactionId,
    purchaseTokenHash: args.purchaseTokenHash,
    stripeCustomerId: args.stripeCustomerId,
    stripePaymentIntentId: args.stripePaymentIntentId,
    providerEnvironment: args.providerEnvironment,
    grantedAt: args.status === "active" ? now : undefined,
    updatedAt: now,
  };

  if (existing) {
    await ctx.db.patch(existing._id, patch);
    await syncPaidLumailTags(ctx, args.userId, existing.status, args.status);
    return (await ctx.db.get(existing._id))!;
  }

  const entitlementId = await ctx.db.insert("entitlements", {
    userId: args.userId,
    key: args.key,
    createdAt: now,
    ...patch,
  });

  await syncPaidLumailTags(ctx, args.userId, undefined, args.status);
  return (await ctx.db.get(entitlementId))!;
}

export const getMine = authQuery({
  args: {},
  handler: async (ctx) => {
    const entitlement = await ctx.db
      .query("entitlements")
      .withIndex("by_user_key", (q) =>
        q
          .eq("userId", ctx.user._id)
          .eq("key", SiteConfig.payment.entitlementKey),
      )
      .first();

    return {
      active: entitlement?.status === "active",
      entitlement,
    };
  },
});

export const internalGetStripeCustomerId = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, { tokenIdentifier }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();

    if (!user) return null;

    const entitlement = await ctx.db
      .query("entitlements")
      .withIndex("by_user_key", (q) =>
        q
          .eq("userId", user._id)
          .eq("key", SiteConfig.payment.entitlementKey),
      )
      .first();

    return entitlement?.stripeCustomerId ?? null;
  },
});

export const grantDev = authMutation({
  args: {},
  handler: async (ctx) => {
    // CONVEX_DEPLOYMENT is a CLI-only variable and is NOT available in the
    // function runtime, so the bypass must be enabled explicitly per
    // deployment. Never set this on production.
    if (process.env.ALLOW_DEV_PAYMENT_BYPASS !== "true") {
      throw new Error(
        "Dev payment bypass is disabled on this deployment. To test the paywall " +
          "without a real purchase, run: npx convex env set ALLOW_DEV_PAYMENT_BYPASS true",
      );
    }

    const entitlement = await upsertEntitlement(ctx, {
      userId: ctx.user._id,
      key: SiteConfig.payment.entitlementKey,
      status: "active",
      source: "dev",
      productId: "dev-bypass",
      providerEnvironment: "development",
    });

    return { active: true, entitlement };
  },
});

export const internalGrant = internalMutation({
  args: {
    identity: identityArg,
    source: paymentSource,
    status: entitlementStatus,
    productId: v.string(),
    transactionId: v.optional(v.string()),
    purchaseTokenHash: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    providerEnvironment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        email: args.identity.email ?? "",
        name: args.identity.name,
        authId: args.identity.authId ?? "",
        tokenIdentifier: args.identity.tokenIdentifier,
        createdAt: Date.now(),
      });
      await bumpCounter(ctx, "users_total", 1);
      user = (await ctx.db.get(userId))!;
      if (user.email) {
        await ctx.scheduler.runAfter(0, internal.email.upsertSubscriber, {
          email: user.email,
          name: user.name,
          tags: [LumailTags.activation],
        });
      }
    }

    const entitlement = await upsertEntitlement(ctx, {
      userId: user._id,
      key: SiteConfig.payment.entitlementKey,
      status: args.status,
      source: args.source,
      productId: args.productId,
      transactionId: args.transactionId,
      purchaseTokenHash: args.purchaseTokenHash,
      stripeCustomerId: args.stripeCustomerId,
      stripePaymentIntentId: args.stripePaymentIntentId,
      providerEnvironment: args.providerEnvironment,
    });

    return { active: entitlement.status === "active", entitlement };
  },
});
