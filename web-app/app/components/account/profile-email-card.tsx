import { Link } from "@tanstack/react-router";
import { BadgeCheck, Loader2, Mail, MailCheck, MailWarning } from "lucide-react";
import { useState } from "react";
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
import { authClient } from "@/lib/auth-client";

export function ProfileEmailCard({
  email,
  emailVerified,
}: {
  email: string;
  emailVerified: boolean;
}) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendVerificationEmail = async () => {
    if (sending || emailVerified) return;
    setSending(true);
    setMessage(null);
    setError(null);

    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/account",
      });
      if (result.error) {
        throw result.error;
      }
      setMessage("Verification email sent. Check your inbox.");
    } catch (e: unknown) {
      console.error(e);
      setError(
        e instanceof Error
          ? e.message
          : "Unable to send a verification email.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-4 text-primary" />
          Your Email
        </CardTitle>
        <CardDescription>
          This is the email used to sign in, receive security mail, and connect
          your mobile and web sessions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            id="account-email"
            value={email}
            readOnly
            className="max-w-sm"
            aria-label="Current email"
          />
          {emailVerified ? (
            <Badge variant="secondary" className="w-fit gap-1">
              <BadgeCheck className="size-3" />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="w-fit gap-1">
              <MailWarning className="size-3" />
              Unverified
            </Badge>
          )}
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          {emailVerified ? (
            <p>
              Email changes require confirmation from your current inbox before
              the login email is replaced.
            </p>
          ) : (
            <p>
              Because this email is not verified, changing it sends a
              verification link to the new address before the account moves.
            </p>
          )}
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
        <p className="text-xs text-muted-foreground">
          Verification protects account recovery and payment access.
        </p>
        <div className="flex flex-wrap gap-2">
          {!emailVerified ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void sendVerificationEmail()}
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MailCheck className="size-4" />
              )}
              Verify email
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            render={<Link to="/account/change-email" />}
          >
            Change email
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
