import { Navigate, createFileRoute } from "@tanstack/react-router";
import { AccountPlanPageSkeleton } from "@/components/skeletons/user-route-skeletons";

export const Route = createFileRoute("/account/access")({
  component: AccessPage,
  pendingComponent: AccountPlanPageSkeleton,
});

function AccessPage() {
  return <Navigate to="/account/plan" replace />;
}
