import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function SidebarShellFrame({
  sidebar,
  header,
  children,
  contentClassName,
}: {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <SidebarProvider>
      {sidebar}
      <SidebarInset className="border-border border">
        <header className="flex h-16 shrink-0 items-center gap-2">
          {header}
        </header>
        <div
          className={cn(
            "flex flex-1 flex-col gap-4 p-4 pt-0",
            contentClassName,
          )}
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
