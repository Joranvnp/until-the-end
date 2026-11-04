import { Skeleton } from "@/components/ui/skeleton";

export function AuthSplitRouteSkeleton() {
  return (
    <main className="min-h-dvh w-full bg-muted/50 text-foreground dark:bg-background lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:p-3">
      <div className="grid min-h-dvh gap-3 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(28rem,0.95fr)]">
        <section className="relative hidden overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-foreground lg:min-h-0 lg:block">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-white/10" />
          <div className="relative flex h-full flex-col justify-between p-8 xl:p-12">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-[10px] bg-white/20" />
              <Skeleton className="h-6 w-32 bg-white/20" />
            </div>
            <div className="flex flex-col gap-7">
              <div className="space-y-4">
                <Skeleton className="h-3 w-44 bg-white/15" />
                <Skeleton className="h-12 w-full max-w-lg bg-white/20" />
                <Skeleton className="h-12 w-4/5 bg-white/20" />
                <Skeleton className="h-4 w-full max-w-md bg-white/15" />
              </div>
              <Skeleton className="h-44 w-full max-w-md rounded-3xl bg-white/15" />
            </div>
          </div>
        </section>

        <section className="relative flex min-h-dvh flex-col overflow-hidden bg-card lg:h-full lg:min-h-0 lg:rounded-[1.75rem] lg:border lg:border-border/70">
          <div className="flex h-16 shrink-0 items-center justify-between px-5 sm:px-8 lg:px-10">
            <div className="flex items-center gap-2 lg:hidden">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
          <div className="flex flex-1 px-5 pt-2 pb-10 sm:px-8 lg:min-h-0 lg:px-10 lg:py-10">
            <div className="mx-auto my-auto flex w-full max-w-[26rem] flex-col gap-8">
              <div className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-72 max-w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="mx-auto h-5 w-36" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="mx-auto h-5 w-44" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function AuthCenteredRouteSkeleton() {
  return (
    <main className="flex min-h-dvh flex-col bg-muted/50 text-foreground dark:bg-background">
      <div className="flex h-16 shrink-0 items-center justify-between px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2 lg:hidden">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="ml-auto h-4 w-20" />
      </div>
      <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-4 sm:px-8 lg:px-10 lg:py-12">
        <div className="flex w-full max-w-md flex-col gap-4 rounded-[1.5rem] border border-border/70 bg-card py-4 shadow-[0_32px_80px_-52px_rgba(15,23,42,0.6)]">
          <div className="grid gap-2 px-4 text-center">
            <Skeleton className="mx-auto h-7 w-52" />
            <Skeleton className="mx-auto h-4 w-72 max-w-full" />
          </div>
          <div className="grid gap-4 px-4">
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <div className="border-t bg-muted/50 p-4">
            <Skeleton className="mx-auto h-4 w-48" />
          </div>
        </div>
      </div>
    </main>
  );
}
