import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ProfileEmailCard } from "@/components/account/profile-email-card";
import { ProfileNameCard } from "@/components/account/profile-name-card";
import { AccountPageShell } from "@/components/shell/account-page-shell";
import { AccountProfilePageSkeleton } from "@/components/skeletons/user-route-skeletons";
import { authClient } from "@/lib/auth-client";
import { api } from "@convex/_generated/api";

export const Route = createFileRoute("/account/")({
  component: ProfilePage,
  pendingComponent: AccountProfilePageSkeleton,
});

function ProfilePage() {
  const user = useQuery(api.users.account.getMe, {});
  const { data: session, isPending: sessionPending } = authClient.useSession();

  if (user === undefined || sessionPending) {
    return <AccountProfilePageSkeleton />;
  }

  if (!user || !session?.user) {
    return (
      <AccountPageShell
        title="Profile"
        description="This is the name visible across your account."
      >
        <p className="text-sm text-muted-foreground">
          Your account could not be loaded.
        </p>
      </AccountPageShell>
    );
  }

  return (
    <AccountPageShell
      title="Profile"
      description="Manage the profile shared by the web app and mobile app."
    >
      <div className="flex flex-col gap-6">
        <ProfileNameCard currentName={user.name ?? ""} />
        <ProfileEmailCard
          email={session.user.email ?? user.email}
          emailVerified={session.user.emailVerified === true}
        />
      </div>
    </AccountPageShell>
  );
}
