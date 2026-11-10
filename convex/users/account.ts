import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { authQuery, authMutation } from "../functions";

// Deliberately NOT an authQuery: on first sign-in the session exists before the
// users row does (ensureUser hasn't run yet), and authQuery would throw
// "User not found". Returning null lets clients trigger ensureUser instead.
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();
    if (!user || user.bannedAt) return null;

    return {
      _id: user._id,
      email: user.email,
      name: user.name ?? null,
      isAdmin: user.isAdmin === true,
    };
  },
});

export const checkIsAdmin = authQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.user.isAdmin === true;
  },
});

export const ensureUser = authMutation({
  args: {},
  handler: async (ctx): Promise<void> => {
    void ctx.user;
  },
});

export const updateProfile = authMutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new Error("Name is required");
    }
    if (trimmedName.length > 64) {
      throw new Error("Name must be 64 characters or fewer");
    }

    await ctx.db.patch(ctx.user._id, { name: trimmedName });
    return { ok: true as const, name: trimmedName };
  },
});

export const anonymizeAccount = authMutation({
  args: {},
  handler: async (ctx) => {
    const user = ctx.user;
    if (user.anonymizedAt != null) {
      return { ok: true as const, alreadyAnonymized: true };
    }

    const placeholderEmail = `anon_${user._id}@deleted.invalid`;

    await ctx.db.patch(user._id, {
      email: placeholderEmail,
      anonymizedAt: Date.now(),
    });

    return { ok: true as const, alreadyAnonymized: false };
  },
});

export const internalGetUserByToken = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, { tokenIdentifier }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .first();
  },
});

export const internalCheckAdmin = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, { tokenIdentifier }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .first();
    return user?.isAdmin === true;
  },
});
