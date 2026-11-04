// Pure helpers, types, and validator fragments for convex/admin/queries.ts.
// No Convex functions are registered here; registered functions must stay in
// queries.ts so their generated api.admin.queries.* paths do not change.
// Underscore file name is required: Convex module paths reject hyphens.
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { SiteConfig } from "../siteConfig";
import { components } from "../_generated/api";

export type AuthRow = Record<string, unknown>;
type ConnectedAuthProvider = {
  id: string;
  status: "connected";
  accountId: string | null;
  displayIdentifier: string | null;
  providerId: string;
  connectedAt: number;
};
type AvailableAuthProvider = {
  id: string;
  status: "available";
  accountId: null;
  displayIdentifier: string;
  providerId: "email-otp";
  availableSince: number;
};
export type UserAuthProvider = ConnectedAuthProvider | AvailableAuthProvider;

export const str = (value: unknown): string | null =>
  typeof value === "string" ? value : null;
export const num = (value: unknown): number | null =>
  typeof value === "number" ? value : null;

export function normalizeProviderId(providerId: string) {
  switch (providerId.toLowerCase()) {
    case "credentials":
      return "credential";
    case "email_otp":
    case "otp":
      return "email-otp";
    default:
      return providerId.toLowerCase();
  }
}

// Reads up to 20 Better Auth result pages for a user from the component.
export async function findAuthRows(
  ctx: QueryCtx,
  model: "session" | "account",
  authId: string,
): Promise<AuthRow[]> {
  const rows: AuthRow[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < 20; i++) {
    const result: {
      page: AuthRow[];
      isDone: boolean;
      continueCursor: string;
    } = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model,
      where: [{ field: "userId", value: authId, operator: "eq" }],
      paginationOpts: { numItems: 100, cursor },
    });
    rows.push(...result.page);
    if (result.isDone) break;
    cursor = result.continueCursor;
  }
  return rows;
}

// Bounded read used for the dashboard's active-subscriber metric. Keeps the
// query cheap; the count is reported as "N+" once the cap is reached.
export const STATS_CAP = 5000;
const HISTORY_MONTHS = 6;
export const HISTORY_CAP = 5000;
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

type MonthBucket = {
  key: string;
  label: string;
};

function monthKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function buildMonthBuckets(now = Date.now()): MonthBucket[] {
  const current = new Date(now);
  const first = new Date(
    Date.UTC(
      current.getUTCFullYear(),
      current.getUTCMonth() - (HISTORY_MONTHS - 1),
      1,
    ),
  );

  return Array.from({ length: HISTORY_MONTHS }, (_, index) => {
    const date = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + index, 1),
    );
    return {
      key: monthKey(date.getTime()),
      label: MONTH_LABELS[date.getUTCMonth()],
    };
  });
}

export function buildUserGrowth(
  users: Doc<"users">[],
  totalUsers: number,
  buckets: MonthBucket[],
) {
  const counts = new Map(buckets.map((bucket) => [bucket.key, 0]));
  let usersInWindow = 0;

  for (const user of users) {
    const key = monthKey(user.createdAt);
    const current = counts.get(key);
    if (current !== undefined) {
      counts.set(key, current + 1);
      usersInWindow += 1;
    }
  }

  let runningTotal = Math.max(0, totalUsers - usersInWindow);
  return buckets.map((bucket) => {
    const count = counts.get(bucket.key) ?? 0;
    runningTotal += count;
    return {
      date: bucket.key,
      label: bucket.label,
      count,
      total: runningTotal,
    };
  });
}

export function buildRevenueHistory(
  entitlements: Doc<"entitlements">[],
  activeSubscribers: number,
  priceAmountCents: number,
  buckets: MonthBucket[],
) {
  const counts = new Map(buckets.map((bucket) => [bucket.key, 0]));
  let subscribersInWindow = 0;

  for (const entitlement of entitlements) {
    const key = monthKey(entitlement.grantedAt ?? entitlement.createdAt);
    const current = counts.get(key);
    if (current !== undefined) {
      counts.set(key, current + 1);
      subscribersInWindow += 1;
    }
  }

  let runningSubscribers = Math.max(0, activeSubscribers - subscribersInWindow);
  return buckets.map((bucket) => {
    const count = counts.get(bucket.key) ?? 0;
    runningSubscribers += count;
    return {
      date: bucket.key,
      label: bucket.label,
      count,
      revenueCents: runningSubscribers * priceAmountCents,
    };
  });
}

export const entitlementStatus = v.union(
  v.literal("active"),
  v.literal("pending"),
  v.literal("revoked"),
  v.literal("refunded"),
);

export const paymentSource = v.union(
  v.literal("apple_iap"),
  v.literal("google_play"),
  v.literal("stripe"),
  v.literal("dev"),
);

export const userRole = v.union(v.literal("admin"), v.literal("user"));
export const userStatus = v.union(v.literal("active"), v.literal("banned"));

// Predicate mirroring listUsers' indexed role/status branches, for the cases
// no index can serve (search results, role=user + status=banned).
export function matchesUserFilters(
  user: Doc<"users">,
  role: "admin" | "user" | undefined,
  status: "active" | "banned" | undefined,
): boolean {
  if (role === "admin" && user.isAdmin !== true) return false;
  if (role === "user" && user.isAdmin === true) return false;
  if (status === "banned" && user.bannedAt === undefined) return false;
  if (
    status === "active" &&
    (user.bannedAt !== undefined || user.anonymizedAt !== undefined)
  ) {
    return false;
  }
  return true;
}

type UserPlan = {
  active: boolean;
  status: Doc<"entitlements">["status"];
  source: Doc<"entitlements">["source"];
} | null;

export async function planForUser(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<UserPlan> {
  const entitlement = await ctx.db
    .query("entitlements")
    .withIndex("by_user_key", (q) =>
      q.eq("userId", userId).eq("key", SiteConfig.payment.entitlementKey),
    )
    .first();
  if (!entitlement) return null;
  return {
    active: entitlement.status === "active",
    status: entitlement.status,
    source: entitlement.source,
  };
}

export async function withUser(
  ctx: QueryCtx,
  entitlement: Doc<"entitlements">,
) {
  const user = await ctx.db.get(entitlement.userId);
  return {
    ...entitlement,
    userEmail: user?.email ?? null,
    userName: user?.name ?? null,
  };
}
