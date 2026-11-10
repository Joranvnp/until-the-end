import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "danger";

/**
 * Full-screen centered state card used by the admin gate and error boundary.
 * One source of truth for the "access denied / connection error / crash" look.
 */
export function AdminFullScreenState({
  icon,
  title,
  description,
  tone = "neutral",
  actions,
  footer,
}: {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  tone?: Tone;
  actions?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="bg-background flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-card flex flex-col items-center rounded-2xl border p-8 text-center shadow-sm">
          <StateIcon tone={tone}>{icon}</StateIcon>
          <h1 className="mt-5 text-lg font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {description}
            </p>
          ) : null}
          {actions ? (
            <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              {actions}
            </div>
          ) : null}
        </div>
        {footer ? (
          <div className="text-muted-foreground mt-4 text-center text-xs">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** In-page empty / error block for use inside the admin layout. */
export function AdminInlineState({
  icon,
  title,
  description,
  actions,
}: {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
      <StateIcon tone="neutral" size="sm">
        {icon}
      </StateIcon>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminLoadingScreen({ label }: { label?: string }) {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-3">
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
      {label ? <p className="text-muted-foreground text-sm">{label}</p> : null}
    </div>
  );
}

function StateIcon({
  tone,
  size = "md",
  children,
}: {
  tone: Tone;
  size?: "sm" | "md";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl",
        size === "md"
          ? "size-12 [&_svg:not([class*='size-'])]:size-6"
          : "size-11 [&_svg:not([class*='size-'])]:size-5",
        tone === "danger"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-foreground",
      )}
    >
      {children}
    </div>
  );
}
