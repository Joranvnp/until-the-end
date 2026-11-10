import { createFileRoute } from "@tanstack/react-router";
import { SiteConfig } from "@site-config";
import { LegalLayout } from "@/components/legal/legal-layout";
import { LegalPageSkeleton } from "@/components/skeletons/public-route-skeletons";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: `Privacy Policy - ${SiteConfig.title}` },
      { name: "description", content: `Privacy policy for ${SiteConfig.title}` },
    ],
  }),
  component: PrivacyPage,
  pendingComponent: LegalPageSkeleton,
});

const appName = SiteConfig.title;
const companyName = SiteConfig.company.name;
const supportEmail = SiteConfig.company.email;

function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" description="Effective Date: April 7, 2026">
      <p>
        <strong>Company:</strong> {companyName}
      </p>
      <p>
        <strong>Contact:</strong>{" "}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </p>
      <p>
        {appName} is a simple moment capture app. To deliver, improve, and operate
        it, we collect data as described below.
      </p>

      <h2>What We Collect</h2>
      <p>
        <strong>Identity and contact:</strong> name and email.
      </p>
      <p>
        <strong>Content:</strong> status updates and notes you create within the app.
      </p>
      <p>
        <strong>Purchase and billing:</strong> payment records handled by Apple
        In-App Purchase or Stripe.
      </p>
      <p>
        <strong>Technical:</strong> IP address, browser or device data, logs, and
        diagnostics.
      </p>

      <h2>How We Use It</h2>
      <p>
        We use data to create accounts, store and sync content, process payments,
        provide support, secure the service, improve product quality, and keep
        required legal or business records.
      </p>

      <h2>Who We Share It With</h2>
      <p>
        We use service providers such as Apple, Stripe, Convex, Cloudflare, and
        email providers to operate the service. They process data for us under
        their own terms and privacy commitments.
      </p>

      <h2>Your Choices</h2>
      <p>
        You can delete your account from app settings or by contacting{" "}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. We process deletion
        requests within a reasonable time unless retention is required by law.
      </p>

      <h2>Security</h2>
      <p>
        We use reasonable technical and organizational measures, including
        encryption in transit and at rest. No online system is fully secure.
      </p>

      <h2>Changes</h2>
      <p>We may update this policy as needed. The latest posted version controls.</p>
    </LegalLayout>
  );
}
