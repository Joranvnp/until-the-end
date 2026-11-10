import { useMutation } from "convex/react";
import {
  Ban,
  Copy,
  Crown,
  MoreHorizontal,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ListedUser } from "@/components/admin/users/listed-user";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@convex/_generated/api";

export function UserRowActions({ user }: { user: ListedUser }) {
  const setUserBanned = useMutation(api.admin.mutations.setUserBanned);
  const setUserAdmin = useMutation(api.admin.mutations.setUserAdmin);
  const [pending, setPending] = useState(false);
  const isBanned = Boolean(user.bannedAt);

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
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="User actions" />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() =>
            void run(
              () => setUserAdmin({ userId: user._id, isAdmin: !user.isAdmin }),
              user.isAdmin ? "Admin access revoked" : "Promoted to admin",
            )
          }
        >
          {user.isAdmin ? <ShieldOff /> : <Crown />}
          {user.isAdmin ? "Revoke admin" : "Make admin"}
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
        {user.isAdmin ? (
          <DropdownMenuItem disabled>
            <Ban />
            Admins can't be banned
          </DropdownMenuItem>
        ) : isBanned ? (
          <DropdownMenuItem
            onClick={() =>
              void run(
                () => setUserBanned({ userId: user._id, banned: false }),
                "User unbanned",
              )
            }
          >
            <ShieldCheck />
            Unban user
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            variant="destructive"
            onClick={() =>
              void run(
                () => setUserBanned({ userId: user._id, banned: true }),
                "User banned",
              )
            }
          >
            <Ban />
            Ban user
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
