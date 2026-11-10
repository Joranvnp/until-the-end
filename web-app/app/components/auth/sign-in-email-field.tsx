import { Mail } from "lucide-react";
import {
  authIconFrameClassName,
  authInputClassName,
} from "@/components/auth/auth-form-styles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInEmailField({
  disabled,
  invalid,
  value,
  onChange,
}: {
  disabled: boolean;
  invalid?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="signin-email" className="text-sm font-semibold">
        Email
      </Label>
      <div className="relative">
        <span className={authIconFrameClassName}>
          <Mail className="size-4" />
        </span>
        <Input
          id="signin-email"
          type="email"
          autoComplete="email"
          className={authInputClassName}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="you@example.com"
          disabled={disabled}
          aria-invalid={invalid}
          required
        />
      </div>
    </div>
  );
}
