import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { SiteConfig } from "@site-config";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

export function LegalLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="force-light-theme relative min-h-screen bg-background text-foreground">
      <LandingHeader />
      <main className="border-t border-gray-100">
        <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8 lg:py-24">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="size-4" />
            Back to {SiteConfig.title}
          </Link>
          <header className="mt-8 border-b border-gray-100 pb-8">
            <h1 className="text-4xl font-medium tracking-tight text-gray-900 sm:text-5xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-4 text-base text-gray-500">{description}</p>
            ) : null}
          </header>
          <div className="mt-10 space-y-6 text-sm leading-7 text-gray-600 [&_a]:font-medium [&_a]:text-gray-900 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:pt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-gray-900 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900 [&_strong]:font-semibold [&_strong]:text-gray-900">
            {children}
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
