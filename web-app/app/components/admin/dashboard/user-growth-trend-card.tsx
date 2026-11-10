import type { FunctionReturnType } from "convex/server";
import { getTrend, TrendCard } from "@/components/admin/dashboard/trend-card";
import { api } from "@convex/_generated/api";

type StatsData = FunctionReturnType<typeof api.admin.queries.getStats>;

export function UserGrowthTrendCard({
  data,
  sampled,
}: {
  data: StatsData["userGrowth"];
  sampled: boolean;
}) {
  const current = data.at(-1)?.total ?? 0;
  const previous = data.at(-2)?.total ?? 0;
  const newThisMonth = data.at(-1)?.count ?? 0;

  return (
    <TrendCard
      title="Total Users"
      value={current.toLocaleString()}
      subtitle={
        sampled
          ? "Recent user sample"
          : `+${newThisMonth.toLocaleString()} this month`
      }
      trend={getTrend(current, previous)}
      points={data.map((point) => ({
        label: point.label,
        value: point.total,
      }))}
      colorVar="--chart-2"
      ariaLabel="Total users for the last six months"
    />
  );
}
