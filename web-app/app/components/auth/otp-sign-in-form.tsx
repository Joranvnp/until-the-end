import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { AuthError } from "@/components/auth/auth-error";
import { authPrimaryButtonClassName } from "@/components/auth/auth-form-styles";
import { SignInEmailField } from "@/components/auth/sign-in-email-field";
import type { SignInCodeStep } from "@/components/auth/use-sign-in-flow";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

const otpSlotClassName =
  "size-11 rounded-xl border-border bg-muted/45 text-base font-semibold shadow-none dark:border-white/15 dark:bg-white/5";
const OTP_LENGTH = 6;

export function OtpSignInForm({
  codeStep,
  email,
  error,
  loading,
  otp,
  onBack,
  onEmailChange,
  onOtpChange,
  onSendOtp,
  onVerifyOtp,
}: {
  codeStep: SignInCodeStep;
  email: string;
  error: string;
  loading: boolean;
  otp: string;
  onBack: () => void;
  onEmailChange: (value: string) => void;
  onOtpChange: (value: string) => void;
  onSendOtp: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onVerifyOtp: (code: string) => Promise<void>;
}) {
  if (codeStep === "code") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="max-w-sm text-pretty text-sm leading-6 text-muted-foreground">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold text-foreground">{email}</span>
          </p>
          <InputOTP
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={onOtpChange}
            onComplete={(code) => void onVerifyOtp(code)}
            disabled={loading}
            containerClassName="justify-center"
            className={cn({ "animate-pulse": loading })}
            autoFocus
          >
            <InputOTPGroup className="gap-2">
              {Array.from({ length: OTP_LENGTH }, (_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className={otpSlotClassName}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <AuthError message={error} align="center" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-10 w-full rounded-xl font-semibold"
          onClick={onBack}
          disabled={loading}
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void onSendOtp(event)}>
      <SignInEmailField
        value={email}
        onChange={onEmailChange}
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
        Send code
      </Button>
    </form>
  );
}
