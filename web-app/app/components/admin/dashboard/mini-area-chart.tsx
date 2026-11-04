import { useId } from "react";

export type ChartPoint = {
  label: string;
  value: number;
};

export function MiniAreaChart({
  points,
  colorVar,
  ariaLabel,
}: {
  points: ChartPoint[];
  colorVar: string;
  ariaLabel: string;
}) {
  const gradientId = `admin-chart-${useId().replace(/:/g, "")}`;
  const width = 640;
  const height = 160;
  const paddingX = 12;
  const paddingY = 18;
  const values = points.map((point) => point.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const coordinates = points.map((point, index) => ({
    x:
      points.length === 1
        ? width / 2
        : paddingX +
          (index / (points.length - 1)) * (width - paddingX * 2),
    y: height - paddingY - ((point.value - min) / range) * (height - paddingY * 2),
  }));
  const linePath = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const last = coordinates.at(-1);
  const first = coordinates[0];
  const areaPath =
    last && first
      ? `${linePath} L ${last.x} ${height - paddingY} L ${first.x} ${
          height - paddingY
        } Z`
      : "";

  return (
    <div className="mt-6">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="h-36 w-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`var(${colorVar})`} stopOpacity={0.28} />
            <stop offset="100%" stopColor={`var(${colorVar})`} stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((line) => (
          <line
            key={line}
            x1={paddingX}
            x2={width - paddingX}
            y1={paddingY + line * (height - paddingY * 2)}
            y2={paddingY + line * (height - paddingY * 2)}
            stroke="var(--border)"
            strokeOpacity={0.65}
          />
        ))}
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={`var(${colorVar})`}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
        />
      </svg>
      <div className="text-muted-foreground grid grid-cols-6 text-xs">
        {points.map((point) => (
          <span key={point.label} className="truncate text-center">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}
