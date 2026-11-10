import { Loader2, Lock, Mail, UserRound } from "lucide-react";
import { AuthError } from "@/components/auth/auth-error";
import {
  authIconFrameClassName,
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-form-styles";
import { useSignUpFlow } from "@/components/auth/use-sign-up-flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignUpForm({ callbackUrl }: { callbackUrl: string }) {
  const {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    handleSubmit,
  } = useSignUpFlow(callbackUrl);

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      <div className="space-y-2">
        <Label htmlFor="signup-name" className="text-sm font-semibold">
          Name
        </Label>
        <div className="relative">
          <span className={authIconFrameClassName}>
            <UserRound className="size-4" aria-hidden="true" />
          </span>
          <Input
            id="signup-name"
            autoComplete="name"
            className={authInputClassName}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            disabled={loading}
            aria-invalid={Boolean(error)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-sm font-semibold">
          Email
        </Label>
        <div className="relative">
          <span className={authIconFrameClassName}>
            <Mail className="size-4" aria-hidden="true" />
          </span>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            className={authInputClassName}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            disabled={loading}
            aria-invalid={Boolean(error)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-sm font-semibold">
          Password
        </Label>
        <div className="relative">
          <span className={authIconFrameClassName}>
            <Lock className="size-4" aria-hidden="true" />
          </span>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            className={authInputClassName}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
            aria-invalid={Boolean(error)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="signup-confirm-password"
          className="text-sm font-semibold"
        >
          Confirm password
        </Label>
        <div className="relative">
          <span className={authIconFrameClassName}>
            <Lock className="size-4" aria-hidden="true" />
          </span>
          <Input
            id="signup-confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            className={authInputClassName}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
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
        Create account
      </Button>
    </form>
  );
}
