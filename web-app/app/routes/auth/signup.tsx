import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, PanelsTopLeft, Rocket } from "lucide-react";
import { SiteConfig } from "@site-config";
import {
  AuthPageLoader,
  AuthSplitShell,
  AuthVisualPanel,
  type AuthVisualHighlight,
} from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AuthSplitRouteSkeleton } from "@/components/skeletons/auth-route-skeletons";
import { RedirectToCallback } from "@/components/auth/redirect-to-callback";
import { authClient } from "@/lib/auth-client";
import { validateAuthSearch } from "@/lib/auth-utils";

const signUpHighlights: AuthVisualHighlight[] = [
  {
    icon: Rocket,
    title: "Start with one account",
    description: "Create your identity once, then use it across every surface.",
  },
  {
    icon: PanelsTopLeft,
    title: "Web companion included",
    description: "Your signed-in web app and account area are ready to extend.",
  },
  {
    icon: BadgeCheck,
    title: "Store-ready foundations",
    description:
      "Auth, entitlements, and release workflows already fit together.",
  },
];

export const Route = createFileRoute("/auth/signup")({
  validateSearch: validateAuthSearch,
  head: () => ({
    meta: [
      { title: `Create account | ${SiteConfig.title}` },
      {
        name: "description",
        content: `Create your ${SiteConfig.title} account.`,
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SignUpPage,
  pendingComponent: AuthSplitRouteSkeleton,
});

function SignUpPage() {
  const search = Route.useSearch();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <AuthPageLoader />;
  }

  if (session?.user) {
    return <RedirectToCallback callbackUrl={search.callbackUrl} />;
  }

  return (
    <AuthSplitShell
      eyebrow="Get started"
      title={`Create your ${SiteConfig.title} account`}
      description="One account connects your mobile app, web companion, and purchases."
      visual={
        <AuthVisualPanel
          eyebrow="One account · Every surface"
          title={
            <>
              Start on mobile,{" "}
              <em className="font-normal text-white/70">continue anywhere.</em>
            </>
          }
          description="Create your account once, then carry the same identity and access across iOS, Android, and the web."
          highlights={signUpHighlights}
          footer="No workspace or organization setup required."
          imagePosition="object-[58%_center]"
        />
      }
    >
      <div className="space-y-5">
        <SignUpForm callbackUrl={search.callbackUrl} />
        <p className="text-center text-sm leading-6 text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/auth/signin"
            search={{ callbackUrl: search.callbackUrl }}
            className="rounded-md font-semibold text-foreground underline-offset-4 transition-colors hover:text-foreground/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthSplitShell>
  );
}
