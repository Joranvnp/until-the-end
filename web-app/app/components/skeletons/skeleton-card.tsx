import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard({
  contentLines = 2,
  footer = false,
  className,
}: {
  contentLines?: number;
  footer?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-xl bg-card py-4 ring-1 ring-foreground/10 ${className ?? ""}`}
    >
      <div className="grid gap-1 px-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <div className="grid gap-3 px-4">
        {Array.from({ length: contentLines }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full max-w-sm rounded-lg" />
        ))}
      </div>
      {footer ? (
        <div className="border-t bg-muted/50 px-4 pt-4">
          <div className="flex justify-end">
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
