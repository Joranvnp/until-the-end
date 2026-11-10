import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { api } from "@convex/_generated/api";

type AuthProvider = "apple" | "github" | "google";

const socialButtonClassName =
  "h-12 w-full rounded-xl border-border bg-foreground text-background shadow-none transition-transform hover:bg-foreground/90 hover:text-background active:scale-[0.96] motion-reduce:transform-none disabled:bg-foreground disabled:text-background dark:border-white/10 dark:bg-white dark:text-black dark:hover:bg-white/90 dark:hover:text-black";

export function SocialAuthButtons({
  callbackUrl,
  disabled,
  onError,
  onPendingChange,
}: {
  callbackUrl: string;
  disabled?: boolean;
  onError: (message: string) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const providers = useQuery(api.auth.getEnabledAuthProviders, {});
  const showGoogle = providers?.google ?? false;
  const showApple = providers?.apple ?? false;
  const showGitHub = providers?.github ?? false;

  if (!showGoogle && !showApple && !showGitHub) {
    return null;
  }

  const handleSocial = async (provider: AuthProvider) => {
    onError("");
    onPendingChange(true);
    try {
      const res = await authClient.signIn.social({
        provider,
        callbackURL: new URL(callbackUrl, window.location.origin).href,
      });
      if (res?.error) {
        onError("This sign-in provider is unavailable right now.");
        onPendingChange(false);
      }
    } catch {
      onError("This sign-in provider is unavailable right now.");
      onPendingChange(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-5 text-sm">
        <span className="h-px flex-1 bg-border/80" />
        <span className="text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border/80" />
      </div>
      <div className="space-y-2">
        {showApple ? (
          <Button
            size="lg"
            className={socialButtonClassName}
            onClick={() => void handleSocial("apple")}
            disabled={disabled}
          >
            {disabled ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <AppleIcon />
            )}
            Continue with Apple
          </Button>
        ) : null}
        {showGitHub ? (
          <Button
            size="lg"
            className={socialButtonClassName}
            onClick={() => void handleSocial("github")}
            disabled={disabled}
          >
            {disabled ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <GitHubIcon />
            )}
            Continue with GitHub
          </Button>
        ) : null}
        {showGoogle ? (
          <Button
            size="lg"
            className={socialButtonClassName}
            onClick={() => void handleSocial("google")}
            disabled={disabled}
          >
            {disabled ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </Button>
        ) : null}
      </div>
    </>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.92.58.11.79-.25.79-.56v-2.16c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18.92-.26 1.9-.38 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.83 1.19 3.08 0 4.42-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.13v3.16c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="currentColor"
        d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.4 14.97.5 12 .5A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.37 12 4.75Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M16.36 12.78c.02-2.04 1.67-3.02 1.74-3.07-.95-1.39-2.42-1.58-2.95-1.6-1.25-.13-2.45.74-3.09.74-.64 0-1.62-.72-2.67-.7-1.37.02-2.64.8-3.34 2.03-1.43 2.48-.37 6.15 1.02 8.16.68.99 1.49 2.09 2.55 2.05 1.02-.04 1.41-.66 2.65-.66 1.23 0 1.58.66 2.66.64 1.1-.02 1.79-1 2.46-1.99.78-1.14 1.1-2.25 1.12-2.31-.03-.01-2.14-.82-2.16-3.26ZM14.33 6.78c.56-.68.94-1.62.84-2.56-.81.03-1.79.54-2.37 1.22-.52.6-.97 1.56-.85 2.48.9.07 1.82-.46 2.38-1.14Z" />
    </svg>
  );
}
