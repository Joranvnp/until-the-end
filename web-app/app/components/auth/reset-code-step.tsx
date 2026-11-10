import type { FormEvent } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { AuthError } from "@/components/auth/auth-error";
import { authPrimaryButtonClassName } from "@/components/auth/auth-form-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetCodeStep({
  email,
  error,
  loading,
  otp,
  onBack,
  onOtpChange,
  onSubmit,
}: {
  email: string;
  error: string;
  loading: boolean;
  otp: string;
  onBack: () => void;
  onOtpChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
      <div className="space-y-3 text-center">
        <ShieldCheck className="mx-auto size-8 text-primary" />
        <Label htmlFor="reset-code" className="block text-sm font-medium">
          Reset code
        </Label>
        <div className="flex justify-center">
          <Input
            id="reset-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(event) =>
              onOtpChange(event.target.value.replace(/\D/g, ""))
            }
            placeholder="000000"
            className="h-11 w-40 text-center font-mono text-lg tracking-[0.35em]"
            disabled={loading}
            required
          />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          We sent the code to{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>
      <AuthError message={error} align="center" />
      <Button
        type="submit"
        className={authPrimaryButtonClassName}
        size="lg"
        disabled={loading}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Continue
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-10 w-full rounded-xl font-semibold"
        onClick={onBack}
      >
        Use a different email
      </Button>
    </form>
  );
}
