import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import {
  PaymentSourceBadge,
  PaymentStatusBadge,
} from "@/components/admin/badges";
import { EntitlementActions } from "@/components/admin/user-detail/entitlement-actions";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/format-money";
import { api } from "@convex/_generated/api";
import { SiteConfig } from "@site-config";

type Entitlement = FunctionReturnType<
  typeof api.admin.queries.getUserDetail
>["entitlements"][number];

export function PaymentsCard({ entitlements }: { entitlements: Entitlement[] }) {
  if (entitlements.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-muted-foreground flex min-h-32 flex-col items-center justify-center gap-1 py-8 text-center text-sm">
            <p className="text-foreground font-medium">No payments</p>
            <p>This user has never purchased.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Product</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="pr-4 text-right">Manage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entitlements.map((e) => (
            <TableRow key={e._id}>
              <TableCell className="pl-4">
                <Link
                  to="/admin/payments/$entitlementId"
                  params={{ entitlementId: e._id }}
                  className="font-medium hover:underline"
                >
                  {e.productId}
                </Link>
                <div className="text-muted-foreground font-mono text-xs">
                  {e.transactionId ?? "—"}
                </div>
              </TableCell>
              <TableCell>
                <PaymentSourceBadge source={e.source} />
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={e.status} />
              </TableCell>
              <TableCell className="tabular-nums">
                {formatMoney(
                  SiteConfig.payment.priceAmount,
                  SiteConfig.payment.currency,
                )}
              </TableCell>
              <TableCell className="pr-4 text-right">
                <EntitlementActions entitlement={e} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
