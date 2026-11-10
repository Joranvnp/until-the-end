import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Loader2,
  MailCheck,
  MailWarning,
  Send,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { AccountPageShell } from "@/components/shell/account-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccountChangeEmailPageSkeleton } from "@/components/skeletons/user-route-skeletons";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/account/change-email")({
  component: ChangeEmailPage,
  pendingComponent: AccountChangeEmailPageSkeleton,
});

function ChangeEmailPage() {
  const { data: session, isPending } = authClient.useSession();
  const [newEmail, setNewEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentEmail = session?.user.email ?? "";
  const emailVerified = session?.user.emailVerified === true;
  const trimmedEmail = newEmail.trim().toLowerCase();
  const canSubmit = useMemo(() => {
    return (
      trimmedEmail.length > 0 &&
      trimmedEmail.includes("@") &&
      trimmedEmail !== currentEmail.toLowerCase()
    );
  }, [currentEmail, trimmedEmail]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const result = await authClient.changeEmail({
        newEmail: trimmedEmail,
        callbackURL: "/account",
      });
      if (result.error) {
        throw result.error;
      }
      setMessage(
        emailVerified
          ? "If this email can be used, the next step will arrive in your current inbox."
          : "If this email can be used, the next step will arrive in the new inbox.",
      );
    } catch (e: unknown) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Unable to start the email change.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isPending) {
    return <AccountChangeEmailPageSkeleton />;
  }

  if (!session?.user) {
    return (
      <AccountPageShell
        title="Change Email"
        description="Confirm account email changes before they take effect."
      >
        <p className="text-sm text-muted-foreground">
          Your account could not be loaded.
        </p>
      </AccountPageShell>
    );
  }

  return (
    <AccountPageShell
      title="Change Email"
      description="Confirm account email changes before they take effect."
    >
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Login Email</CardTitle>
              {emailVerified ? (
                <Badge variant="secondary" className="gap-1">
                  <BadgeCheck className="size-3" />
                  Current email verified
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <MailWarning className="size-3" />
                  Current email unverified
                </Badge>
              )}
            </div>
            <CardDescription>
              Use a reachable inbox. Email changes do not complete until the
              required confirmation step succeeds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current-email">Current email</Label>
                <Input id="current-email" value={currentEmail} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">New email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(event) => {
                    setNewEmail(event.target.value);
                    setMessage(null);
                    setError(null);
                  }}
                  placeholder="new-email@example.com"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MailCheck className="size-4 text-primary" />
                  Verified current email
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  A confirmation link is sent to your current inbox. The new
                  address is applied only after that link is opened.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MailWarning className="size-4 text-primary" />
                  Unverified current email
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  A verification link is sent to the new inbox. The account
                  keeps the current email until the new inbox is verified.
                </p>
              </div>
            </div>

            {message ? (
              <p className="text-sm text-emerald-600" role="status" aria-live="polite">
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="justify-between gap-3 max-sm:flex-col max-sm:items-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              render={<Link to="/account" />}
            >
              <ArrowLeft className="size-4" />
              Back to profile
            </Button>
            <Button type="submit" size="sm" disabled={!canSubmit || submitting}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send confirmation
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AccountPageShell>
  );
}
