import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { authPrimaryButtonClassName } from "@/components/auth/auth-form-styles";
import { Button } from "@/components/ui/button";

export function ResetSuccessStep({
  callbackUrl,
  email,
}: {
  callbackUrl: string;
  email: string;
}) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="size-6" />
      </div>
      <Button
        className={authPrimaryButtonClassName}
        size="lg"
        render={<Link to="/auth/signin" search={{ callbackUrl, email }} />}
      >
        Sign in
      </Button>
      <p className="text-xs text-muted-foreground">
        Use <span className="font-medium text-foreground">{email}</span> and
        your new password.
      </p>
    </div>
  );
}
