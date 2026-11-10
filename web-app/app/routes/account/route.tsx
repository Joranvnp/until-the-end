import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteConfig } from "@site-config";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { AccountShellRouteSkeleton } from "@/components/skeletons/user-route-skeletons";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: `${SiteConfig.title} Account` },
      { name: "description", content: `Account settings for ${SiteConfig.title}.` },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AccountLayout,
  pendingComponent: AccountShellRouteSkeleton,
});

function AccountLayout() {
  return (
    <AuthenticatedShell callbackUrl="/account">
      <Outlet />
    </AuthenticatedShell>
  );
}
