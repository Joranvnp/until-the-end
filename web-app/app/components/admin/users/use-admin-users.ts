import { usePaginatedQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@convex/_generated/api";

export type RoleFilter = "all" | "admin" | "user";
export type StatusFilter = "all" | "active" | "banned";

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 25;

export function useAdminUsers() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  useEffect(() => {
    const t = setTimeout(
      () => setSearch(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(t);
  }, [searchInput]);

  const { results, status: loadStatus, loadMore } = usePaginatedQuery(
    api.admin.queries.listUsers,
    {
      search: search || undefined,
      role: role === "all" ? undefined : role,
      status: status === "all" ? undefined : status,
    },
    { initialNumItems: PAGE_SIZE },
  );

  return {
    searchInput,
    setSearchInput,
    role,
    setRole,
    status,
    setStatus,
    results,
    loadStatus,
    loadMore: () => loadMore(PAGE_SIZE),
  };
}
