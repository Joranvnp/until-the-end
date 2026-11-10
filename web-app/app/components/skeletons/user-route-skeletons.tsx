import type { ReactNode } from "react";
import { SidebarShellSkeleton } from "@/components/shell/sidebar-shell-skeleton";
import { SkeletonCard } from "@/components/skeletons/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

function AccountPageSkeletonFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>
      {children}
    </div>
  );
}

export function AppShellRouteSkeleton() {
  return (
    <SidebarShellSkeleton sectionLabelWidth="w-20">
      <AppHomePageSkeleton />
    </SidebarShellSkeleton>
  );
}

export function AppHomePageSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Skeleton className="min-h-[280px] rounded-xl border border-dashed border-border bg-card/40" />
        <aside className="space-y-6">
          <SkeletonCard contentLines={1} />
          <SkeletonCard contentLines={1} />
        </aside>
      </div>
    </div>
  );
}

export function AccountShellRouteSkeleton() {
  return (
    <SidebarShellSkeleton sectionLabelWidth="w-24">
      <AccountProfilePageSkeleton />
    </SidebarShellSkeleton>
  );
}

export function AccountProfilePageSkeleton() {
  return (
    <AccountPageSkeletonFrame>
      <div className="flex flex-col gap-6">
        <SkeletonCard contentLines={1} footer />
        <SkeletonCard contentLines={2} footer />
      </div>
    </AccountPageSkeletonFrame>
  );
}

export function AccountPlanPageSkeleton() {
  return (
    <AccountPageSkeletonFrame>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </AccountPageSkeletonFrame>
  );
}

export function AccountIdentityPageSkeleton() {
  return (
    <AccountPageSkeletonFrame>
      <SkeletonCard contentLines={1} footer />
    </AccountPageSkeletonFrame>
  );
}

export function AccountChangeEmailPageSkeleton() {
  return (
    <AccountPageSkeletonFrame>
      <SkeletonCard contentLines={4} footer />
    </AccountPageSkeletonFrame>
  );
}
