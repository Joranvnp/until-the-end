import { Link } from "@tanstack/react-router";
import { Clock, Download, Play, Sparkles, Star } from "lucide-react";
import { SiteConfig } from "@site-config";
import { Button } from "@/components/ui/button";
import { HeroOrbits } from "./circle-background";
import { PhoneFrame } from "./phone-mockup";

const HERO_STATS = [
  { icon: Sparkles, value: "12k+", label: "moments captured" },
  { icon: Star, value: "4.9", label: "App Store rating" },
  { icon: Clock, value: "30s", label: "to first save" },
];

export function LandingHero() {
  return (
    <div className="overflow-hidden pb-20 sm:py-32 lg:pb-32 xl:pb-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
          <div className="relative z-10 mx-auto max-w-2xl lg:col-span-7 lg:max-w-none lg:pt-6 xl:col-span-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 py-1 pr-3 pl-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="size-3" />
              </span>
              Now on iOS, Android &amp; the web
            </span>
            <h1 className="mt-5 text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
              Capture what matters, right now.
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {SiteConfig.title} is the quietest way to keep what is happening
              before it slips away. Tiny notes, photos, and ideas, synced
              between your phone and the web. No feeds, no noise.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Button
                size="lg"
                className="h-11 rounded-full px-6 text-sm"
                render={
                  <a
                    href={SiteConfig.urls.appStore}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <Download className="size-4" />
                Download on App Store
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="h-11 gap-2 rounded-full px-3 text-sm text-foreground"
                render={<Link to="/app" />}
              >
                <span className="flex size-8 items-center justify-center rounded-full border border-border">
                  <Play className="size-3 fill-muted-foreground text-muted-foreground" />
                </span>
                Try the web app
              </Button>
            </div>
          </div>

          <div className="relative mt-10 sm:mt-20 lg:col-span-5 lg:row-span-2 lg:mt-0 xl:col-span-6">
            <HeroOrbits className="landing-mask-fade-y absolute top-4 left-1/2 h-[860px] w-[860px] -translate-x-1/3 text-border sm:top-16 sm:-translate-x-1/2 lg:-top-16 lg:ml-12 xl:-top-14 xl:ml-0" />
            <div className="landing-mask-fade-bottom -mx-4 h-[448px] px-9 sm:mx-0 lg:absolute lg:-inset-x-10 lg:-top-10 lg:-bottom-20 lg:h-auto lg:px-0 lg:pt-10 xl:-bottom-32">
              <PhoneFrame className="mx-auto max-w-[340px]" />
            </div>
          </div>

          <div className="relative -mt-4 lg:col-span-7 lg:mt-0 xl:col-span-6">
            <p className="text-center text-sm font-medium text-muted-foreground lg:text-left">
              Trusted by people who value their moments
            </p>
            <div className="mx-auto mt-5 grid max-w-xl grid-cols-3 gap-3 lg:mx-0">
              {HERO_STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-border bg-card/60 px-4 py-3 text-center shadow-sm backdrop-blur lg:text-left"
                  >
                    <Icon className="mx-auto size-4 text-muted-foreground lg:mx-0" />
                    <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
