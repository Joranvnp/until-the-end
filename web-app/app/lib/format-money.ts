export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { dateStyle: "medium" });
}
