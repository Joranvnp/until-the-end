import { Link } from "@tanstack/react-router";
import { Check, CreditCard, FileText, Loader2 } from "lucide-react";
import { SiteConfig } from "@site-config";
import type { PlanActions } from "@/components/account/use-account-plan-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const planFeatures = [
  "Lifetime access",
  "Web app access",
  "iOS and Android access",
  "Shared account identity",
];

export function CurrentPlanCard({
  active,
  hasStripePortal,
  actions,
}: {
  active: boolean;
  hasStripePortal: boolean;
  actions: PlanActions;
}) {
  return (
    <Card className="gap-4 lg:flex-row">
      <CardHeader className="flex-1">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Current plan
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Lifetime Plan</CardTitle>
            <Badge variant={active ? "secondary" : "outline"} className="gap-1">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  active ? "bg-emerald-500" : "bg-muted-foreground",
                )}
                aria-hidden="true"
              />
              {active ? "Active" : "Free"}
            </Badge>
          </div>
        </div>
        <CardDescription>
          One purchase unlocks {SiteConfig.title} across web, iOS, and Android
          for this account.
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          <PrimaryPlanAction
            active={active}
            hasStripePortal={hasStripePortal}
            actions={actions}
          />
          <Button variant="outline" render={<Link to="/app" />}>
            Open app
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-2">
        <ul className="grid gap-2 md:grid-cols-2">
          {planFeatures.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Check className="size-4 shrink-0 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function PrimaryPlanAction({
  active,
  hasStripePortal,
  actions,
}: {
  active: boolean;
  hasStripePortal: boolean;
  actions: PlanActions;
}) {
  if (active && hasStripePortal) {
    return (
      <Button
        type="button"
        onClick={() => void actions.openInvoicePortal()}
        disabled={actions.portalLoading}
      >
        {actions.portalLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FileText className="size-4" />
        )}
        Invoice portal
      </Button>
    );
  }

  if (active) {
    return (
      <Button type="button" disabled>
        Current plan
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={() => void actions.startCheckout()}
      disabled={actions.checkoutLoading}
    >
      {actions.checkoutLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <CreditCard className="size-4" />
      )}
      Continue with Stripe
    </Button>
  );
}
