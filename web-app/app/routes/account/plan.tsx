import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { CurrentPlanCard } from "@/components/account/current-plan-card";
import { PaymentInvoicesCard } from "@/components/account/payment-invoices-card";
import { useAccountPlanActions } from "@/components/account/use-account-plan-actions";
import { AccountPageShell } from "@/components/shell/account-page-shell";
import { AccountPlanPageSkeleton } from "@/components/skeletons/user-route-skeletons";
import { api } from "@convex/_generated/api";

export const Route = createFileRoute("/account/plan")({
  component: AccountPlanPage,
  pendingComponent: AccountPlanPageSkeleton,
});

function AccountPlanPage() {
  const entitlementResult = useQuery(api.payments.entitlements.getMine, {});
  const actions = useAccountPlanActions();

  if (entitlementResult === undefined) {
    return <AccountPlanPageSkeleton />;
  }

  const entitlement = entitlementResult.entitlement;
  const active = entitlementResult.active;
  const hasStripePortal = Boolean(entitlement?.stripeCustomerId);

  return (
    <AccountPageShell
      title="Plan"
      description="Review access, invoices, and billing for this account."
    >
      <div className="flex flex-col gap-6">
        <CurrentPlanCard
          active={active}
          hasStripePortal={hasStripePortal}
          actions={actions}
        />
        <PaymentInvoicesCard
          entitlement={entitlement}
          hasStripePortal={hasStripePortal}
          actions={actions}
        />
      </div>
    </AccountPageShell>
  );
}
