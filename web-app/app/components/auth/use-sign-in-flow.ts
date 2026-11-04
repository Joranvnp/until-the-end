import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { AuthSearch } from "@/lib/auth-utils";

export type SignInMode = "code" | "password";
export type SignInCodeStep = "email" | "code";

export function useSignInFlow(search: AuthSearch) {
  // Email code is the default path; password remains available for existing users.
  const [mode, setMode] = useState<SignInMode>("code");
  const [email, setEmail] = useState(search.email ?? "");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [codeStep, setCodeStep] = useState<SignInCodeStep>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedEmail = email.trim().toLowerCase();

  const switchMode = (next: SignInMode) => {
    setMode(next);
    setError("");
    setOtp("");
    setCodeStep("email");
  };

  const backToEmailStep = () => {
    setCodeStep("email");
    setOtp("");
    setError("");
  };

  const handlePasswordSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!normalizedEmail || !password || loading) return;

    setError("");
    setLoading(true);
    try {
      const res = await authClient.signIn.email({
        email: normalizedEmail,
        password,
        rememberMe: true,
      });
      if (res.error) {
        setError("Invalid email or password.");
        return;
      }
      navigateToCallback(search.callbackUrl);
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!normalizedEmail || loading) return;

    setError("");
    setLoading(true);
    try {
      const res = await authClient.emailOtp.sendVerificationOtp({
        email: normalizedEmail,
        type: "sign-in",
      });
      if (res.error) {
        setError("Unable to send a code. Try again.");
        return;
      }
      setOtp("");
      setCodeStep("code");
    } catch {
      setError("Unable to send a code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (!normalizedEmail || code.length !== 6 || loading) return;

    setError("");
    setLoading(true);
    try {
      const res = await authClient.signIn.emailOtp({
        email: normalizedEmail,
        otp: code,
      });
      if (res.error) {
        setError("Invalid or expired code.");
        setOtp("");
        return;
      }
      navigateToCallback(search.callbackUrl);
    } catch {
      setError("Invalid or expired code.");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  return {
    mode,
    email,
    setEmail,
    password,
    setPassword,
    otp,
    setOtp,
    codeStep,
    loading,
    setLoading,
    error,
    setError,
    switchMode,
    backToEmailStep,
    handlePasswordSignIn,
    handleSendOtp,
    handleVerifyOtp,
  };
}

function navigateToCallback(callbackUrl: string) {
  window.location.assign(callbackUrl);
}
