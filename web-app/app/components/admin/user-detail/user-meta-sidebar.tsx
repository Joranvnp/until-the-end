import type { FunctionReturnType } from "convex/server";
import { Copy, Shield } from "lucide-react";
import { toast } from "sonner";
import { PlanBadge, UserStatusBadge } from "@/components/admin/badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/format-money";
import { formatRelativeTime } from "@/lib/format-time";
import { api } from "@convex/_generated/api";

type AdminUser = FunctionReturnType<
  typeof api.admin.queries.getUserDetail
>["user"];

export function UserMetaSidebar({
  user,
  hasActivePlan,
  lastSignInAt,
}: {
  user: AdminUser;
  hasActivePlan: boolean;
  lastSignInAt: number | null;
}) {
  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="sticky top-6 flex flex-col gap-5">
        <MetaBlock label="User ID">
          <div className="flex items-center gap-1">
            <code className="truncate font-mono text-sm">
              {user._id.slice(0, 10)}…{user._id.slice(-6)}
            </code>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                void navigator.clipboard.writeText(user._id);
                toast.success("User ID copied");
              }}
              aria-label="Copy user ID"
            >
              <Copy />
            </Button>
          </div>
        </MetaBlock>

        <Separator />

        <MetaBlock label="Status">
          <div className="flex flex-wrap items-center gap-2">
            <UserStatusBadge user={user} />
            {user.isAdmin ? (
              <Badge variant="secondary" className="gap-1">
                <Shield className="size-3" /> Admin
              </Badge>
            ) : null}
          </div>
        </MetaBlock>

        <Separator />

        <MetaBlock label="Plan">
          <PlanBadge active={hasActivePlan} />
        </MetaBlock>

        <Separator />

        <MetaBlock label="Last sign-in">
          <p className="text-sm font-medium">
            {lastSignInAt ? formatRelativeTime(lastSignInAt) : "Never"}
          </p>
          {lastSignInAt ? (
            <p className="text-muted-foreground text-xs">
              {formatDate(lastSignInAt)}
            </p>
          ) : null}
        </MetaBlock>

        <Separator />

        <MetaBlock label="Joined">
          <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
          <p className="text-muted-foreground text-xs">
            {formatRelativeTime(user.createdAt)}
          </p>
        </MetaBlock>
      </div>
    </aside>
  );
}

function MetaBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}
