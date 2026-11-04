import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  CreditCard,
  LayoutDashboard,
  Search,
  Shield,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@convex/_generated/api";

const NAV_ITEMS = [
  { label: "Overview", to: "/admin", icon: LayoutDashboard },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Payments", to: "/admin/payments", icon: CreditCard },
] as const;

export function AdminCommand() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setQuery(input.trim()), 250);
    return () => clearTimeout(id);
  }, [input]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) setInput("");
  }, [open]);

  const results = useQuery(
    api.admin.queries.searchCommand,
    query ? { q: query } : "skip",
  );
  const isSearching = Boolean(query) && results === undefined;

  const go = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-full max-w-64 items-center gap-2 rounded-lg border px-3 text-sm shadow-sm shadow-black/5 transition-colors"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="bg-muted text-muted-foreground pointer-events-none hidden items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
        >
          <Command shouldFilter={false} className="rounded-xl">
            <CommandInput
              placeholder="Search users by email, or jump to a page…"
              value={input}
              onValueChange={setInput}
              autoFocus
            />
            <CommandList>
              {!query ? (
                <CommandGroup heading="Go to">
                  {NAV_ITEMS.map((item) => (
                    <CommandItem
                      key={item.to}
                      value={item.label}
                      onSelect={() => go(() => navigate({ to: item.to }))}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : isSearching ? (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  Searching…
                </div>
              ) : results && results.users.length > 0 ? (
                <CommandGroup heading="Users">
                  {results.users.map((user) => (
                    <CommandItem
                      key={user._id}
                      value={user._id}
                      onSelect={() =>
                        go(() =>
                          navigate({
                            to: "/admin/users/$userId",
                            params: { userId: user._id },
                          }),
                        )
                      }
                    >
                      <Avatar className="size-7 rounded-md">
                        <AvatarFallback className="rounded-md text-xs">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">
                          {user.email}
                        </span>
                        {user.name ? (
                          <span className="text-muted-foreground truncate text-xs">
                            {user.name}
                          </span>
                        ) : null}
                      </div>
                      {user.isAdmin ? (
                        <Shield className="ml-auto size-3.5" />
                      ) : user.bannedAt ? (
                        <span className="text-destructive ml-auto text-xs">
                          Banned
                        </span>
                      ) : (
                        <User className="ml-auto size-3.5" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <CommandEmpty>No users found for “{query}”.</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
