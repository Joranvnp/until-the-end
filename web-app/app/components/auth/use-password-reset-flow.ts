import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { AuthSearch } from "@/lib/auth-utils";

export type ResetStep = "email" | "code" | "password" | "success";

const resetCopy: Record<ResetStep, { title: string; description: string }> = {
  email: {
    title: "Reset your password",
    description: "Enter your account email and we will send a 6-digit reset code.",
  },
  code: {
    title: "Check your email",
    description: "Enter the 6-digit code to continue resetting your password.",
  },
  password: {
    title: "Choose a new password",
    description: "Use at least 8 characters for your new password.",
  },
  success: {
    title: "Password reset",
    description: "Your password has been updated. You can sign in now.",
  },
};

export function usePasswordResetFlow(search: AuthSearch) {
  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState(search.email ?? "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedEmail = email.trim().toLowerCase();
  const copy = resetCopy[step];

  const backToEmailStep = () => {
    setStep("email");
    setOtp("");
    setError("");
  };

  const handleSendResetCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!normalizedEmail || loading) return;

    setError("");
    setLoading(true);
    try {
      const res = await authClient.emailOtp.requestPasswordReset({
        email: normalizedEmail,
      });
      if (res.error) {
        setError("Unable to send a reset code. Try again.");
        return;
      }
      setEmail(normalizedEmail);
      setStep("code");
    } catch {
      setError("Unable to send a reset code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!normalizedEmail || otp.trim().length !== 6 || loading) return;

    setError("");
    setLoading(true);
    try {
      const res = await authClient.emailOtp.checkVerificationOtp({
        email: normalizedEmail,
        type: "forget-password",
        otp: otp.trim(),
      });
      if (res.error) {
        setError("Invalid or expired code.");
        return;
      }
      setStep("password");
    } catch {
      setError("Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await authClient.emailOtp.resetPassword({
        email: normalizedEmail,
        otp: otp.trim(),
        password,
      });
      if (res.error) {
        setError("Unable to reset the password. Request a new code and try again.");
        return;
      }
      setStep("success");
    } catch {
      setError("Unable to reset the password. Request a new code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return {
    step,
    copy,
    email,
    setEmail,
    normalizedEmail,
    otp,
    setOtp,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    backToEmailStep,
    handleSendResetCode,
    handleVerifyCode,
    handleResetPassword,
  };
}
