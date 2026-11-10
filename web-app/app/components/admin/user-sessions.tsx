import { useMutation, useQuery } from "convex/react";
import { Loader2, Monitor, Smartphone, Tablet, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmAction } from "@/components/confirm-action";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@convex/_generated/api";

function formatSessionTime(ts: number) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function deviceIcon(userAgent: string | null) {
  const ua = (userAgent ?? "").toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone"))
    return <Smartphone className="size-4" />;
  if (ua.includes("tablet") || ua.includes("ipad"))
    return <Tablet className="size-4" />;
  return <Monitor className="size-4" />;
}

function describeUserAgent(userAgent: string | null) {
  if (!userAgent) return "Unknown device";
  const ua = userAgent;
  let browser = "Unknown browser";
  if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari")) browser = "Safari";
  let os = "";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";
  return os ? `${browser} · ${os}` : browser;
}

export function AdminUserSessions({ userId }: { userId: Id<"users"> }) {
  const sessions = useQuery(api.admin.queries.listUserSessions, { userId });
  const revokeSession = useMutation(api.admin.mutations.revokeUserSession);
  const revokeAll = useMutation(api.admin.mutations.revokeAllUserSessions);
  const [now] = useState(() => Date.now());

  const isLoading = sessions === undefined;
  const sorted = [...(sessions ?? [])].sort((a, b) => {
    const aActive = a.expiresAt > now ? 0 : 1;
    const bActive = b.expiresAt > now ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return b.createdAt - a.createdAt;
  });

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Active sessions</CardTitle>
          <CardDescription>
            Devices currently signed in to this account.
          </CardDescription>
        </div>
        {sorted.length > 0 ? (
          <ConfirmAction
            trigger={
              <Button variant="destructive" size="sm" className="gap-1.5">
                <Trash2 className="size-4" /> Revoke all
              </Button>
            }
            title="Revoke all sessions?"
            description="The user will be signed out from every device immediately."
            confirmLabel="Revoke all"
            onConfirm={async () => {
              await revokeAll({ userId });
              toast.success("All sessions revoked");
            }}
          />
        ) : null}
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {isLoading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
            <Loader2 className="size-4 animate-spin" /> Loading sessions…
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-1 py-10 text-center text-sm">
            <Monitor className="size-5" />
            <p className="text-foreground font-medium">No active sessions</p>
            <p>This user is not signed in on any device.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Device</TableHead>
                <TableHead>IP address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="pr-6 text-right">Revoke</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((session) => {
                const active = session.expiresAt > now;
                return (
                  <TableRow key={session.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2.5">
                        {deviceIcon(session.userAgent)}
                        <div className="min-w-0">
                          <div className="font-medium whitespace-nowrap">
                            {describeUserAgent(session.userAgent)}
                          </div>
                          {session.userAgent ? (
                            <div className="text-muted-foreground max-w-[150px] truncate text-xs">
                              {session.userAgent}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code
                        className="text-muted-foreground block max-w-[7.5rem] truncate text-xs"
                        title={session.ipAddress ?? undefined}
                      >
                        {session.ipAddress ?? "—"}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="gap-1.5 whitespace-nowrap">
                          <span
                            className={`size-1.5 rounded-full ${
                              active ? "bg-emerald-500" : "bg-muted-foreground"
                            }`}
                            aria-hidden="true"
                          />
                          {active ? "Active" : "Expired"}
                        </Badge>
                        {session.impersonatedBy ? (
                          <Badge variant="secondary">Impersonated</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {formatSessionTime(session.createdAt)}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label="Revoke session"
                        onClick={async () => {
                          try {
                            await revokeSession({ sessionId: session.id });
                            toast.success("Session revoked");
                          } catch (e: unknown) {
                            toast.error(
                              e instanceof Error
                                ? e.message
                                : "Failed to revoke session",
                            );
                          }
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
