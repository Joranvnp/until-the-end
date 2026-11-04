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

export function NameCard({
  userId,
  defaultName,
}: {
  userId: Id<"users">;
  defaultName: string;
}) {
  const updateUserName = useMutation(api.admin.mutations.updateUserName);
  const [name, setName] = useState(defaultName);
  const [pending, setPending] = useState(false);
  const dirty = name.trim() !== defaultName.trim();

  const save = async () => {
    if (pending || !dirty) return;
    setPending(true);
    try {
      await updateUserName({ userId, name });
      toast.success("Name updated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update name");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Name</CardTitle>
        <CardDescription>The user's display name.</CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-sm"
          placeholder="User name"
          onKeyDown={(e) => {
            if (e.key === "Enter") void save();
          }}
        />
      </CardContent>
      <CardFooter className="justify-between">
        <p className="text-muted-foreground text-sm">Between 1 and 64 characters.</p>
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
