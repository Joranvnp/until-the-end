import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { SiteConfig } from "@site-config";
import { NotFoundPage } from "@/components/not-found-page";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";
import globalsCss from "@/styles/globals.css?url";

function convexUrlFromEnv(): string | undefined {
  const a = import.meta.env.VITE_CONVEX_URL?.trim();
  const b = import.meta.env.VITE_EXPO_PUBLIC_CONVEX_URL?.trim();
  return a || b || undefined;
}

const convexUrl = convexUrlFromEnv();
const convexReactClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

function MissingConvexUrl() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <div className="max-w-lg space-y-3 rounded-xl border border-dashed p-6">
        <h1 className="text-lg font-semibold">Convex URL not found</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Add <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">VITE_CONVEX_URL</code>{" "}
          in <code className="font-mono text-xs">.env.local</code>, then restart the dev server.
        </p>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    links: [
      { rel: "stylesheet", href: globalsCss },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-icon.png" },
    ],
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SiteConfig.title },
      { name: "description", content: SiteConfig.description },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundPage,
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="system">
          <TooltipProvider>
            <AppProviders />
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}

function AppProviders() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const needsConvex =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/app") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/auth");

  if (!convexReactClient) {
    return needsConvex ? <MissingConvexUrl /> : <Outlet />;
  }

  return (
    <ConvexBetterAuthProvider client={convexReactClient} authClient={authClient}>
      <Outlet />
    </ConvexBetterAuthProvider>
  );
}
