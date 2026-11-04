import { useConvexAuth, useMutation } from "convex/react";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { RedirectToCallback } from "@/components/auth/redirect-to-callback";
import { UserShell } from "@/components/shell/user-shell";
import {
  AccountChangeEmailPageSkeleton,
  AccountIdentityPageSkeleton,
  AccountPlanPageSkeleton,
  AccountProfilePageSkeleton,
  AccountShellRouteSkeleton,
  AppHomePageSkeleton,
  AppShellRouteSkeleton,
} from "@/components/skeletons/user-route-skeletons";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { buildAuthSignInUrl, normalizeAuthCallbackUrl } from "@/lib/auth-utils";
import { api } from "@convex/_generated/api";

function AuthenticatedShellSkeleton({ pathname }: { pathname: string }) {
  return pathname.startsWith("/account") ? (
    <AccountShellRouteSkeleton />
  ) : (
    <AppShellRouteSkeleton />
  );
}

function AuthenticatedContentSkeleton({ pathname }: { pathname: string }) {
  if (
    pathname.startsWith("/account/plan") ||
    pathname.startsWith("/account/access")
  ) {
    return <AccountPlanPageSkeleton />;
  }
  if (pathname.startsWith("/account/identity")) {
    return <AccountIdentityPageSkeleton />;
  }
  if (pathname.startsWith("/account/change-email")) {
    return <AccountChangeEmailPageSkeleton />;
  }
  if (pathname.startsWith("/account")) {
    return <AccountProfilePageSkeleton />;
  }
  return <AppHomePageSkeleton />;
}

/**
 * Shared auth gate + chrome for every signed-in web surface (`/app`, `/account`).
 * Redirects signed-out users to `/auth/signin`, then renders the unified
 * sidebar shell once the Convex user row exists.
 */
export function AuthenticatedShell({
  callbackUrl = "/app",
  children,
}: {
  callbackUrl?: string;
  children: ReactNode;
}) {
  const location = useRouterState({ select: (state) => state.location });
  const pathname = location.pathname;
  const currentLocation = pathname
    ? `${pathname}${location.searchStr}${location.hash ? `#${location.hash}` : ""}`
    : callbackUrl;
  const authCallbackUrl = normalizeAuthCallbackUrl(currentLocation);
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { isAuthenticated: convexAuth, isLoading: convexLoading } =
    useConvexAuth();
  const ensureUser = useMutation(api.users.account.ensureUser);
  const hasInitialized = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!sessionPending) {
    hasInitialized.current = true;
  }

  useEffect(() => {
    if (!convexAuth || !session?.user) {
      setReady(false);
      setError(null);
      return;
    }
    let cancelled = false;
    ensureUser({})
      .then(() => {
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setReady(false);
          setError(
            e instanceof Error ? e.message : "Unable to prepare your account.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [convexAuth, ensureUser, session?.user]);

  const handleLogout = () => {
    void authClient.signOut();
  };

  if (!hasInitialized.current) {
    return <AuthenticatedShellSkeleton pathname={pathname} />;
  }

  if (!session?.user) {
    return (
      <>
        <RedirectToCallback callbackUrl={buildAuthSignInUrl(authCallbackUrl)} />
        <AuthenticatedShellSkeleton pathname={pathname} />
      </>
    );
  }

  // The session is confirmed by this point, so the chrome is safe to render
  // whatever Convex is doing; only the content waits on the socket.
  if (convexLoading) {
    return (
      <UserShell onLogout={handleLogout}>
        <AuthenticatedContentSkeleton pathname={pathname} />
      </UserShell>
    );
  }

  if (!convexAuth || error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <p className="text-sm text-destructive">
          {error ?? "Your session could not connect to Convex."}
        </p>
        <Button variant="outline" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <UserShell onLogout={handleLogout}>
      {ready ? children : <AuthenticatedContentSkeleton pathname={pathname} />}
    </UserShell>
  );
}
