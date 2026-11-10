import { createFileRoute } from "@tanstack/react-router";
import { SiteConfig } from "@site-config";
import { LandingCallToAction } from "@/components/landing/landing-cta";
import { LandingFaqs } from "@/components/landing/landing-faqs";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { LandingPrimaryFeatures } from "@/components/landing/landing-primary-features";
import { LandingReviews } from "@/components/landing/landing-reviews";
import { LandingSecondaryFeatures } from "@/components/landing/landing-secondary-features";
import { LandingPageSkeleton } from "@/components/skeletons/public-route-skeletons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SiteConfig.title} - ${SiteConfig.description}` },
      { name: "description", content: SiteConfig.description },
    ],
  }),
  component: LandingPage,
  pendingComponent: LandingPageSkeleton,
});

function LandingPage() {
  return (
    <div className="force-light-theme relative min-h-screen overflow-x-clip bg-background text-foreground">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingPrimaryFeatures />
        <LandingSecondaryFeatures />
        <LandingCallToAction />
        <LandingReviews />
        <LandingPricing />
        <LandingFaqs />
      </main>
      <LandingFooter />
    </div>
  );
}
