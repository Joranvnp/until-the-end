import { v } from "convex/values";
import { adminMutation } from "../functions";
import { components } from "../_generated/api";
import { authComponent, createAuth } from "../auth";
import { bumpCounter } from "./metrics";

const entitlementStatus = v.union(
  v.literal("active"),
  v.literal("pending"),
  v.literal("revoked"),
  v.literal("refunded"),
);

export const setUserBanned = adminMutation({
  args: { userId: v.id("users"), banned: v.boolean() },
  handler: async (ctx, { userId, banned }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (user.isAdmin) throw new Error("Cannot ban an admin");
    await ctx.db.patch(userId, { bannedAt: banned ? Date.now() : undefined });
    return { ok: true as const, banned };
  },
});

export const anonymizeUser = adminMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(userId, {
      email: `anonymized_${userId}@deleted.local`,
      name: undefined,
      anonymizedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const setUserAdmin = adminMutation({
  args: { userId: v.id("users"), isAdmin: v.boolean() },
  handler: async (ctx, { userId, isAdmin }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (!isAdmin && ctx.user._id === userId) {
      throw new Error("You cannot remove your own admin access");
    }
    await ctx.db.patch(userId, { isAdmin });
    return { ok: true as const, isAdmin };
  },
});

export const updateUserName = adminMutation({
  args: { userId: v.id("users"), name: v.string() },
  handler: async (ctx, { userId, name }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 64) {
      throw new Error("Name must be between 1 and 64 characters");
    }
    await ctx.db.patch(userId, { name: trimmed });
    return { ok: true as const, name: trimmed };
  },
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const updateUserEmail = adminMutation({
  args: { userId: v.id("users"), email: v.string() },
  handler: async (ctx, { userId, email }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new Error("Enter a valid email address");
    }
    if (normalized !== user.email) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", normalized))
        .first();
      if (existing && existing._id !== userId) {
        throw new Error("Another user already uses this email");
      }
    }
    await ctx.db.patch(userId, { email: normalized });
    return { ok: true as const, email: normalized };
  },
});

export const revokeUserSession = adminMutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: "session",
        where: [{ field: "_id", value: sessionId, operator: "eq" }],
      },
    });
    return { ok: true as const };
  },
});

export const revokeAllUserSessions = adminMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    let cursor: string | null = null;
    for (let i = 0; i < 20; i++) {
      const result: { isDone: boolean; continueCursor: string } =
        await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
          input: {
            model: "session",
            where: [{ field: "userId", value: user.authId, operator: "eq" }],
          },
          paginationOpts: { numItems: 200, cursor },
        });
      if (result.isDone) break;
      cursor = result.continueCursor;
    }
    return { ok: true as const };
  },
});

export const createUser = adminMutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { email, password, name }) => {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new Error("Enter a valid email address");
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();
    if (existing) throw new Error("A user with this email already exists");

    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
    const result = await auth.api.signUpEmail({
      headers,
      body: { email: normalized, password, name: name.trim() || normalized },
    });
    const authId = result.user.id;

    // Mirror row so the user shows in the admin list immediately. The login
    // path reconciles by authId, so a synthetic tokenIdentifier is safe here.
    const userId = await ctx.db.insert("users", {
      email: normalized,
      name: name.trim() || undefined,
      authId,
      tokenIdentifier: `pending:${authId}`,
      createdAt: Date.now(),
    });
    await bumpCounter(ctx, "users_total", 1);

    return { ok: true as const, userId };
  },
});

export const setEntitlementStatus = adminMutation({
  args: { entitlementId: v.id("entitlements"), status: entitlementStatus },
  handler: async (ctx, { entitlementId, status }) => {
    const entitlement = await ctx.db.get(entitlementId);
    if (!entitlement) throw new Error("Payment not found");
    const now = Date.now();
    await ctx.db.patch(entitlementId, {
      status,
      grantedAt:
        status === "active" ? (entitlement.grantedAt ?? now) : entitlement.grantedAt,
      updatedAt: now,
    });
    return { ok: true as const, status };
  },
});
