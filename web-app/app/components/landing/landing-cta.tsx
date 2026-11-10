import { Download } from "lucide-react";
import { SiteConfig } from "@site-config";
import { Button } from "@/components/ui/button";
import { CircleBackground } from "./circle-background";

export function LandingCallToAction() {
  return (
    <section
      id="start-today"
      className="dark relative overflow-hidden bg-background py-20 text-foreground sm:py-28"
    >
      <div className="absolute top-1/2 left-20 -translate-y-1/2 sm:left-1/2 sm:-translate-x-1/2">
        <CircleBackground
          color="currentColor"
          className="animate-spin-slower text-primary/30"
        />
      </div>
      <div className="relative mx-auto max-w-md px-6 text-center sm:max-w-2xl lg:px-8">
        <h2 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Save your first moment in 30 seconds.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Pay once, use forever. {SiteConfig.title} costs{" "}
          {SiteConfig.payment.priceDisplay} and stays out of your way for life.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
            Download for iPhone
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 rounded-full px-6 text-sm"
            render={
              <a
                href={SiteConfig.urls.playStore}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <Download className="size-4" />
            Get on Android
          </Button>
        </div>
      </div>
    </section>
  );
}
