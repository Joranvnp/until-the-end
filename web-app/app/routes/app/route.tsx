import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { AppShellRouteSkeleton } from "@/components/skeletons/user-route-skeletons";

export const Route = createFileRoute("/app")({
  component: AuthenticatedAppLayout,
  pendingComponent: AppShellRouteSkeleton,
});

function AuthenticatedAppLayout() {
  return (
    <AuthenticatedShell callbackUrl="/app">
      <Outlet />
    </AuthenticatedShell>
  );
}
