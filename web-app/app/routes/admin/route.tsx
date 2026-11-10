import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { useConvexAuth, useMutation } from "convex/react";
import {
  Home,
  RefreshCw,
  ServerCrash,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/shell";
import { AdminFullScreenState } from "@/components/admin/state";
import { RedirectToCallback } from "@/components/auth/redirect-to-callback";
import { AdminShellRouteSkeleton } from "@/components/skeletons/admin-route-skeletons";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { buildAuthSignInUrl, normalizeAuthCallbackUrl } from "@/lib/auth-utils";
import { api } from "@convex/_generated/api";

export const Route = createFileRoute("/admin")({
  component: AuthenticatedLayout,
  errorComponent: AdminErrorBoundary,
  pendingComponent: AdminShellRouteSkeleton,
});

type AdminErrorKind = "denied" | "connection";

function AdminErrorBoundary({ error }: { error: Error }) {
  return (
    <AdminFullScreenState
      tone="danger"
      icon={<TriangleAlert />}
      title="Something went wrong"
      description="The admin dashboard hit an unexpected error and couldn't load this view."
      actions={
        <>
          <Button variant="outline" render={<Link to="/admin" />}>
            <Home className="size-4" /> Back to dashboard
          </Button>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="size-4" /> Reload
          </Button>
        </>
      }
      footer={
        error?.message ? (
          <code className="bg-muted text-muted-foreground inline-block max-w-full truncate rounded px-2 py-1 font-mono">
            {error.message}
          </code>
        ) : null
      }
    />
  );
}

function AuthenticatedLayout() {
  const location = useRouterState({ select: (state) => state.location });
  const callbackUrl = normalizeAuthCallbackUrl(
    `${location.pathname}${location.searchStr}${location.hash ? `#${location.hash}` : ""}`,
  );
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { isAuthenticated: convexAuth, isLoading: convexLoading } =
    useConvexAuth();
  const hasInitialized = useRef(false);
  const ensureAdminUser = useMutation(api.admin.auth.ensureAdminUser);
  const [adminReady, setAdminReady] = useState(false);
  const [adminError, setAdminError] = useState<AdminErrorKind | null>(null);

  if (!sessionPending) {
    hasInitialized.current = true;
  }

  useEffect(() => {
    if (!convexAuth || !session?.user) {
      setAdminReady(false);
      setAdminError(null);
      return;
    }
    let cancelled = false;
    ensureAdminUser({})
      .then(() => {
        if (!cancelled) {
          setAdminReady(true);
          setAdminError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          // ensureAdminUser throws "Not an admin" for non-allowlisted users.
          const raw = e instanceof Error ? e.message : "";
          setAdminError(raw.includes("Not an admin") ? "denied" : "connection");
          setAdminReady(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [convexAuth, session?.user, ensureAdminUser]);

  const handleLogout = async () => {
    await authClient.signOut();
  };

  if (!hasInitialized.current) return <AdminShellRouteSkeleton />;

  if (!session?.user) {
    return (
      <>
        <RedirectToCallback callbackUrl={buildAuthSignInUrl(callbackUrl)} />
        <AdminShellRouteSkeleton />
      </>
    );
  }

  if (convexLoading) return <AdminShellRouteSkeleton />;

  if (adminError === "denied") {
    return (
      <AdminFullScreenState
        icon={<ShieldAlert />}
        title="Admin access required"
        description={
          <>
            You're signed in as{" "}
            <span className="text-foreground font-medium">
              {session.user.email}
            </span>
            , but this account isn't on the admin allowlist. Switch to an admin
            account to continue.
          </>
        }
        actions={
          <>
            <Button variant="outline" render={<Link to="/app" />}>
              <Home className="size-4" /> Go to app
            </Button>
            <Button onClick={() => void handleLogout()}>Sign out</Button>
          </>
        }
      />
    );
  }

  if (!convexAuth || adminError === "connection") {
    return (
      <AdminFullScreenState
        tone="danger"
        icon={<ServerCrash />}
        title="Couldn't connect to the backend"
        description="The admin session couldn't reach Convex. This is usually temporary — try again in a moment."
        actions={
          <>
            <Button variant="outline" onClick={() => void handleLogout()}>
              Sign out
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="size-4" /> Try again
            </Button>
          </>
        }
      />
    );
  }

  if (!adminReady) return <AdminShellRouteSkeleton />;

  return (
    <AdminShell
      email={session.user.email ?? ""}
      onLogout={() => void handleLogout()}
    >
      <Outlet />
    </AdminShell>
  );
}
