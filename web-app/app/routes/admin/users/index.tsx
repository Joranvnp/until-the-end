import { createFileRoute } from "@tanstack/react-router";
import { LoadMoreButton } from "@/components/admin/load-more-button";
import { useAdminUsers } from "@/components/admin/users/use-admin-users";
import { UsersFilters } from "@/components/admin/users/users-filters";
import { UsersTable } from "@/components/admin/users/users-table";
import { Layout, LayoutContent } from "@/components/layout";
import { AdminUsersPageSkeleton } from "@/components/skeletons/admin-route-skeletons";

export const Route = createFileRoute("/admin/users/")({
  component: UsersPage,
  pendingComponent: AdminUsersPageSkeleton,
});

function UsersPage() {
  const {
    searchInput,
    setSearchInput,
    role,
    setRole,
    status,
    setStatus,
    results,
    loadStatus,
    loadMore,
  } = useAdminUsers();

  if (loadStatus === "LoadingFirstPage") {
    return <AdminUsersPageSkeleton />;
  }

  return (
    <Layout size="lg">
      <LayoutContent>
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage app accounts, roles, and access status.
            </p>
          </div>

          <UsersFilters
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            role={role}
            onRoleChange={setRole}
            status={status}
            onStatusChange={setStatus}
          />

          <UsersTable users={results} />

          <LoadMoreButton loadStatus={loadStatus} onLoadMore={() => loadMore()} />
        </div>
      </LayoutContent>
    </Layout>
  );
}
