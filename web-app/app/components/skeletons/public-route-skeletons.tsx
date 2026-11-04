import { Skeleton } from "@/components/ui/skeleton";

export function LandingPageSkeleton() {
  return (
    <div className="force-light-theme relative min-h-screen overflow-x-clip bg-background text-foreground">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-xl" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="hidden items-center gap-6 md:flex">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
      <main className="mx-auto flex max-w-7xl flex-col gap-16 px-6 py-14 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <div className="space-y-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-14 w-full max-w-2xl" />
            <Skeleton className="h-14 w-11/12 max-w-xl" />
            <Skeleton className="h-5 w-full max-w-lg" />
            <div className="flex gap-3">
              <Skeleton className="h-11 w-32 rounded-full" />
              <Skeleton className="h-11 w-32 rounded-full" />
            </div>
          </div>
          <Skeleton className="aspect-[9/16] w-full rounded-3xl" />
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-2xl" />
          ))}
        </section>
      </main>
    </div>
  );
}

export function LegalPageSkeleton() {
  return (
    <div className="force-light-theme relative min-h-screen bg-background text-foreground">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>
      <main className="border-t border-gray-100">
        <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8 lg:py-24">
          <Skeleton className="h-5 w-36" />
          <header className="mt-8 border-b border-gray-100 pb-8">
            <Skeleton className="h-12 w-72 max-w-full" />
            <Skeleton className="mt-4 h-4 w-56" />
          </header>
          <div className="mt-10 space-y-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
