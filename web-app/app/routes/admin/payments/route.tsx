import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminPaymentsPageSkeleton } from "@/components/skeletons/admin-route-skeletons";

// Layout route for /admin/payments. The list lives in `payments.index.tsx` and
// the detail in `payments.$entitlementId.tsx`; both render through this Outlet.
export const Route = createFileRoute("/admin/payments")({
  component: () => <Outlet />,
  pendingComponent: AdminPaymentsPageSkeleton,
});
