import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteConfig } from "@site-config";
import { AuthCenteredShell, AuthPageLoader } from "@/components/auth/auth-shell";
import { RedirectToCallback } from "@/components/auth/redirect-to-callback";
import { ResetCodeStep } from "@/components/auth/reset-code-step";
import { ResetEmailStep } from "@/components/auth/reset-email-step";
import { ResetPasswordStep } from "@/components/auth/reset-password-step";
import { ResetSuccessStep } from "@/components/auth/reset-success-step";
import { usePasswordResetFlow } from "@/components/auth/use-password-reset-flow";
import { AuthCenteredRouteSkeleton } from "@/components/skeletons/auth-route-skeletons";
import { authClient } from "@/lib/auth-client";
import { type AuthSearch, validateAuthSearch } from "@/lib/auth-utils";

export const Route = createFileRoute("/auth/forget-password")({
  validateSearch: validateAuthSearch,
  head: () => ({
    meta: [
      { title: `Reset password | ${SiteConfig.title}` },
      { name: "description", content: `Reset your ${SiteConfig.title} password.` },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ForgetPasswordPage,
  pendingComponent: AuthCenteredRouteSkeleton,
});

function ForgetPasswordPage() {
  const search = Route.useSearch();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <AuthPageLoader />;
  }

  if (session?.user) {
    return <RedirectToCallback callbackUrl={search.callbackUrl} />;
  }

  return <ForgetPasswordContent search={search} />;
}

function ForgetPasswordContent({ search }: { search: AuthSearch }) {
  const flow = usePasswordResetFlow(search);

  return (
    <AuthCenteredShell
      title={flow.copy.title}
      description={flow.copy.description}
      footer={
        <p className="text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link
            to="/auth/signin"
            search={{ callbackUrl: search.callbackUrl, email: flow.normalizedEmail || undefined }}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      {flow.step === "email" ? (
        <ResetEmailStep
          email={flow.email}
          error={flow.error}
          loading={flow.loading}
          onEmailChange={flow.setEmail}
          onSubmit={flow.handleSendResetCode}
        />
      ) : null}
      {flow.step === "code" ? (
        <ResetCodeStep
          email={flow.normalizedEmail}
          error={flow.error}
          loading={flow.loading}
          otp={flow.otp}
          onBack={flow.backToEmailStep}
          onOtpChange={flow.setOtp}
          onSubmit={flow.handleVerifyCode}
        />
      ) : null}
      {flow.step === "password" ? (
        <ResetPasswordStep
          confirmPassword={flow.confirmPassword}
          error={flow.error}
          loading={flow.loading}
          password={flow.password}
          onConfirmPasswordChange={flow.setConfirmPassword}
          onPasswordChange={flow.setPassword}
          onSubmit={flow.handleResetPassword}
        />
      ) : null}
      {flow.step === "success" ? (
        <ResetSuccessStep callbackUrl={search.callbackUrl} email={flow.normalizedEmail} />
      ) : null}
    </AuthCenteredShell>
  );
}
