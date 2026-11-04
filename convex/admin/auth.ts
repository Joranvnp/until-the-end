import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { bumpCounter } from "./metrics";

const ADMIN_EMAILS: string[] = ["joran.vanpeene@gmail.com"];

export const ensureAdminUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const email = (identity.email ?? "").trim().toLowerCase();
    if (!email || !ADMIN_EMAILS.includes(email)) {
      throw new Error("Not an admin");
    }

    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        email,
        authId: identity.subject ?? "",
        tokenIdentifier: identity.tokenIdentifier,
        createdAt: Date.now(),
        isAdmin: true,
      });
      await bumpCounter(ctx, "users_total", 1);
      return { userId, email };
    }

    const patch: { tokenIdentifier?: string; isAdmin?: boolean } = {};
    if (user.tokenIdentifier !== identity.tokenIdentifier) {
      patch.tokenIdentifier = identity.tokenIdentifier;
    }
    if (!user.isAdmin) {
      patch.isAdmin = true;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
    }

    return { userId: user._id, email };
  },
});

// Dev/ops utility: grant admin by email from the CLI (npx convex run).
// internalMutation = not callable from any client, only the CLI/server.
export const setAdminByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const target = email.trim().toLowerCase();
    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => u.email.trim().toLowerCase() === target);
    if (!user) {
      throw new Error(
        `No users row for ${target}. Sign in once on /app or /admin first so the row is created, then re-run.`,
      );
    }
    if (user.isAdmin)
      return { ok: true as const, alreadyAdmin: true, userId: user._id };
    await ctx.db.patch(user._id, { isAdmin: true });
    return { ok: true as const, alreadyAdmin: false, userId: user._id };
  },
});

export const checkSession = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", sessionToken))
      .first();

    if (!session) return { valid: false as const, email: null };

    const user = await ctx.db.get(session.userId);
    if (!user || !user.isAdmin) return { valid: false as const, email: null };

    return { valid: true as const, email: user.email };
  },
});

export const revokeSession = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", sessionToken))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { ok: true };
  },
});
