import { cn } from "@/lib/utils";

export function AuthError({
  align = "left",
  message,
}: {
  align?: "center" | "left";
  message: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="alert"
      className={cn(
        "rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium leading-5 text-destructive",
        align === "center" && "text-center",
      )}
    >
      {message}
    </p>
  );
}
