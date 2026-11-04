import { useId } from "react";
import { cn } from "@/lib/utils";

export function CircleBackground({
  color = "currentColor",
  className,
  ...props
}: React.ComponentPropsWithoutRef<"svg"> & { color?: string }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 558 558"
      width="558"
      height="558"
      fill="none"
      aria-hidden="true"
      className={cn("text-primary", className)}
      {...props}
    >
      <defs>
        <linearGradient
          id={id}
          x1="79"
          y1="16"
          x2="105"
          y2="237"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        opacity=".2"
        d="M1 279C1 125.465 125.465 1 279 1s278 124.465 278 278-124.465 278-278 278S1 432.535 1 279Z"
        stroke={color}
      />
      <path
        d="M1 279C1 125.465 125.465 1 279 1"
        stroke={`url(#${id})`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeroOrbits({ className }: { className?: string }) {
  const id = useId();
  return (
    <div className={cn("pointer-events-none", className)} aria-hidden="true">
      <svg
        viewBox="0 0 1026 1026"
        fill="none"
        className="absolute inset-0 h-full w-full animate-spin-slow"
      >
        <path
          d="M1025 513c0 282.77-229.23 512-512 512S1 795.77 1 513 230.23 1 513 1s512 229.23 512 512Z"
          stroke="currentColor"
          strokeOpacity="0.25"
        />
        <path
          d="M513 1025C230.23 1025 1 795.77 1 513"
          stroke={`url(#${id}-g1)`}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient
            id={`${id}-g1`}
            x1="1"
            y1="513"
            x2="1"
            y2="1025"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="currentColor" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <svg
        viewBox="0 0 1026 1026"
        fill="none"
        className="absolute inset-0 h-full w-full animate-spin-reverse-slower"
      >
        <path
          d="M913 513c0 220.914-179.086 400-400 400S113 733.914 113 513s179.086-400 400-400 400 179.086 400 400Z"
          stroke="currentColor"
          strokeOpacity="0.25"
        />
        <path
          d="M913 513c0 220.914-179.086 400-400 400"
          stroke={`url(#${id}-g2)`}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient
            id={`${id}-g2`}
            x1="913"
            y1="513"
            x2="913"
            y2="913"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="currentColor" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
