import { useEffect } from "react";
import { AuthPageLoader } from "@/components/auth/auth-shell";

export function RedirectToCallback({ callbackUrl }: { callbackUrl: string }) {
  useEffect(() => {
    window.location.replace(callbackUrl);
  }, [callbackUrl]);

  return <AuthPageLoader />;
}
