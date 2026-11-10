import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const Layout = ({
  size,
  className,
  ...props
}: ComponentPropsWithoutRef<"div"> & { size?: "sm" | "default" | "lg" | "xl" }) => {
  return (
    <div
      {...props}
      className={cn(
        "m-auto mt-4 flex w-full max-w-4xl flex-wrap gap-4 px-4",
        {
          "max-w-[1400px]": size === "xl",
          "max-w-7xl": size === "lg",
          "max-w-3xl": size === "sm",
        },
        className,
      )}
    />
  );
};

export const LayoutHeader = ({ className, ...props }: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className={cn("flex w-full min-w-[200px] flex-col items-start gap-2 md:flex-1", className)}
    />
  );
};

export const LayoutTitle = ({ className, ...props }: ComponentPropsWithoutRef<"h1">) => {
  return (
    <h1 {...props} className={cn("text-2xl font-bold tracking-tight", className)} />
  );
};

export const LayoutDescription = ({ className, ...props }: ComponentPropsWithoutRef<"p">) => {
  return <p {...props} className={cn("text-sm text-muted-foreground", className)} />;
};

export const LayoutActions = ({ className, ...props }: ComponentPropsWithoutRef<"div">) => {
  return <div {...props} className={cn("flex items-center", className)} />;
};

export const LayoutContent = ({ className, ...props }: ComponentPropsWithoutRef<"div">) => {
  return <div {...props} className={cn("w-full", className)} />;
};
