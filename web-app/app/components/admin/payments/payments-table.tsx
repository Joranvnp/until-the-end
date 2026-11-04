import { Link, useNavigate } from "@tanstack/react-router";
import {
  PaymentSourceBadge,
  PaymentStatusBadge,
} from "@/components/admin/badges";
import type { ListedPayment } from "@/components/admin/payments/use-admin-payments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/format-money";
import { SiteConfig } from "@site-config";

export function PaymentsTable({ payments }: { payments: ListedPayment[] }) {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Customer</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Transaction</TableHead>
            <TableHead className="pr-4 text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => (
            <TableRow
              key={p._id}
              className="cursor-pointer"
              onClick={() =>
                navigate({
                  to: "/admin/payments/$entitlementId",
                  params: { entitlementId: p._id },
                })
              }
            >
              <TableCell className="max-w-0 pl-4">
                <Link
                  to="/admin/payments/$entitlementId"
                  params={{ entitlementId: p._id }}
                  className="font-medium hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {p.userEmail || "—"}
                </Link>
                <div className="text-muted-foreground truncate text-xs">
                  {p.productId}
                </div>
              </TableCell>
              <TableCell>
                <PaymentSourceBadge source={p.source} />
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={p.status} />
              </TableCell>
              <TableCell className="tabular-nums">
                {formatMoney(
                  SiteConfig.payment.priceAmount,
                  SiteConfig.payment.currency,
                )}
              </TableCell>
              <TableCell className="text-muted-foreground max-w-[12rem] truncate font-mono text-xs">
                {p.transactionId ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground pr-4 text-right">
                {formatDate(p.createdAt)}
              </TableCell>
            </TableRow>
          ))}
          {payments.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-muted-foreground h-24 text-center"
              >
                No payments found.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
