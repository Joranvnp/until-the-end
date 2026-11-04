import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { SiteConfig } from "@site-config";
import { authPrimaryButtonClassName } from "@/components/auth/auth-form-styles";
import { AuthCenteredShell } from "@/components/auth/auth-shell";
import { AuthCenteredRouteSkeleton } from "@/components/skeletons/auth-route-skeletons";
import { Button } from "@/components/ui/button";
import { validateAuthSearch } from "@/lib/auth-utils";

export const Route = createFileRoute("/auth/verify")({
  validateSearch: validateAuthSearch,
  head: () => ({
    meta: [
      { title: `Verify email | ${SiteConfig.title}` },
      {
        name: "description",
        content: `Verify your ${SiteConfig.title} email address.`,
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: VerifyEmailPage,
  pendingComponent: AuthCenteredRouteSkeleton,
});

function VerifyEmailPage() {
  const search = Route.useSearch();

  return (
    <AuthCenteredShell
      title="Verify your email"
      description="Check your inbox and use the verification link or code sent to your email address."
      footer={
        <p className="text-sm text-muted-foreground">
          Already verified?{" "}
          <Link
            to="/auth/signin"
            search={{ callbackUrl: search.callbackUrl }}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-6" />
        </div>
        <Button
          className={authPrimaryButtonClassName}
          size="lg"
          render={
            <Link
              to="/auth/signin"
              search={{ callbackUrl: search.callbackUrl }}
            />
          }
        >
          Back to sign in
        </Button>
      </div>
    </AuthCenteredShell>
  );
}
