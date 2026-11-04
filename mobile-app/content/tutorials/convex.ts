import type { Tutorial } from './tutorials';

const SCHEMA_SNIPPET = `// convex/schema.ts
export default defineSchema({
  items: defineTable({
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"]),
});`;

const QUERY_SNIPPET = `// convex/items/queries.ts
export const list = authQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("items")
      .withIndex("by_user", (q) =>
        q.eq("userId", ctx.user._id)
      )
      .order("desc")
      .collect();
  },
});`;

const USE_QUERY_SNIPPET = `// In a component:
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

const items = useQuery(api.items.queries.list);
// items is undefined while loading, then auto-updates`;

const MUTATION_SNIPPET = `// convex/items/mutations.ts
export const create = authMutation({
  args: {
    content: v.string(),
  },
  handler: async (ctx, { content }) => {
    return await ctx.db.insert("items", {
      userId: ctx.user._id,
      content,
      createdAt: Date.now(),
    });
  },
});`;

export const convexTutorial: Tutorial = {
  slug: 'convex',
  title: 'How Convex Works',
  description: 'Schema, queries, realtime',
  sections: [
    {
      title: 'Schema',
      body: 'Define your tables in convex/schema.ts. Indexes are required for efficient queries - always index fields you filter or sort on.',
      code: { title: 'schema.ts', snippet: SCHEMA_SNIPPET },
    },
    {
      title: 'Queries',
      body: 'Use authQuery for protected reads. The ctx.user is injected by the middleware. Always use indexes with withIndex() - never full table scans.',
      code: { title: 'queries.ts', snippet: QUERY_SNIPPET },
    },
    {
      title: 'Realtime with useQuery',
      body: 'useQuery subscribes to live data. When the DB changes, the component re-renders automatically. No polling needed.',
      code: { title: 'component.tsx', snippet: USE_QUERY_SNIPPET },
    },
    {
      title: 'Mutations',
      body: 'Use authMutation for protected writes. Mutations are transactional - either all changes apply or none do.',
      code: { title: 'mutations.ts', snippet: MUTATION_SNIPPET },
    },
    {
      title: 'Auth middleware pattern',
      body: 'authQuery / authMutation / adminQuery / adminMutation are defined in convex/functions.ts using convex-helpers customFunctions. They inject ctx.user automatically and throw if unauthenticated or unauthorized.',
    },
  ],
};
