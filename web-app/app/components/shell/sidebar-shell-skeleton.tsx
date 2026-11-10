import type { ReactNode } from "react";
import { SidebarShellFrame } from "@/components/shell/sidebar-shell-frame";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

export function SidebarShellSkeleton({
  sectionLabelWidth = "w-20",
  children,
}: {
  sectionLabelWidth?: string;
  children: ReactNode;
}) {
  return (
    <SidebarShellFrame
      sidebar={<SkeletonSidebar sectionLabelWidth={sectionLabelWidth} />}
      header={<SkeletonHeader />}
      contentClassName="m-auto w-full max-w-7xl"
    >
      {children}
    </SidebarShellFrame>
  );
}

function SkeletonSidebar({ sectionLabelWidth }: { sectionLabelWidth: string }) {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex h-10 items-center gap-2 px-2">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="h-4 w-28" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Skeleton className={`h-3 ${sectionLabelWidth}`} />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex flex-col gap-1">
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-4/5 rounded-md" />
              <Skeleton className="h-8 w-3/5 rounded-md" />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 pb-1">
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="mx-2 h-12 rounded-lg" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function SkeletonHeader() {
  return (
    <div className="m-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4">
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <Skeleton className="hidden h-8 w-48 rounded-lg sm:block" />
    </div>
  );
}
