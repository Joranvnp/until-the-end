// Registered admin queries. These must stay in this file: clients address
// them as api.admin.queries.<name>, and moving a registered function to
// another module changes its generated API path. Pure helpers live in
// ./queries_helpers.ts (underscore: Convex module paths reject hyphens).
import { adminQuery } from "../functions";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { filter } from "convex-helpers/server/filter";
import { SiteConfig } from "../siteConfig";
import { readCounter } from "./metrics";
import { components } from "../_generated/api";
import {
  buildMonthBuckets,
  buildRevenueHistory,
  buildUserGrowth,
  entitlementStatus,
  findAuthRows,
  HISTORY_CAP,
  matchesUserFilters,
  normalizeProviderId,
  num,
  paymentSource,
  planForUser,
  STATS_CAP,
  str,
  userRole,
  userStatus,
  withUser,
  type AuthRow,
  type UserAuthProvider,
} from "./queries_helpers";

export const listUserSessions = adminQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    const rows = await findAuthRows(ctx, "session", user.authId);
    return rows.map((row) => ({
      id: str(row._id) ?? "",
      userAgent: str(row.userAgent),
      ipAddress: str(row.ipAddress),
      impersonatedBy: str(row.impersonatedBy),
      createdAt: num(row.createdAt) ?? num(row._creationTime) ?? 0,
      expiresAt: num(row.expiresAt) ?? 0,
    }));
  },
});

export const listUserAuthProviders = adminQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    const rows = await findAuthRows(ctx, "account", user.authId);
    const providers: UserAuthProvider[] = rows.map((row) => {
      const accountId = str(row.accountId);
      const providerId = normalizeProviderId(str(row.providerId) ?? "unknown");
      return {
        id: str(row._id) ?? `${providerId}:${accountId ?? user.authId}`,
        status: "connected" as const,
        accountId,
        displayIdentifier: accountId,
        providerId,
        connectedAt: num(row.createdAt) ?? num(row._creationTime) ?? 0,
      };
    });

    const hasEmailOtp = providers.some(
      (provider) => provider.providerId === "email-otp",
    );
    if (user.email && !hasEmailOtp) {
      providers.unshift({
        id: `${user.authId}:email-otp`,
        status: "available",
        accountId: null,
        displayIdentifier: user.email,
        providerId: "email-otp",
        availableSince: user.createdAt,
      });
    }

    return providers;
  },
});

export const listUsers = adminQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    role: v.optional(userRole),
    status: v.optional(userStatus),
  },
  handler: async (ctx, { paginationOpts, search, role, status }) => {
    const term = search?.trim();

    const base = term
      ? ctx.db
          .query("users")
          .withSearchIndex("search_email", (q) => q.search("email", term))
      : ctx.db.query("users").order("desc");

    const filtered = base.filter((q) => {
      const clauses = [];
      if (role) {
        clauses.push(
          role === "admin"
            ? q.eq(q.field("isAdmin"), true)
            : q.neq(q.field("isAdmin"), true),
        );
      }
      if (status === "banned") {
        clauses.push(q.neq(q.field("bannedAt"), undefined));
      }
      if (status === "active") {
        clauses.push(
          q.and(
            q.eq(q.field("bannedAt"), undefined),
            q.eq(q.field("anonymizedAt"), undefined),
          ),
        );
      }
      return clauses.length ? q.and(...clauses) : true;
    });

    const result = await filtered.paginate(paginationOpts);

    const page = await Promise.all(
      result.page.map(async (user) => ({
        ...user,
        plan: await planForUser(ctx, user._id),
      })),
    );

    return { ...result, page };
  },
});

export const getUserDetail = adminQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    const entitlements = await ctx.db
      .query("entitlements")
      .withIndex("by_user_key", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    const latestSession: {
      page: AuthRow[];
    } = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "session",
      where: [{ field: "userId", value: user.authId, operator: "eq" }],
      sortBy: { field: "createdAt", direction: "desc" },
      paginationOpts: { numItems: 1, cursor: null },
    });
    const lastSignInAt =
      num(latestSession.page[0]?.createdAt) ??
      num(latestSession.page[0]?._creationTime) ??
      null;

    return { user, entitlements, lastSignInAt };
  },
});

export const getStats = adminQuery({
  args: {},
  handler: async (ctx) => {
    const totalUsers = await readCounter(ctx, "users_total");
    const buckets = buildMonthBuckets();
    const usersForHistory = await ctx.db
      .query("users")
      .order("desc")
      .take(HISTORY_CAP);
    const userHistoryCapped =
      usersForHistory.length >= HISTORY_CAP && totalUsers > usersForHistory.length;

    const activeEntitlements = await ctx.db
      .query("entitlements")
      .withIndex("by_status_and_source", (q) => q.eq("status", "active"))
      .take(STATS_CAP);
    const activeSubscribers = activeEntitlements.length;
    const activeCapped = activeSubscribers >= STATS_CAP;

    const recentUsers = usersForHistory.slice(0, 6);

    const recentEntitlements = await ctx.db
      .query("entitlements")
      .order("desc")
      .take(6);
    const recentPayments = await Promise.all(
      recentEntitlements.map((e) => withUser(ctx, e)),
    );

    return {
      totalUsers,
      activeSubscribers,
      activeCapped,
      priceAmountCents: SiteConfig.payment.priceAmount,
      currency: SiteConfig.payment.currency,
      estimatedRevenueCents: activeSubscribers * SiteConfig.payment.priceAmount,
      revenueHistoryCapped: activeCapped,
      revenueHistory: buildRevenueHistory(
        activeEntitlements,
        activeSubscribers,
        SiteConfig.payment.priceAmount,
        buckets,
      ),
      userHistoryCapped,
      userGrowth: buildUserGrowth(usersForHistory, totalUsers, buckets),
      recentUsers,
      recentPayments,
    };
  },
});

export const listPayments = adminQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(entitlementStatus),
    source: v.optional(paymentSource),
  },
  handler: async (ctx, { paginationOpts, status, source }) => {
    let result;
    if (status && source) {
      result = await ctx.db
        .query("entitlements")
        .withIndex("by_status_and_source", (q) =>
          q.eq("status", status).eq("source", source),
        )
        .order("desc")
        .paginate(paginationOpts);
    } else if (status) {
      result = await ctx.db
        .query("entitlements")
        .withIndex("by_status_and_source", (q) => q.eq("status", status))
        .order("desc")
        .paginate(paginationOpts);
    } else if (source) {
      result = await ctx.db
        .query("entitlements")
        .withIndex("by_source", (q) => q.eq("source", source))
        .order("desc")
        .paginate(paginationOpts);
    } else {
      result = await ctx.db
        .query("entitlements")
        .order("desc")
        .paginate(paginationOpts);
    }

    const page = await Promise.all(result.page.map((e) => withUser(ctx, e)));
    return { ...result, page };
  },
});

export const searchCommand = adminQuery({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const term = q.trim();
    if (!term) return { users: [] };

    const users = await ctx.db
      .query("users")
      .withSearchIndex("search_email", (query) => query.search("email", term))
      .take(8);

    return {
      users: users.map((user) => ({
        _id: user._id,
        email: user.email,
        name: user.name ?? null,
        bannedAt: user.bannedAt ?? null,
        anonymizedAt: user.anonymizedAt ?? null,
        isAdmin: Boolean(user.isAdmin),
      })),
    };
  },
});

export const getPaymentDetail = adminQuery({
  args: { entitlementId: v.id("entitlements") },
  handler: async (ctx, { entitlementId }) => {
    const entitlement = await ctx.db.get(entitlementId);
    if (!entitlement) throw new Error("Payment not found");
    const user = await ctx.db.get(entitlement.userId);
    return { entitlement, user };
  },
});
