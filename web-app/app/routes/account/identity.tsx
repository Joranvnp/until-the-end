import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Check, Copy, Shield } from "lucide-react";
import { useState } from "react";
import { AccountPageShell } from "@/components/shell/account-page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccountIdentityPageSkeleton } from "@/components/skeletons/user-route-skeletons";
import { api } from "@convex/_generated/api";

export const Route = createFileRoute("/account/identity")({
  component: IdentityPage,
  pendingComponent: AccountIdentityPageSkeleton,
});

function IdentityPage() {
  const user = useQuery(api.users.account.getMe, {});
  const [copied, setCopied] = useState(false);

  if (user === undefined) {
    return <AccountIdentityPageSkeleton />;
  }

  const copyUserId = () => {
    if (!user?._id) return;
    void navigator.clipboard.writeText(user._id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <AccountPageShell
      title="Identity"
      description="Use this identifier when debugging account-specific data."
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            Account ID
          </CardTitle>
          <CardDescription>
            The Convex user identifier shared across web and mobile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-2">
            <Label htmlFor="account-id">Account ID</Label>
            <div className="relative">
              <Input
                id="account-id"
                value={user?._id ?? ""}
                readOnly
                aria-label="Account ID"
                className="pr-10 font-mono text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={copyUserId}
                aria-label="Copy account ID"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t text-xs text-muted-foreground">
          This identifier is read-only and useful when tracing account data.
        </CardFooter>
      </Card>
    </AccountPageShell>
  );
}
