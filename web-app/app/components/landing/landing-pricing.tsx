import { Check, CreditCard, Download, Infinity, ShieldOff } from "lucide-react";
import { SiteConfig } from "@site-config";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./section-heading";

const TIMELINE_STEPS = [
  {
    icon: CreditCard,
    title: `Pay once – ${SiteConfig.payment.priceDisplay}`,
    description: "One single payment",
  },
  {
    icon: Infinity,
    title: "Unlimited access forever",
    description: "No expiry, no renewal",
  },
  {
    icon: ShieldOff,
    title: "No subscription",
    description: "Never charged again",
  },
];

const FEATURES = [
  "Unlimited moments across iOS, Android, and web",
  "Photo attachments and offline capture",
  "Instant cross-device sync",
  "Full-text search across your timeline",
  "Private by default, no ads, no tracking",
  "All future updates included",
];

export function LandingPricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="border-t border-border bg-background py-20 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          id="pricing-title"
          eyebrow="Pricing"
          title="Get lifetime access"
          description="One payment, access forever. No subscriptions, ever."
        />

        <div className="mx-auto mt-16 max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
          <div className="space-y-0">
            {TIMELINE_STEPS.map((step, index) => {
              const isLast = index === TIMELINE_STEPS.length - 1;
              return (
                <div key={step.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                      <step.icon className="size-5 text-foreground" />
                    </div>
                    {!isLast && <div className="my-1 h-7 w-px bg-border" />}
                  </div>
                  <div className="pt-1.5 pb-5">
                    <p className="text-[15px] font-semibold text-foreground">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-end justify-center gap-2 border-t border-border pt-8">
            <p className="text-6xl font-semibold tracking-tight text-foreground">
              {SiteConfig.payment.priceDisplay}
            </p>
            <p className="pb-2 text-sm text-muted-foreground">once</p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 flex-1 rounded-full px-6 text-sm"
              render={
                <a
                  href={SiteConfig.urls.appStore}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <Download className="size-4" />
              App Store
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 flex-1 rounded-full px-6 text-sm"
              render={
                <a
                  href={SiteConfig.urls.playStore}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              Google Play
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-2xl">
          <p className="text-center text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Everything included
          </p>
          <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 py-2">
                <span className="flex size-5 flex-none items-center justify-center rounded-full bg-primary">
                  <Check className="size-3 text-primary-foreground" />
                </span>
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-border pt-10">
          {[
            { value: "Free", label: "Web app" },
            { value: "14 days", label: "Refund policy" },
            { value: "Same-day", label: "Support" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-lg font-semibold text-foreground">
                {item.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
