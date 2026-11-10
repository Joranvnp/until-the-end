import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  MiniAreaChart,
  type ChartPoint,
} from "@/components/admin/dashboard/mini-area-chart";

export type Trend = { positive: boolean; label: string };

export function getTrend(current: number, previous: number): Trend {
  if (previous === 0) {
    return {
      positive: true,
      label: current > 0 ? "New" : "+0.0%",
    };
  }

  const growth = ((current - previous) / previous) * 100;
  return {
    positive: growth >= 0,
    label: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`,
  };
}

export function TrendCard({
  title,
  value,
  subtitle,
  trend,
  points,
  colorVar,
  ariaLabel,
}: {
  title: string;
  value: string;
  subtitle?: string;
  trend: Trend;
  points: ChartPoint[];
  colorVar: string;
  ariaLabel: string;
}) {
  const TrendIcon = trend.positive ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {value}
              </p>
              {subtitle ? (
                <span className="text-muted-foreground text-sm">{subtitle}</span>
              ) : null}
            </div>
          </div>
          <div
            className={
              trend.positive
                ? "flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                : "flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400"
            }
          >
            <TrendIcon className="size-3" />
            {trend.label}
          </div>
        </div>

        <MiniAreaChart points={points} colorVar={colorVar} ariaLabel={ariaLabel} />
      </CardContent>
    </Card>
  );
}
