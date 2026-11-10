import { createFileRoute } from "@tanstack/react-router";
import { LoadMoreButton } from "@/components/admin/load-more-button";
import { PaymentsFilters } from "@/components/admin/payments/payments-filters";
import { PaymentsTable } from "@/components/admin/payments/payments-table";
import { Layout, LayoutContent } from "@/components/layout";
import { AdminPaymentsPageSkeleton } from "@/components/skeletons/admin-route-skeletons";
import { useAdminPayments } from "@/components/admin/payments/use-admin-payments";

export const Route = createFileRoute("/admin/payments/")({
  component: PaymentsPage,
  pendingComponent: AdminPaymentsPageSkeleton,
});

function PaymentsPage() {
  const { status, setStatus, source, setSource, results, loadStatus, loadMore } =
    useAdminPayments();

  if (loadStatus === "LoadingFirstPage") {
    return <AdminPaymentsPageSkeleton />;
  }

  return (
    <Layout size="lg">
      <LayoutContent>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
            <span className="text-muted-foreground text-sm">
              {`${results.length}${loadStatus === "Exhausted" ? "" : "+"} shown`}
            </span>
          </div>

          <PaymentsFilters
            status={status}
            onStatusChange={setStatus}
            source={source}
            onSourceChange={setSource}
          />

          <PaymentsTable payments={results} />

          <LoadMoreButton loadStatus={loadStatus} onLoadMore={loadMore} />
        </div>
      </LayoutContent>
    </Layout>
  );
}
