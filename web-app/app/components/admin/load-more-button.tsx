import { Button } from "@/components/ui/button";

type PaginationLoadStatus =
  | "LoadingFirstPage"
  | "CanLoadMore"
  | "LoadingMore"
  | "Exhausted";

export function LoadMoreButton({
  loadStatus,
  onLoadMore,
}: {
  loadStatus: PaginationLoadStatus;
  onLoadMore: () => void;
}) {
  if (loadStatus !== "CanLoadMore" && loadStatus !== "LoadingMore") {
    return null;
  }

  return (
    <div className="flex justify-center">
      <Button
        variant="outline"
        size="sm"
        onClick={onLoadMore}
        disabled={loadStatus === "LoadingMore"}
      >
        {loadStatus === "LoadingMore" ? "Loading…" : "Load more"}
      </Button>
    </div>
  );
}
