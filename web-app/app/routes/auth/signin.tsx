import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, ShieldCheck, Smartphone } from "lucide-react";
import { SiteConfig } from "@site-config";
import { AuthModeSwitch } from "@/components/auth/auth-mode-switch";
import {
  AuthPageLoader,
  AuthSplitShell,
  AuthVisualPanel,
  type AuthVisualHighlight,
} from "@/components/auth/auth-shell";
import { OtpSignInForm } from "@/components/auth/otp-sign-in-form";
import { PasswordSignInForm } from "@/components/auth/password-sign-in-form";
import { RedirectToCallback } from "@/components/auth/redirect-to-callback";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { useSignInFlow } from "@/components/auth/use-sign-in-flow";
import { AuthSplitRouteSkeleton } from "@/components/skeletons/auth-route-skeletons";
import { authClient } from "@/lib/auth-client";
import { type AuthSearch, validateAuthSearch } from "@/lib/auth-utils";

const signInHighlights: AuthVisualHighlight[] = [
  {
    icon: Smartphone,
    title: "One account on every screen",
    description: "Keep iOS, Android, and the web companion in sync.",
  },
  {
    icon: ShieldCheck,
    title: "Secure access included",
    description: "Email codes, passwords, and connected providers are ready.",
  },
  {
    icon: CreditCard,
    title: "Native and web payments",
    description: "Apple purchases and Stripe access share one entitlement.",
  },
];

export const Route = createFileRoute("/auth/signin")({
  validateSearch: validateAuthSearch,
  head: () => ({
    meta: [
      { title: `Sign in | ${SiteConfig.title}` },
      { name: "description", content: `Sign in to ${SiteConfig.title}.` },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SignInPage,
  pendingComponent: AuthSplitRouteSkeleton,
});

function SignInPage() {
  const search = Route.useSearch();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <AuthPageLoader />;
  }

  if (session?.user) {
    return <RedirectToCallback callbackUrl={search.callbackUrl} />;
  }

  return <SignInContent search={search} />;
}

function SignInContent({ search }: { search: AuthSearch }) {
  const flow = useSignInFlow(search);

  return (
    <AuthSplitShell
      eyebrow="Welcome back"
      title={`Sign in to ${SiteConfig.title}`}
      description="Use an email code, your password, or a connected provider."
      visual={
        <AuthVisualPanel
          eyebrow="Expo · Convex · TanStack Start"
          title={
            <>
              Your mobile product,{" "}
              <em className="font-normal text-white/70">
                connected everywhere.
              </em>
            </>
          }
          description="Sign in once to keep your mobile app, web companion, admin tools, and access state working together."
          highlights={signInHighlights}
          footer="Built for mobile products that extend beyond the phone."
        />
      }
    >
      <div className="space-y-6">
        {flow.mode === "code" ? (
          <div className="space-y-5">
            <OtpSignInForm
              codeStep={flow.codeStep}
              email={flow.email}
              error={flow.error}
              loading={flow.loading}
              otp={flow.otp}
              onBack={flow.backToEmailStep}
              onEmailChange={flow.setEmail}
              onOtpChange={flow.setOtp}
              onSendOtp={flow.handleSendOtp}
              onVerifyOtp={flow.handleVerifyOtp}
            />
            <AuthModeSwitch
              prompt="Prefer to use a password?"
              action="Sign in with password"
              onClick={() => flow.switchMode("password")}
            />
          </div>
        ) : (
          <div className="space-y-5">
            <PasswordSignInForm
              email={flow.email}
              error={flow.error}
              loading={flow.loading}
              password={flow.password}
              callbackUrl={search.callbackUrl}
              onEmailChange={flow.setEmail}
              onPasswordChange={flow.setPassword}
              onSubmit={flow.handlePasswordSignIn}
            />
            <AuthModeSwitch
              prompt="Want faster sign in?"
              action="Use an email code"
              onClick={() => flow.switchMode("code")}
            />
          </div>
        )}

        <SocialAuthButtons
          callbackUrl={search.callbackUrl}
          disabled={flow.loading}
          onError={flow.setError}
          onPendingChange={flow.setLoading}
        />

        <p className="text-center text-sm leading-6 text-muted-foreground">
          No account yet?{" "}
          <Link
            to="/auth/signup"
            search={{ callbackUrl: search.callbackUrl }}
            className="rounded-md font-semibold text-foreground underline-offset-4 transition-colors hover:text-foreground/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
          >
            Create one
          </Link>
        </p>
      </div>
    </AuthSplitShell>
  );
}
