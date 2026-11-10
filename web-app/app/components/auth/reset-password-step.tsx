import type { FormEvent } from "react";
import { Loader2, Lock } from "lucide-react";
import { AuthError } from "@/components/auth/auth-error";
import {
  authIconFrameClassName,
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-form-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordStep({
  confirmPassword,
  error,
  loading,
  password,
  onConfirmPasswordChange,
  onPasswordChange,
  onSubmit,
}: {
  confirmPassword: string;
  error: string;
  loading: boolean;
  password: string;
  onConfirmPasswordChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
      <PasswordInput
        id="reset-password"
        label="New password"
        value={password}
        onChange={onPasswordChange}
        disabled={loading}
        invalid={Boolean(error)}
      />
      <PasswordInput
        id="reset-confirm-password"
        label="Confirm password"
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        disabled={loading}
        invalid={Boolean(error)}
      />
      <AuthError message={error} />
      <Button
        type="submit"
        className={authPrimaryButtonClassName}
        size="lg"
        disabled={loading}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Reset password
      </Button>
    </form>
  );
}

function PasswordInput({
  disabled,
  invalid,
  id,
  label,
  value,
  onChange,
}: {
  disabled: boolean;
  invalid: boolean;
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <div className="relative">
        <span className={authIconFrameClassName}>
          <Lock className="size-4" aria-hidden="true" />
        </span>
        <Input
          id={id}
          type="password"
          autoComplete="new-password"
          minLength={8}
          className={authInputClassName}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-invalid={invalid}
          required
        />
      </div>
    </div>
  );
}
