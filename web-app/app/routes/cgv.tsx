import { createFileRoute } from "@tanstack/react-router";
import { SiteConfig } from "@site-config";
import { LegalLayout } from "@/components/legal/legal-layout";
import { LegalPageSkeleton } from "@/components/skeletons/public-route-skeletons";

export const Route = createFileRoute("/cgv")({
  head: () => ({
    meta: [
      { title: `Terms & Conditions - ${SiteConfig.title}` },
      { name: "description", content: `Terms & Conditions for ${SiteConfig.title}` },
    ],
  }),
  component: TermsPage,
  pendingComponent: LegalPageSkeleton,
});

const appName = SiteConfig.title;
const companyName = SiteConfig.company.name;
const supportEmail = SiteConfig.company.email;

function TermsPage() {
  return (
    <LegalLayout title="Terms & Conditions" description="Effective Date: April 7, 2026">
      <p>
        <strong>Company:</strong> {companyName}
      </p>
      <p>
        <strong>Contact:</strong>{" "}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </p>

      <h2>1) Acceptance of Terms</h2>
      <p>
        By downloading, installing, or using {appName}, you agree to these Terms. If
        you do not agree, do not use the app.
      </p>

      <h2>2) Contracting Entity</h2>
      <p>Your contracting entity is {companyName}. All agreements are with {companyName}.</p>

      <h2>3) Eligibility</h2>
      <p>
        The app is for users 13+. By using {appName}, you represent that you meet
        this age requirement.
      </p>

      <h2>4) Service Description</h2>
      <p>
        {appName} lets users create quick notes, store personal moments, sync content
        across devices, and manage their personal timeline.
      </p>

      <h2>5) License and Acceptable Use</h2>
      <p>
        You receive a personal, revocable, non-transferable, single-user license for
        your own use. You may not resell, redistribute, scrape, reverse engineer, or
        abuse any part of the app.
      </p>

      <h2>6) Content</h2>
      <p>
        You retain ownership of all content you create in {appName}. You grant us a
        limited license to store and sync it solely to provide the service.
      </p>

      <h2>7) Payments</h2>
      <p>
        {appName} offers a one-time purchase at the price displayed in the app before
        purchase. iOS payments are processed through Apple In-App Purchase. Android
        and web payments may be processed through Stripe.
      </p>

      <h2>8) Refunds</h2>
      <p>
        Refunds follow the respective app store or payment processor policies. If you
        have issues, contact {supportEmail} before initiating a dispute.
      </p>

      <h2>9) Prohibited Conduct</h2>
      <p>
        You may not use the app for unlawful activity, harassment, rights violations,
        attempts to bypass security, or redistribution of the service.
      </p>

      <h2>10) Disclaimers and Limitation of Liability</h2>
      <p>
        The app is provided as is and as available. To the maximum extent permitted
        by law, {companyName} disclaims warranties and will not be liable for indirect
        or consequential damages.
      </p>

      <h2>11) Termination</h2>
      <p>
        You may stop using the app at any time. We may suspend or terminate access
        for violations, fraud risk, non-payment, or abuse.
      </p>

      <h2>12) Changes to Terms</h2>
      <p>
        We may update these Terms at any time. Continued use after posting means you
        accept the updated version.
      </p>
    </LegalLayout>
  );
}
