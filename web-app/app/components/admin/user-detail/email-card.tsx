import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";
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
import { api } from "@convex/_generated/api";

export function EmailCard({
  userId,
  defaultEmail,
}: {
  userId: Id<"users">;
  defaultEmail: string;
}) {
  const updateUserEmail = useMutation(api.admin.mutations.updateUserEmail);
  const [email, setEmail] = useState(defaultEmail);
  const [pending, setPending] = useState(false);
  const dirty = email.trim().toLowerCase() !== defaultEmail.trim().toLowerCase();

  const save = async () => {
    if (pending || !dirty) return;
    setPending(true);
    try {
      await updateUserEmail({ userId, email });
      toast.success("Email updated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update email");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Email</CardTitle>
        <CardDescription>The user's primary email address.</CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="max-w-sm"
          placeholder="user@example.com"
          onKeyDown={(e) => {
            if (e.key === "Enter") void save();
          }}
        />
      </CardContent>
      <CardFooter className="justify-between">
        <p className="text-muted-foreground text-sm">Must be a valid email.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void save()}
          disabled={pending || !dirty}
        >
          {pending ? "Saving…" : "Save"}
        </Button>
      </CardFooter>
    </Card>
  );
}
