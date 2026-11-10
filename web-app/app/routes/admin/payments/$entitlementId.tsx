import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, ExternalLink, Receipt } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import {
  PaymentSourceBadge,
  PaymentStatusBadge,
} from "@/components/admin/badges";
import { ConfirmAction } from "@/components/confirm-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Layout, LayoutContent } from "@/components/layout";
import { AdminInlineState } from "@/components/admin/state";
import { AdminPaymentDetailPageSkeleton } from "@/components/skeletons/admin-route-skeletons";
import { formatDateTime, formatMoney } from "@/lib/format-money";
import { api } from "@convex/_generated/api";
import { SiteConfig } from "@site-config";

export const Route = createFileRoute("/admin/payments/$entitlementId")({
  component: PaymentDetailPage,
  errorComponent: () => <PaymentDetailError />,
  pendingComponent: AdminPaymentDetailPageSkeleton,
});

function PaymentDetailPage() {
  const { entitlementId } = Route.useParams();
  const data = useQuery(
    api.admin.queries.getPaymentDetail,
    entitlementId
      ? { entitlementId: entitlementId as Id<"entitlements"> }
      : "skip",
  );
  const setStatus = useMutation(api.admin.mutations.setEntitlementStatus);

  if (!data) return <AdminPaymentDetailPageSkeleton />;

  const { entitlement, user } = data;
  const isActive = entitlement.status === "active";

  const stripeUrl =
    entitlement.source === "stripe" && entitlement.stripePaymentIntentId
      ? `https://dashboard.stripe.com/${
          entitlement.providerEnvironment === "test" ? "test/" : ""
        }payments/${encodeURIComponent(entitlement.stripePaymentIntentId)}`
      : null;

  return (
    <Layout size="lg">
      <LayoutContent>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              render={<Link to="/admin/payments" />}
            >
              <ArrowLeft className="size-4" /> Payments
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <h1 className="text-2xl font-semibold tracking-tight">Payment</h1>
            <PaymentStatusBadge status={entitlement.status} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row label="Customer">
                  {user ? (
                    <Link
                      to="/admin/users/$userId"
                      params={{ userId: user._id }}
                      className="font-medium hover:underline"
                    >
                      {user.email || "—"}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Unknown</span>
                  )}
                </Row>
                <Separator />
                <Row label="Amount">
                  <span className="tabular-nums">
                    {formatMoney(
                      SiteConfig.payment.priceAmount,
                      SiteConfig.payment.currency,
                    )}
                  </span>
                </Row>
                <Separator />
                <Row label="Source">
                  <PaymentSourceBadge source={entitlement.source} />
                </Row>
                <Separator />
                <Row label="Product">
                  <span className="font-mono text-xs">
                    {entitlement.productId}
                  </span>
                </Row>
                <Separator />
                <Row label="Entitlement key">
                  <span className="font-mono text-xs">{entitlement.key}</span>
                </Row>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transaction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row label="Transaction ID">
                  <MonoValue value={entitlement.transactionId} />
                </Row>
                <Separator />
                <Row label="Environment">
                  <MonoValue value={entitlement.providerEnvironment} />
                </Row>
                {entitlement.stripeCustomerId ? (
                  <>
                    <Separator />
                    <Row label="Stripe customer">
                      <MonoValue value={entitlement.stripeCustomerId} />
                    </Row>
                  </>
                ) : null}
                {entitlement.stripePaymentIntentId ? (
                  <>
                    <Separator />
                    <Row label="Payment intent">
                      {stripeUrl ? (
                        <a
                          href={stripeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-xs hover:underline"
                        >
                          {entitlement.stripePaymentIntentId}
                          <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <MonoValue value={entitlement.stripePaymentIntentId} />
                      )}
                    </Row>
                  </>
                ) : null}
                <Separator />
                <Row label="Created">
                  <span className="text-sm">
                    {formatDateTime(entitlement.createdAt)}
                  </span>
                </Row>
                <Separator />
                <Row label="Updated">
                  <span className="text-sm">
                    {formatDateTime(entitlement.updatedAt)}
                  </span>
                </Row>
                {entitlement.grantedAt ? (
                  <>
                    <Separator />
                    <Row label="Granted">
                      <span className="text-sm">
                        {formatDateTime(entitlement.grantedAt)}
                      </span>
                    </Row>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manage</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {isActive ? (
                <>
                  <ConfirmAction
                    trigger={<Button variant="outline">Revoke access</Button>}
                    title="Revoke entitlement?"
                    description="The user immediately loses access. This does not issue a refund."
                    confirmLabel="Revoke"
                    onConfirm={() =>
                      setStatus({
                        entitlementId: entitlement._id,
                        status: "revoked",
                      })
                    }
                  />
                  <ConfirmAction
                    trigger={<Button variant="destructive">Mark refunded</Button>}
                    title="Mark as refunded?"
                    description="Records this purchase as refunded and removes access. Process the actual refund in Stripe / App Store separately."
                    confirmLabel="Mark refunded"
                    onConfirm={() =>
                      setStatus({
                        entitlementId: entitlement._id,
                        status: "refunded",
                      })
                    }
                  />
                </>
              ) : (
                <ConfirmAction
                  trigger={<Button variant="default">Reactivate access</Button>}
                  title="Reactivate entitlement?"
                  description="Restores access for this user."
                  confirmLabel="Reactivate"
                  confirmVariant="default"
                  onConfirm={() =>
                    setStatus({
                      entitlementId: entitlement._id,
                      status: "active",
                    })
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>
      </LayoutContent>
    </Layout>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="min-w-0 text-right break-all">{children}</div>
    </div>
  );
}

function MonoValue({ value }: { value?: string }) {
  if (!value) return <span className="text-muted-foreground text-sm">—</span>;
  return <span className="font-mono text-xs">{value}</span>;
}

function PaymentDetailError() {
  return (
    <Layout size="lg">
      <LayoutContent>
        <AdminInlineState
          icon={<Receipt />}
          title="Payment not found"
          description="This payment record may have been removed, or the link is out of date."
          actions={
            <Button
              variant="outline"
              size="sm"
              render={<Link to="/admin/payments" />}
            >
              <ArrowLeft className="size-4" /> Back to payments
            </Button>
          }
        />
      </LayoutContent>
    </Layout>
  );
}
