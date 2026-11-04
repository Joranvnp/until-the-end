import { useQuery } from "convex/react";
import { Apple, KeyRound, Loader2, Mail, Shield } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/format-money";
import { api } from "@convex/_generated/api";

function providerMeta(providerId: string) {
  switch (providerId) {
    case "apple":
      return { label: "Apple", icon: Apple };
    case "google":
      return { label: "Google", icon: Mail };
    case "credential":
      return { label: "Email & Password", icon: KeyRound };
    case "email-otp":
      return { label: "Email OTP", icon: Mail };
    default:
      return { label: providerId, icon: Shield };
  }
}

export function AdminUserProviders({ userId }: { userId: Id<"users"> }) {
  const providers = useQuery(api.admin.queries.listUserAuthProviders, { userId });
  const isLoading = providers === undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sign-in providers</CardTitle>
        <CardDescription>
          Authentication methods connected to this account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
            <Loader2 className="size-4 animate-spin" /> Loading providers…
          </div>
        ) : providers.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-1 py-8 text-center text-sm">
            <Shield className="size-5" />
            <p className="text-foreground font-medium">No sign-in providers</p>
            <p>No linked or implicit providers were found for this user.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {providers.map((provider) => {
              const meta = providerMeta(provider.providerId);
              const Icon = meta.icon;
              const isAvailable = provider.status === "available";
              const statusLabel = isAvailable ? "Available" : "Connected";
              const eventTime = isAvailable
                ? provider.availableSince
                : provider.connectedAt;
              const dateLabel =
                eventTime > 0 ? formatDate(eventTime) : "unknown";
              return (
                <div
                  key={provider.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{meta.label}</span>
                      <Badge
                        variant={isAvailable ? "outline" : "secondary"}
                        className="text-xs"
                      >
                        {statusLabel}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground truncate text-xs">
                      <code>{provider.displayIdentifier ?? "—"}</code> ·{" "}
                      {isAvailable ? "available since" : "linked"} {dateLabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
