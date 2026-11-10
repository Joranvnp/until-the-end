import { ListFilter, Search } from "lucide-react";
import { AdminCreateUserDialog } from "@/components/admin/create-user-dialog";
import { FilterMenu } from "@/components/admin/users/filter-menu";
import type {
  RoleFilter,
  StatusFilter,
} from "@/components/admin/users/use-admin-users";
import { Input } from "@/components/ui/input";

const ROLE_LABEL: Record<RoleFilter, string> = {
  all: "All roles",
  admin: "Admins",
  user: "Users",
};
const STATUS_LABEL: Record<StatusFilter, string> = {
  all: "All statuses",
  active: "Active",
  banned: "Banned",
};

export function UsersFilters({
  searchInput,
  onSearchInputChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
}: {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  role: RoleFilter;
  onRoleChange: (value: RoleFilter) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative max-w-xs flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search by email…"
          className="pl-9"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
        />
      </div>

      <FilterMenu
        icon={<ListFilter className="size-4" />}
        label={ROLE_LABEL[role]}
        value={role}
        options={["all", "admin", "user"] as RoleFilter[]}
        labels={ROLE_LABEL}
        onSelect={onRoleChange}
      />
      <FilterMenu
        label={STATUS_LABEL[status]}
        value={status}
        options={["all", "active", "banned"] as StatusFilter[]}
        labels={STATUS_LABEL}
        onSelect={onStatusChange}
      />

      <div className="flex-1" />
      <AdminCreateUserDialog />
    </div>
  );
}
