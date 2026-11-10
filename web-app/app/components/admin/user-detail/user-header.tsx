import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  Ban,
  Copy,
  MoreHorizontal,
  ShieldCheck,
  ShieldOff,
  UserX,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/format-time";
import { api } from "@convex/_generated/api";

type AdminUser = FunctionReturnType<
  typeof api.admin.queries.getUserDetail
>["user"];

export function UserHeader({ user }: { user: AdminUser }) {
  const navigate = useNavigate();
  const setUserBanned = useMutation(api.admin.mutations.setUserBanned);
  const setUserAdmin = useMutation(api.admin.mutations.setUserAdmin);
  const anonymizeUser = useMutation(api.admin.mutations.anonymizeUser);
  const [pending, setPending] = useState(false);
  const [anonymizeOpen, setAnonymizeOpen] = useState(false);
  const isBanned = Boolean(user.bannedAt);
  const displayName = user.name || user.email || "User";

  const run = async (fn: () => Promise<unknown>, success: string) => {
    if (pending) return;
    setPending(true);
    try {
      await fn();
      toast.success(success);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        <Avatar className="size-14 rounded-xl">
          <AvatarFallback className="bg-primary text-primary-foreground rounded-xl text-lg font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {displayName}
            </h1>
            <Badge variant={user.isAdmin ? "default" : "outline"}>
              {user.isAdmin ? "Admin" : "User"}
            </Badge>
            {isBanned ? <Badge variant="destructive">Banned</Badge> : null}
          </div>
          <p className="text-muted-foreground truncate text-sm">
            {user.email || "—"} · Joined {formatRelativeTime(user.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!user.isAdmin ? (
          <Button
            variant={isBanned ? "outline" : "destructive"}
            size="sm"
            className="gap-1.5"
            disabled={pending}
            onClick={() =>
              void run(
                () => setUserBanned({ userId: user._id, banned: !isBanned }),
                isBanned ? "User unbanned" : "User banned",
              )
            }
          >
            {isBanned ? (
              <>
                <ShieldCheck className="size-4" /> Unban
              </>
            ) : (
              <>
                <Ban className="size-4" /> Ban
              </>
            )}
          </Button>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="icon-sm" aria-label="User actions" />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onClick={() =>
                void run(
                  () =>
                    setUserAdmin({
                      userId: user._id,
                      isAdmin: !user.isAdmin,
                    }),
                  user.isAdmin ? "Admin access revoked" : "Promoted to admin",
                )
              }
            >
              {user.isAdmin ? <ShieldOff /> : <ShieldCheck />}
              {user.isAdmin ? "Revoke admin" : "Promote to admin"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                void navigator.clipboard.writeText(user._id);
                toast.success("User ID copied");
              }}
            >
              <Copy />
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={Boolean(user.anonymizedAt)}
              onClick={() => setAnonymizeOpen(true)}
            >
              <UserX />
              {user.anonymizedAt ? "Already anonymized" : "Anonymize user"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={anonymizeOpen} onOpenChange={setAnonymizeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anonymize this user?</DialogTitle>
            <DialogDescription>
              Their email and name will be permanently scrubbed for GDPR. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                void run(async () => {
                  await anonymizeUser({ userId: user._id });
                  setAnonymizeOpen(false);
                  navigate({ to: "/admin/users" });
                }, "User anonymized")
              }
            >
              {pending ? "Working…" : "Anonymize"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
