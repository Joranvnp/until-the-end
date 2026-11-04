import { ExternalLink, Loader2, WalletCards } from "lucide-react";
import type { PlanActions } from "@/components/account/use-account-plan-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type AccountEntitlement = {
  source?: string;
  status?: string;
  grantedAt?: number;
  stripeCustomerId?: string;
};

const sourceLabels: Record<string, string> = {
  apple_iap: "Apple App Store",
  google_play: "Google Play",
  stripe: "Stripe",
  dev: "Developer grant",
};

function formatDate(timestamp: number | undefined) {
  if (!timestamp) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(timestamp),
  );
}

function statusLabel(status: string | undefined) {
  if (!status) return "Free";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function PaymentInvoicesCard({
  entitlement,
  hasStripePortal,
  actions,
}: {
  entitlement: AccountEntitlement | null | undefined;
  hasStripePortal: boolean;
  actions: PlanActions;
}) {
  const source = entitlement?.source
    ? sourceLabels[entitlement.source] ?? entitlement.source
    : "None";
  const hasPurchaseRecord = Boolean(entitlement?.source || entitlement?.grantedAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WalletCards className="size-4 text-primary" />
          Payment & invoices
        </CardTitle>
        <CardDescription>
          Stripe purchases expose an invoice portal. App Store and Google Play
          purchases are managed by the store account.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <PlanDetail label="Current status" value={statusLabel(entitlement?.status)} />
        <PlanDetail label="Payment source" value={source} />
        <PlanDetail
          label={hasPurchaseRecord ? "Purchased" : "Invoices"}
          value={
            hasPurchaseRecord
              ? formatDate(entitlement?.grantedAt)
              : "No invoices yet"
          }
        />
      </CardContent>
      <CardFooter className="justify-between gap-3 max-sm:flex-col max-sm:items-start">
        <PlanActionMessage actions={actions} hasStripePortal={hasStripePortal} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void actions.openInvoicePortal()}
          disabled={!hasStripePortal || actions.portalLoading}
        >
          {actions.portalLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ExternalLink className="size-4" />
          )}
          Open portal
        </Button>
      </CardFooter>
    </Card>
  );
}

function PlanActionMessage({
  actions,
  hasStripePortal,
}: {
  actions: PlanActions;
  hasStripePortal: boolean;
}) {
  if (actions.message) {
    return (
      <p className="text-sm text-emerald-600" role="status" aria-live="polite">
        {actions.message}
      </p>
    );
  }

  if (actions.error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {actions.error}
      </p>
    );
  }

  return (
    <p className="text-xs text-muted-foreground">
      {hasStripePortal
        ? "Use the invoice portal for receipts and billing details."
        : "Invoice portal appears after a Stripe purchase."}
    </p>
  );
}

function PlanDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium">{value}</p>
    </div>
  );
}
