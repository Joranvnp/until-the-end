import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    tokenIdentifier: v.string(),
    authId: v.string(),
    isAdmin: v.optional(v.boolean()),
    createdAt: v.number(),
    anonymizedAt: v.optional(v.number()),
    bannedAt: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_authId", ["authId"])
    .index("by_email", ["email"])
    .index("by_isAdmin_and_bannedAt", ["isAdmin", "bannedAt"])
    .index("by_bannedAt_and_anonymizedAt_and_isAdmin", [
      "bannedAt",
      "anonymizedAt",
      "isAdmin",
    ])
    .searchIndex("search_email", { searchField: "email" }),

  adminSessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    createdAt: v.number(),
  }).index("by_token", ["token"]),

  counters: defineTable({
    name: v.string(),
    value: v.number(),
  }).index("by_name", ["name"]),

  entitlements: defineTable({
    userId: v.id("users"),
    key: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("pending"),
      v.literal("revoked"),
      v.literal("refunded"),
    ),
    source: v.union(
      v.literal("apple_iap"),
      v.literal("google_play"),
      v.literal("stripe"),
      v.literal("dev"),
    ),
    productId: v.string(),
    transactionId: v.optional(v.string()),
    purchaseTokenHash: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    providerEnvironment: v.optional(v.string()),
    grantedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_key", ["userId", "key"])
    .index("by_source_transaction", ["source", "transactionId"])
    .index("by_purchase_token_hash", ["purchaseTokenHash"])
    .index("by_status_and_source", ["status", "source"])
    .index("by_source", ["source"]),
});
