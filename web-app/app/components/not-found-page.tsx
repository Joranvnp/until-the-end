import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, LifeBuoy, SearchX } from "lucide-react";
import { SiteConfig } from "@site-config";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const missingPath = pathname || "/";

  return (
    <div className="force-light-theme flex min-h-screen flex-col bg-white text-gray-900">
      <LandingHeader />
      <main className="flex flex-1 items-center border-t border-gray-100">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-24">
          <section className="max-w-2xl">
            <p className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
              404
            </p>
            <h1 className="mt-6 text-4xl font-medium tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
              This page is not part of {SiteConfig.title}.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-gray-500 sm:text-lg">
              The address you opened does not match a page in the web app. Go
              back home, or contact support if you expected something to be here.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                className="h-10 rounded-full bg-gray-900 px-5 text-sm text-white shadow-sm hover:bg-gray-800"
                render={<Link to="/" />}
              >
                <ArrowLeft className="size-4" />
                Back home
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-full border-gray-200 px-5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                render={<Link to="/support" />}
              >
                <LifeBuoy className="size-4" />
                Contact support
              </Button>
            </div>
          </section>

          <aside className="flex items-end lg:justify-end">
            <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm shadow-gray-900/5">
                  <SearchX className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">Missing route</p>
                  <p className="truncate font-mono text-xs text-gray-500">{missingPath}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
