import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export function useSignUpFlow(callbackUrl: string) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName || !normalizedEmail || loading) return;
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
      const res = await authClient.signUp.email({
        email: normalizedEmail,
        password,
        name: trimmedName,
      });
      if (res.error) {
        setError("Unable to create this account. Try signing in instead.");
        return;
      }
      window.location.assign(callbackUrl);
    } catch {
      setError("Unable to create this account. Try signing in instead.");
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
