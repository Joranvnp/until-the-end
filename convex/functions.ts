import {
  customQuery,
  customMutation,
  customAction,
  customCtx,
} from "convex-helpers/server/customFunctions";
import { query, mutation, action } from "./_generated/server";
import type { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { bumpCounter } from "./admin/metrics";
import { LumailTags } from "./emailTags";

async function readUser(ctx: QueryCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .first();

  if (user) {
    if (user.bannedAt) throw new Error("Account banned");
    return user;
  }

  throw new Error("User not found. Please complete sign-up first.");
}

async function getOrCreateUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .first();

  if (user) {
    if (user.bannedAt) throw new Error("Account banned");
    const email = identity.email ?? "";
    const authId = identity.subject ?? "";
    const patch: Partial<Pick<Doc<"users">, "email" | "authId">> = {};

    if (email && user.email !== email) {
      patch.email = email;
    }
    if (authId && user.authId !== authId) {
      patch.authId = authId;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
      return (await ctx.db.get(user._id))!;
    }

    return user;
  }

  const email = identity.email ?? "";
  const authId = identity.subject ?? "";

  // Reconcile a pre-provisioned row (e.g. admin-created users) by its stable
  // authId before inserting, so a rotated tokenIdentifier never duplicates it.
  if (authId) {
    const byAuthId = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", authId))
      .first();
    if (byAuthId) {
      if (byAuthId.bannedAt) throw new Error("Account banned");
      const patch: Partial<Pick<Doc<"users">, "email" | "tokenIdentifier">> = {};
      if (byAuthId.tokenIdentifier !== identity.tokenIdentifier) {
        patch.tokenIdentifier = identity.tokenIdentifier;
      }
      if (email && byAuthId.email !== email) {
        patch.email = email;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(byAuthId._id, patch);
      }
      return (await ctx.db.get(byAuthId._id))!;
    }
  }

  const userId = await ctx.db.insert("users", {
    email,
    authId,
    tokenIdentifier: identity.tokenIdentifier,
    createdAt: Date.now(),
  });

  await bumpCounter(ctx, "users_total", 1);

  if (email) {
    await ctx.scheduler.runAfter(0, internal.email.upsertSubscriber, {
      email,
      tags: [LumailTags.activation],
    });
  }

  return (await ctx.db.get(userId))!;
}

async function getIdentityOnly(ctx: Pick<ActionCtx, "auth">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity;
}

export const authQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await readUser(ctx);
    return { user };
  }),
);

export const authMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await getOrCreateUser(ctx);
    return { user };
  }),
);

export const authAction = customAction(
  action,
  customCtx(async (ctx) => {
    const identity = await getIdentityOnly(ctx);
    return { identity };
  }),
);

export const adminQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await readUser(ctx);
    if (!user.isAdmin) throw new Error("Forbidden: admin access required");
    return { user };
  }),
);

export const adminMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await getOrCreateUser(ctx);
    if (!user.isAdmin) throw new Error("Forbidden: admin access required");
    return { user };
  }),
);

export const adminAction = customAction(
  action,
  customCtx(async (ctx) => {
    const identity = await getIdentityOnly(ctx);
    const isAdmin: boolean = await ctx.runQuery(
      internal.users.account.internalCheckAdmin,
      { tokenIdentifier: identity.tokenIdentifier }
    );
    if (!isAdmin) throw new Error("Forbidden: admin access required");
    return { identity, isAdmin: true as const };
  }),
);

export { query, mutation, action } from "./_generated/server";
