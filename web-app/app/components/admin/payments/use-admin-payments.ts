import { usePaginatedQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import type { PaymentSource, PaymentStatus } from "@/lib/admin-format";
import { api } from "@convex/_generated/api";

export type PaymentStatusFilter = "all" | PaymentStatus;
export type PaymentSourceFilter = "all" | PaymentSource;

export type ListedPayment = FunctionReturnType<
  typeof api.admin.queries.listPayments
>["page"][number];

const PAGE_SIZE = 25;

export function useAdminPayments() {
  const [status, setStatus] = useState<PaymentStatusFilter>("all");
  const [source, setSource] = useState<PaymentSourceFilter>("all");

  const { results, status: loadStatus, loadMore } = usePaginatedQuery(
    api.admin.queries.listPayments,
    {
      status: status === "all" ? undefined : status,
      source: source === "all" ? undefined : source,
    },
    { initialNumItems: PAGE_SIZE },
  );

  return {
    status,
    setStatus,
    source,
    setSource,
    results,
    loadStatus,
    loadMore: () => loadMore(PAGE_SIZE),
  };
}
