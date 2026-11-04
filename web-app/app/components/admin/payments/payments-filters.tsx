import { ChevronDown, ListFilter } from "lucide-react";
import type {
  PaymentSourceFilter,
  PaymentStatusFilter,
} from "@/components/admin/payments/use-admin-payments";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PAYMENT_SOURCE_LABEL,
  PAYMENT_SOURCE_ORDER,
} from "@/lib/admin-format";

const STATUS_TABS: { value: PaymentStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "revoked", label: "Revoked" },
  { value: "refunded", label: "Refunded" },
];

export function PaymentsFilters({
  status,
  onStatusChange,
  source,
  onSourceChange,
}: {
  status: PaymentStatusFilter;
  onStatusChange: (value: PaymentStatusFilter) => void;
  source: PaymentSourceFilter;
  onSourceChange: (value: PaymentSourceFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Tabs
        value={status}
        onValueChange={(v) => onStatusChange(v as PaymentStatusFilter)}
      >
        <TabsList>
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="sm" className="gap-1.5" />}
        >
          <ListFilter className="size-4" />
          {source === "all" ? "All sources" : PAYMENT_SOURCE_LABEL[source]}
          <ChevronDown className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSourceChange("all")}>
            All sources
          </DropdownMenuItem>
          {PAYMENT_SOURCE_ORDER.map((s) => (
            <DropdownMenuItem key={s} onClick={() => onSourceChange(s)}>
              {PAYMENT_SOURCE_LABEL[s]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
