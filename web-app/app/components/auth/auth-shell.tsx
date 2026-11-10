import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, type LucideIcon } from "lucide-react";
import { SiteConfig } from "@site-config";
import { AppLogoMark } from "@/components/app-logo-mark";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

const authVisualImage = "/auth/sign-in-background.webp";

export type AuthVisualHighlight = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function AuthSplitShell({
  children,
  eyebrow,
  title,
  description,
  visual,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  visual: ReactNode;
}) {
  return (
    <main className="min-h-dvh w-full bg-muted/50 text-foreground dark:bg-background lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:p-3">
      <div className="grid min-h-dvh gap-3 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(28rem,0.95fr)]">
        {visual}

        <section className="relative flex min-h-dvh flex-col overflow-hidden bg-card lg:h-full lg:min-h-0 lg:rounded-[1.75rem] lg:border lg:border-border/70 lg:shadow-[0_40px_90px_-50px_rgba(15,23,42,0.55)]">
          <AuthHeader />
          <div className="flex flex-1 px-5 pt-2 pb-10 sm:px-8 lg:min-h-0 lg:overflow-y-auto lg:px-10 lg:py-10">
            <div className="mx-auto my-auto flex w-full max-w-[26rem] flex-col gap-8">
              <AuthHeading
                eyebrow={eyebrow}
                title={title}
                description={description}
              />
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function AuthVisualPanel({
  eyebrow,
  title,
  description,
  highlights,
  footer,
  imagePosition = "object-[64%_center]",
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  highlights: AuthVisualHighlight[];
  footer: string;
  imagePosition?: string;
}) {
  return (
    <section className="relative hidden overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[#080a12] lg:min-h-0 lg:block">
      <img
        src={authVisualImage}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover ${imagePosition}`}
        decoding="async"
        draggable={false}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/15"
      />

      <div className="relative z-[1] flex h-full flex-col justify-between p-8 text-white xl:p-12">
        <Link to="/" className="flex min-h-11 w-fit items-center gap-2.5">
          <AppLogoMark
            size={36}
            className="shadow-lg shadow-black/30 ring-1 ring-white/15"
          />
          <span className="text-lg font-semibold">{SiteConfig.title}</span>
        </Link>

        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-4">
            <p className="text-xs font-medium tracking-[0.16em] text-white/55 uppercase">
              {eyebrow}
            </p>
            <p className="max-w-lg text-balance font-serif text-[2.6rem] leading-[0.95] tracking-[-0.04em] text-white xl:text-[3.25rem]">
              {title}
            </p>
            <p className="max-w-md text-pretty text-[15px] leading-relaxed text-white/65">
              {description}
            </p>
          </div>

          <ul className="flex max-w-md flex-col gap-4 rounded-3xl border border-white/[0.12] bg-white/[0.07] p-5 shadow-[0_30px_60px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl">
            {highlights.map((highlight) => (
              <li key={highlight.title} className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.14] bg-white/[0.08]">
                  <highlight.icon
                    className="size-4 text-white"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-white">
                    {highlight.title}
                  </span>
                  <span className="text-[13px] leading-5 text-white/55">
                    {highlight.description}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <p className="text-[13px] text-white/45">{footer}</p>
        </div>
      </div>
    </section>
  );
}

export function AuthCenteredShell({
  children,
  title,
  description,
  footer,
}: {
  children: ReactNode;
  title: string;
  description: string;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col bg-muted/50 text-foreground dark:bg-background">
      <AuthHeader />
      <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-4 sm:px-8 lg:px-10 lg:py-12">
        <Card className="w-full max-w-md rounded-[1.5rem] border-border/70 bg-card shadow-[0_32px_80px_-52px_rgba(15,23,42,0.6)]">
          <CardHeader className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
            <CardDescription className="text-pretty leading-6">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer ? (
            <CardFooter className="justify-center">{footer}</CardFooter>
          ) : null}
        </Card>
      </div>
    </main>
  );
}

export function AuthPageLoader() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/50 text-foreground dark:bg-background">
      <div role="status">
        <Loader2
          className="size-8 animate-spin text-muted-foreground motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span className="sr-only">Loading</span>
      </div>
    </main>
  );
}

function AuthHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between px-5 sm:px-8 lg:px-10">
      <Link
        to="/"
        className="-ml-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 lg:hidden"
      >
        <AppLogoMark size={32} />
        <span className="font-semibold">{SiteConfig.title}</span>
      </Link>
      <Link
        to="/"
        className="ml-auto min-h-11 content-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Back home
      </Link>
    </header>
  );
}

function AuthHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <div className="space-y-2">
        <h1 className="text-balance text-3xl font-semibold leading-tight text-foreground">
          {title}
        </h1>
        <p className="text-pretty text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
