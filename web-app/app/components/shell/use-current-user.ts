import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { authClient } from "@/lib/auth-client";

export function useCurrentUser() {
  const { data: session } = authClient.useSession();
  const me = useQuery(api.users.account.getMe, {});

  const email = session?.user?.email ?? "";
  const name = session?.user?.name?.trim() || email.split("@")[0] || "Account";
  const image = session?.user?.image ?? undefined;
  const initials = (name || email || "?").slice(0, 2).toUpperCase();

  return { name, email, image, initials, isAdmin: me?.isAdmin === true };
}
