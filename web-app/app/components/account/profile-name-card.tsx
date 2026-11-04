import { useMutation } from "convex/react";
import { Loader2, Save, User2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { api } from "@convex/_generated/api";

const profileErrorMessages = new Set([
  "Name is required",
  "Name must be 64 characters or fewer",
]);

export function ProfileNameCard({ currentName }: { currentName: string }) {
  const updateProfile = useMutation(api.users.account.updateProfile);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const trimmedName = name.trim();
  const hasNameChange = useMemo(
    () => trimmedName !== currentName,
    [trimmedName, currentName],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedName || !hasNameChange || saving) return;

    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const authResult = await authClient.updateUser({ name: trimmedName });
      if (authResult.error) {
        throw authResult.error;
      }
      const result = await updateProfile({ name: trimmedName });
      setName(result.name);
      setMessage("Name updated");
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "";
      setError(
        profileErrorMessages.has(msg) ? msg : "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User2 className="size-4 text-primary" />
            Your Name
          </CardTitle>
          <CardDescription>
            This is your display name across account and admin surfaces.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-sm space-y-2">
            <Label htmlFor="account-name">Display name</Label>
            <Input
              id="account-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setMessage(null);
                setError(null);
              }}
              maxLength={64}
              disabled={saving}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "account-name-error" : undefined}
              placeholder="Your name"
            />
          </div>
          {message ? (
            <p className="text-sm text-emerald-600" role="status" aria-live="polite">
              {message}
            </p>
          ) : null}
          {error ? (
            <p id="account-name-error" className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="justify-between gap-3 text-xs text-muted-foreground max-sm:flex-col max-sm:items-start">
          <p>Names can be up to 64 characters.</p>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={!trimmedName || !hasNameChange || saving}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
