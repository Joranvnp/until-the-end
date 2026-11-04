import { Badge } from "@/components/ui/badge";
import {
  PAYMENT_SOURCE_LABEL,
  PAYMENT_STATUS_META,
  userStatusMeta,
  type PaymentSource,
  type PaymentStatus,
} from "@/lib/admin-format";

export function UserStatusBadge({
  user,
}: {
  user: { bannedAt?: number | null; anonymizedAt?: number | null };
}) {
  const meta = userStatusMeta(user);
  return (
    <Badge variant={meta.variant} className={meta.dot ? "gap-1.5" : undefined}>
      {meta.dot ? (
        <span
          className={`size-1.5 rounded-full ${meta.dot}`}
          aria-hidden="true"
        />
      ) : null}
      {meta.label}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const meta = PAYMENT_STATUS_META[status];
  return (
    <Badge variant={meta.variant} className="gap-1.5">
      <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

export function PaymentSourceBadge({ source }: { source: PaymentSource }) {
  return <Badge variant="secondary">{PAYMENT_SOURCE_LABEL[source]}</Badge>;
}

export function PlanBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="outline" className="gap-1.5">
      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      Paying
    </Badge>
  ) : (
    <Badge variant="ghost" className="text-muted-foreground">
      Free
    </Badge>
  );
}
