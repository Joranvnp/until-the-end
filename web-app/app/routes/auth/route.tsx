import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteConfig } from "@site-config";
import { AuthCenteredRouteSkeleton } from "@/components/skeletons/auth-route-skeletons";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `${SiteConfig.title} Auth` },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => <Outlet />,
  pendingComponent: AuthCenteredRouteSkeleton,
});
