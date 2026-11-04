import type { Doc } from "@convex/_generated/dataModel";

export type PaymentStatus = Doc<"entitlements">["status"];
export type PaymentSource = Doc<"entitlements">["source"];

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "link";

type StatusMeta = { label: string; variant: BadgeVariant; dot: string };

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  active: { label: "Active", variant: "outline", dot: "bg-emerald-500" },
  pending: { label: "Pending", variant: "outline", dot: "bg-amber-500" },
  revoked: { label: "Revoked", variant: "outline", dot: "bg-muted-foreground" },
  refunded: { label: "Refunded", variant: "outline", dot: "bg-destructive" },
};

export const PAYMENT_SOURCE_LABEL: Record<PaymentSource, string> = {
  apple_iap: "Apple",
  google_play: "Google",
  stripe: "Stripe",
  dev: "Dev",
};

export const PAYMENT_STATUS_ORDER: PaymentStatus[] = [
  "active",
  "pending",
  "revoked",
  "refunded",
];

export const PAYMENT_SOURCE_ORDER: PaymentSource[] = [
  "apple_iap",
  "google_play",
  "stripe",
  "dev",
];

export function userStatusMeta(user: {
  bannedAt?: number | null;
  anonymizedAt?: number | null;
}): { label: string; variant: BadgeVariant; dot?: string } {
  if (user.bannedAt) return { label: "Banned", variant: "destructive" };
  if (user.anonymizedAt) return { label: "Anonymized", variant: "secondary" };
  return { label: "Active", variant: "outline", dot: "bg-emerald-500" };
}
