import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { DollarSign, TrendingUp, Users, Wallet } from "lucide-react";
import { RevenueTrendCard } from "@/components/admin/dashboard/revenue-trend-card";
import { StatTile } from "@/components/admin/dashboard/stat-tile";
import { UserGrowthTrendCard } from "@/components/admin/dashboard/user-growth-trend-card";
import { Layout, LayoutContent } from "@/components/layout";
import {
  AdminOverviewContentSkeleton,
  AdminOverviewPageSkeleton,
} from "@/components/skeletons/admin-route-skeletons";
import { formatMoney } from "@/lib/format-money";
import { api } from "@convex/_generated/api";

export const Route = createFileRoute("/admin/")({
  component: OverviewPage,
  pendingComponent: AdminOverviewPageSkeleton,
});

function OverviewPage() {
  const stats = useQuery(api.admin.queries.getStats, {});

  return (
    <Layout size="lg">
      <LayoutContent>
        <div className="flex flex-col gap-6">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

          {stats === undefined ? (
            <AdminOverviewContentSkeleton />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile
                  label="Total Users"
                  value={stats.totalUsers.toLocaleString()}
                  hint="Registered users"
                  icon={Users}
                />
                <StatTile
                  label="Paying Customers"
                  value={`${stats.activeSubscribers.toLocaleString()}${
                    stats.activeCapped ? "+" : ""
                  }`}
                  hint="Active entitlements"
                  icon={Wallet}
                />
                <StatTile
                  label="Estimated Revenue"
                  value={`${formatMoney(
                    stats.estimatedRevenueCents,
                    stats.currency,
                  )}${stats.activeCapped ? "+" : ""}`}
                  hint="Lifetime access revenue"
                  icon={DollarSign}
                />
                <StatTile
                  label="Conversion"
                  value={
                    stats.totalUsers > 0
                      ? `${((stats.activeSubscribers / stats.totalUsers) * 100).toFixed(1)}%`
                      : "0.0%"
                  }
                  hint="paying / total users"
                  icon={TrendingUp}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <RevenueTrendCard
                  data={stats.revenueHistory}
                  currency={stats.currency}
                  capped={stats.revenueHistoryCapped}
                />
                <UserGrowthTrendCard
                  data={stats.userGrowth}
                  sampled={stats.userHistoryCapped}
                />
              </div>
            </>
          )}
        </div>
      </LayoutContent>
    </Layout>
  );
}
