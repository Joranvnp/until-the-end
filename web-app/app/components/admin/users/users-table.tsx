import { Link, useNavigate } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import type { ListedUser } from "@/components/admin/users/listed-user";
import { UserRowActions } from "@/components/admin/users/user-row-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/format-time";

export function UsersTable({ users }: { users: ListedUser[] }) {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow
              key={u._id}
              className="cursor-pointer"
              onClick={() =>
                navigate({
                  to: "/admin/users/$userId",
                  params: { userId: u._id },
                })
              }
            >
              <TableCell className="max-w-0 pl-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="bg-primary text-primary-foreground rounded-lg text-xs font-medium">
                      {(u.name || u.email || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <Link
                      to="/admin/users/$userId"
                      params={{ userId: u._id }}
                      className="truncate font-medium hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {u.name || u.email || "—"}
                    </Link>
                    {u.name ? (
                      <div className="text-muted-foreground truncate text-xs">
                        {u.email}
                      </div>
                    ) : null}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {u.isAdmin ? (
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="size-3" /> Admin
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">User</span>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge user={u} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatRelativeTime(u.createdAt)}
              </TableCell>
              <TableCell
                className="pr-4 text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <UserRowActions user={u} />
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-muted-foreground h-24 text-center"
              >
                No users found.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusBadge({ user }: { user: ListedUser }) {
  if (user.bannedAt) return <Badge variant="destructive">Banned</Badge>;
  if (user.anonymizedAt) return <Badge variant="secondary">Anonymized</Badge>;
  return (
    <Badge variant="outline" className="gap-1.5">
      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      Active
    </Badge>
  );
}
