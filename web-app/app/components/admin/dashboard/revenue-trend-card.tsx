import type { FunctionReturnType } from "convex/server";
import { getTrend, TrendCard } from "@/components/admin/dashboard/trend-card";
import { formatMoney } from "@/lib/format-money";
import { api } from "@convex/_generated/api";

type StatsData = FunctionReturnType<typeof api.admin.queries.getStats>;

export function RevenueTrendCard({
  data,
  currency,
  capped,
}: {
  data: StatsData["revenueHistory"];
  currency: string;
  capped: boolean;
}) {
  const current = data.at(-1)?.revenueCents ?? 0;
  const previous = data.at(-2)?.revenueCents ?? 0;

  return (
    <TrendCard
      title="Estimated Revenue"
      value={`${formatMoney(current, currency)}${capped ? "+" : ""}`}
      subtitle={capped ? "Lower-bound estimate" : undefined}
      trend={getTrend(current, previous)}
      points={data.map((point) => ({
        label: point.label,
        value: point.revenueCents,
      }))}
      colorVar="--chart-1"
      ariaLabel="Estimated revenue for the last six months"
    />
  );
}
