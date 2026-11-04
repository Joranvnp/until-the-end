import type { Id } from "@convex/_generated/dataModel";

export type ListedUser = {
  _id: Id<"users">;
  email: string;
  name?: string;
  isAdmin?: boolean;
  bannedAt?: number;
  anonymizedAt?: number;
  createdAt: number;
};
