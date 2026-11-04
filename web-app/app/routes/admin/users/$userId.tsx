import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft, UserX } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { AdminInlineState } from "@/components/admin/state";
import { EmailCard } from "@/components/admin/user-detail/email-card";
import { NameCard } from "@/components/admin/user-detail/name-card";
import { PaymentsCard } from "@/components/admin/user-detail/payments-card";
import { UserHeader } from "@/components/admin/user-detail/user-header";
import { UserMetaSidebar } from "@/components/admin/user-detail/user-meta-sidebar";
import { AdminUserProviders } from "@/components/admin/user-providers";
import { AdminUserSessions } from "@/components/admin/user-sessions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout, LayoutContent } from "@/components/layout";
import { AdminUserDetailPageSkeleton } from "@/components/skeletons/admin-route-skeletons";
import { api } from "@convex/_generated/api";

export const Route = createFileRoute("/admin/users/$userId")({
  component: UserDetailPage,
  errorComponent: () => <UserDetailError />,
  pendingComponent: AdminUserDetailPageSkeleton,
});

function UserDetailPage() {
  const { userId } = Route.useParams();
  const data = useQuery(
    api.admin.queries.getUserDetail,
    userId ? { userId: userId as Id<"users"> } : "skip",
  );

  if (!data) return <AdminUserDetailPageSkeleton />;

  const { user, entitlements, lastSignInAt } = data;
  const hasActivePlan = entitlements.some((e) => e.status === "active");

  return (
    <Layout size="lg">
      <LayoutContent>
        <div className="flex flex-col gap-6">
          <Link
            to="/admin/users"
            className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Users
          </Link>

          <UserHeader user={user} />

          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
            </TabsList>

            <div className="mt-6 flex flex-col items-start gap-8 lg:flex-row">
              <div className="min-w-0 flex-1 px-px pb-px">
                <TabsContent
                  value="profile"
                  className="mt-0 flex flex-col gap-6"
                >
                  <NameCard
                    key={`${user._id}-name`}
                    userId={user._id}
                    defaultName={user.name ?? ""}
                  />
                  <EmailCard
                    key={`${user._id}-email`}
                    userId={user._id}
                    defaultEmail={user.email}
                  />
                </TabsContent>

                <TabsContent value="payments" className="mt-0">
                  <PaymentsCard entitlements={entitlements} />
                </TabsContent>

                <TabsContent value="providers" className="mt-0">
                  <AdminUserProviders userId={user._id} />
                </TabsContent>

                <TabsContent value="sessions" className="mt-0">
                  <AdminUserSessions userId={user._id} />
                </TabsContent>
              </div>

              <UserMetaSidebar
                user={user}
                hasActivePlan={hasActivePlan}
                lastSignInAt={lastSignInAt}
              />
            </div>
          </Tabs>
        </div>
      </LayoutContent>
    </Layout>
  );
}

function UserDetailError() {
  return (
    <Layout size="lg">
      <LayoutContent>
        <AdminInlineState
          icon={<UserX />}
          title="User not found"
          description="This user may have been deleted, or the link is no longer valid."
          actions={
            <Button
              variant="outline"
              size="sm"
              render={<Link to="/admin/users" />}
            >
              <ArrowLeft className="size-4" /> Back to users
            </Button>
          }
        />
      </LayoutContent>
    </Layout>
  );
}
