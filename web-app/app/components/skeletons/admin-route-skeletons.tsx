import type { ReactNode } from "react";
import { Layout, LayoutContent } from "@/components/layout";
import { SidebarShellSkeleton } from "@/components/shell/sidebar-shell-skeleton";
import { SkeletonCard } from "@/components/skeletons/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

function AdminLayoutSkeletonFrame({ children }: { children: ReactNode }) {
  return (
    <Layout size="lg">
      <LayoutContent>
        <div className="flex flex-col gap-6">{children}</div>
      </LayoutContent>
    </Layout>
  );
}

export function AdminShellRouteSkeleton() {
  return (
    <SidebarShellSkeleton sectionLabelWidth="w-16">
      <AdminOverviewContentSkeleton />
    </SidebarShellSkeleton>
  );
}

export function AdminOverviewPageSkeleton() {
  return (
    <AdminLayoutSkeletonFrame>
      <AdminOverviewContentSkeleton />
    </AdminLayoutSkeletonFrame>
  );
}

export function AdminOverviewContentSkeleton() {
  return (
    <>
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </>
  );
}

export function AdminUsersPageSkeleton() {
  return (
    <AdminLayoutSkeletonFrame>
      <AdminTableHeaderSkeleton titleWidth="w-24" filterCount={4} />
      <AdminTableSkeleton columns={5} />
    </AdminLayoutSkeletonFrame>
  );
}

export function AdminPaymentsPageSkeleton() {
  return (
    <AdminLayoutSkeletonFrame>
      <AdminTableHeaderSkeleton titleWidth="w-32" filterCount={3} />
      <AdminTableSkeleton columns={6} />
    </AdminLayoutSkeletonFrame>
  );
}

export function AdminUserDetailPageSkeleton() {
  return (
    <AdminLayoutSkeletonFrame>
      <Skeleton className="h-8 w-44" />
      <div className="flex items-start gap-4 rounded-xl border bg-card p-4">
        <Skeleton className="size-14 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
      </div>
      <Skeleton className="h-44 rounded-xl" />
    </AdminLayoutSkeletonFrame>
  );
}

export function AdminPaymentDetailPageSkeleton() {
  return (
    <AdminLayoutSkeletonFrame>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonCard contentLines={5} />
        <SkeletonCard contentLines={6} />
      </div>
      <SkeletonCard contentLines={1} />
    </AdminLayoutSkeletonFrame>
  );
}

function AdminTableHeaderSkeleton({
  titleWidth,
  filterCount,
}: {
  titleWidth: string;
  filterCount: number;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <Skeleton className={`h-8 ${titleWidth}`} />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: filterCount }).map((_, index) => (
          <Skeleton
            key={index}
            className={
              index === 0
                ? "h-9 w-64 max-w-full rounded-lg"
                : "h-9 w-28 rounded-lg"
            }
          />
        ))}
      </div>
    </>
  );
}

function AdminTableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div
        className="grid gap-4 border-b px-4 py-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-20" />
        ))}
      </div>
      <div className="divide-y">
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4 px-4 py-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <Skeleton
                key={columnIndex}
                className={columnIndex === 0 ? "h-4 w-40" : "h-4 w-20"}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
