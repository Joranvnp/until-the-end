import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteConfig } from "@site-config";
import { LegalLayout } from "@/components/legal/legal-layout";
import { LegalPageSkeleton } from "@/components/skeletons/public-route-skeletons";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: `Support - ${SiteConfig.title}` },
      { name: "description", content: `Get help with ${SiteConfig.title}` },
    ],
  }),
  component: SupportPage,
  pendingComponent: LegalPageSkeleton,
});

const appName = SiteConfig.title;
const companyName = SiteConfig.company.name;
const supportEmail = SiteConfig.company.email;

function SupportPage() {
  return (
    <LegalLayout title="Support" description={`Need help with ${appName}? We are here for you.`}>
      <h2>Contact Us</h2>
      <p>
        For questions, issues, or feedback, email{" "}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </p>

      <h2>Common Questions</h2>
      <h3>How does {appName} work?</h3>
      <p>
        {appName} lets you save quick notes about your life, thoughts, and moments.
        Write your note and it is saved instantly.
      </p>

      <h3>How do I sync across devices?</h3>
      <p>Your updates sync automatically when you sign in on multiple devices.</p>

      <h3>Are my updates private?</h3>
      <p>
        Yes. Your content is visible only to you. See the{" "}
        <Link to="/privacy">Privacy Policy</Link> for details.
      </p>

      <h3>How do I request a refund?</h3>
      <p>
        Purchases made through the App Store are managed by Apple. Visit{" "}
        <a href="https://reportaproblem.apple.com" target="_blank" rel="noopener noreferrer">
          reportaproblem.apple.com
        </a>
        .
      </p>

      <h3>How do I delete my account?</h3>
      <p>
        Delete your account from app settings or contact{" "}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. We process requests within
        30 days.
      </p>

      <p className="mt-4 border-t border-gray-100 pt-8 text-sm">
        <strong>{companyName}</strong>
      </p>
    </LegalLayout>
  );
}
