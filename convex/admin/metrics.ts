import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { internal } from "../_generated/api";

export async function readCounter(ctx: QueryCtx, name: string): Promise<number> {
  const row = await ctx.db
    .query("counters")
    .withIndex("by_name", (q) => q.eq("name", name))
    .unique();
  return row?.value ?? 0;
}

// Maintains a denormalized counter. Wrapped so a metrics failure can NEVER
// break the calling flow (auth, user creation, purchases, ...).
export async function bumpCounter(
  ctx: MutationCtx,
  name: string,
  delta: number,
): Promise<void> {
  try {
    const row = await ctx.db
      .query("counters")
      .withIndex("by_name", (q) => q.eq("name", name))
      .unique();
    if (row) {
      await ctx.db.patch(row._id, { value: row.value + delta });
    } else {
      await ctx.db.insert("counters", { name, value: delta });
    }
  } catch (error) {
    console.warn(`[metrics] bumpCounter(${name}, ${delta}) failed`, error);
  }
}

async function setCounter(
  ctx: MutationCtx,
  name: string,
  value: number,
): Promise<void> {
  const row = await ctx.db
    .query("counters")
    .withIndex("by_name", (q) => q.eq("name", name))
    .unique();
  if (row) {
    await ctx.db.patch(row._id, { value });
  } else {
    await ctx.db.insert("counters", { name, value });
  }
}

// One-shot backfill for existing installs: recompute users_total in bounded
// batches, self-scheduling to stay within transaction limits.
// Run via: npx convex run admin/metrics:recomputeCounters
export const recomputeCounters = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    running: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { cursor, running },
  ): Promise<{ done: boolean; counted: number }> => {
    const BATCH = 500;
    const acc = running ?? 0;
    const page = await ctx.db
      .query("users")
      .paginate({ numItems: BATCH, cursor: cursor ?? null });
    const total = acc + page.page.length;
    if (!page.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.admin.metrics.recomputeCounters,
        { cursor: page.continueCursor, running: total },
      );
      return { done: false, counted: total };
    }
    await setCounter(ctx, "users_total", total);
    return { done: true, counted: total };
  },
});
