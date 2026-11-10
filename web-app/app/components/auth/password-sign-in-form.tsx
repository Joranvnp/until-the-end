import type { FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Lock } from "lucide-react";
import { AuthError } from "@/components/auth/auth-error";
import {
  authIconFrameClassName,
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-form-styles";
import { SignInEmailField } from "@/components/auth/sign-in-email-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordSignInForm({
  callbackUrl,
  email,
  error,
  loading,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: {
  callbackUrl: string;
  email: string;
  error: string;
  loading: boolean;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
      <SignInEmailField
        value={email}
        onChange={onEmailChange}
        disabled={loading}
        invalid={Boolean(error)}
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="signin-password" className="text-sm font-semibold">
            Password
          </Label>
          <Link
            to="/auth/forget-password"
            search={{
              callbackUrl,
              email: email.trim().toLowerCase() || undefined,
            }}
            className="rounded-md text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <span className={authIconFrameClassName}>
            <Lock className="size-4" />
          </span>
          <Input
            id="signin-password"
            type="password"
            autoComplete="current-password"
            className={authInputClassName}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            disabled={loading}
            aria-invalid={Boolean(error)}
            required
          />
        </div>
      </div>
      <AuthError message={error} />
      <Button
        type="submit"
        className={authPrimaryButtonClassName}
        size="lg"
        disabled={loading}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Sign in
      </Button>
    </form>
  );
}
