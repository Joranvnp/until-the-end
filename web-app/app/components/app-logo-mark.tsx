import type { ComponentPropsWithoutRef } from "react";
import { LogoSvg } from "@/components/logo-svg";
import { cn } from "@/lib/utils";

type AppLogoMarkProps = ComponentPropsWithoutRef<"span"> & {
  size?: number;
};

export function AppLogoMark({
  className,
  size = 32,
  ...props
}: AppLogoMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-foreground text-background shadow-sm",
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      <LogoSvg size={Math.round(size * 0.625)} />
    </span>
  );
}
