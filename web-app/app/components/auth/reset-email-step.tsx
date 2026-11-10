import type { FormEvent } from "react";
import { Loader2, Mail } from "lucide-react";
import { AuthError } from "@/components/auth/auth-error";
import {
  authIconFrameClassName,
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-form-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetEmailStep({
  email,
  error,
  loading,
  onEmailChange,
  onSubmit,
}: {
  email: string;
  error: string;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
      <div className="space-y-2">
        <Label htmlFor="reset-email" className="text-sm font-semibold">
          Email
        </Label>
        <div className="relative">
          <span className={authIconFrameClassName}>
            <Mail className="size-4" aria-hidden="true" />
          </span>
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            className={authInputClassName}
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="you@example.com"
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
        Send reset code
      </Button>
    </form>
  );
}
