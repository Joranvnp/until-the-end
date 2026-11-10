import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminUsersPageSkeleton } from "@/components/skeletons/admin-route-skeletons";

// Layout route for /admin/users. The list lives in `users.index.tsx` and the
// detail in `users.$userId.tsx`; both render through this Outlet so the detail
// page replaces the list instead of having nowhere to mount.
export const Route = createFileRoute("/admin/users")({
  component: () => <Outlet />,
  pendingComponent: AdminUsersPageSkeleton,
});
