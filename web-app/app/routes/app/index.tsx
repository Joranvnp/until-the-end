import { createFileRoute, Link } from "@tanstack/react-router";
import { useAction, useQuery } from "convex/react";
import {
  ArrowUpRight,
  CreditCard,
  Loader2,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SiteConfig } from "@site-config";
import { Button } from "@/components/ui/button";
import { AppHomePageSkeleton } from "@/components/skeletons/user-route-skeletons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@convex/_generated/api";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: `${SiteConfig.title} App` },
      {
        name: "description",
        content: `Signed-in web app for ${SiteConfig.title}`,
      },
    ],
  }),
  component: AppHomePage,
  pendingComponent: AppHomePageSkeleton,
});

function AppHomePage() {
  const entitlement = useQuery(api.payments.entitlements.getMine, {});
  const createCheckoutSession = useAction(
    api.payments.stripe.createCheckoutSession,
  );
  const confirmCheckoutSession = useAction(
    api.payments.stripe.confirmCheckoutSession,
  );
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get(
      "checkout_session_id",
    );
    if (!sessionId) return;

    let cancelled = false;
    setCheckoutLoading(true);
    confirmCheckoutSession({ sessionId })
      .then((result) => {
        if (!cancelled && !result.paid) {
          setError("Stripe has not marked this payment as paid yet.");
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "Unable to confirm Stripe checkout.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCheckoutLoading(false);
          window.history.replaceState({}, "", "/app");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [confirmCheckoutSession]);

  const handleWebCheckout = async () => {
    if (checkoutLoading) return;
    setCheckoutLoading(true);
    setError(null);
    try {
      const { url } = await createCheckoutSession({
        origin: window.location.origin,
      });
      window.location.href = url;
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Unable to start Stripe checkout.",
      );
      setCheckoutLoading(false);
    }
  };

  const loadingEntitlement = entitlement === undefined;
  const active = entitlement?.active ?? false;

  if (loadingEntitlement) {
    return <AppHomePageSkeleton />;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to {SiteConfig.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in with the same account used by the iOS and Android app.
        </p>
      </div>

      {!active ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CreditCard className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="text-base font-semibold">Unlock {SiteConfig.title}</p>
                <p className="text-sm text-muted-foreground">
                  One payment of{" "}
                  <span className="font-medium text-foreground">
                    {SiteConfig.payment.priceDisplay}
                  </span>{" "}
                  unlocks the same account across web, iOS, and Android — lifetime
                  access.
                </p>
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>
            <Button
              size="lg"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => void handleWebCheckout()}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CreditCard className="size-4" />
              )}
              Continue with Stripe
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Sparkles className="size-6" />
          </span>
          <h2 className="mt-4 text-base font-medium">Your blank starting point</h2>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            This is where your product lives. Replace this screen with your own
            home experience — the auth, payments, and account plumbing is already
            wired up.
          </p>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="size-4 text-primary" />
                Mobile companion
              </CardTitle>
              <CardDescription>
                Keep the mobile app installed for onboarding, paywall, and native
                features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                render={
                  <a
                    href={SiteConfig.urls.appStore}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <Smartphone className="size-4" />
                Download mobile app
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Next steps</CardTitle>
              <CardDescription>
                Get the boilerplate ready for your product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="ghost"
                className="w-full justify-between"
                render={<Link to="/account" />}
              >
                Review your account
                <ArrowUpRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
