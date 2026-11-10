import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AuthCenteredRouteSkeleton } from "@/components/skeletons/auth-route-skeletons";
import { DEFAULT_AUTH_CALLBACK_URL } from "@/lib/auth-utils";

export const Route = createFileRoute("/auth/")({
  component: AuthIndexRedirect,
  pendingComponent: AuthCenteredRouteSkeleton,
});

function AuthIndexRedirect() {
  return (
    <Navigate
      to="/auth/signin"
      search={{ callbackUrl: DEFAULT_AUTH_CALLBACK_URL }}
      replace
    />
  );
}
