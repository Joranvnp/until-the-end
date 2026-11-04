import { useNavigate } from "@tanstack/react-router";
import { CreditCard, House, Search, Shield, User2 } from "lucide-react";
import { useMemo } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCommandSearch } from "@/components/shell/use-command-search";

const APP_SEARCH_NAV = [
  { to: "/app", label: "Home", hint: "Application dashboard", icon: House },
  { to: "/account", label: "Account", hint: "Profile and settings", icon: User2 },
  { to: "/account/plan", label: "Plan", hint: "Billing and access", icon: CreditCard },
  { to: "/account/identity", label: "Identity", hint: "Email and sign-in", icon: Shield },
] as const;

export function AppCommand({ isAdmin }: { isAdmin: boolean }) {
  const navigate = useNavigate();
  const items = useMemo(
    () =>
      isAdmin
        ? [
            ...APP_SEARCH_NAV,
            {
              to: "/admin",
              label: "Admin",
              hint: "Platform administration",
              icon: Shield,
            },
          ]
        : APP_SEARCH_NAV,
    [isAdmin],
  );
  const { open, setOpen, search, setSearch, filtered } = useCommandSearch(items);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="border-sidebar-border bg-background text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-8 w-full items-center gap-2 rounded-lg border px-2.5 text-sm shadow-sm shadow-black/5 transition-colors group-data-[collapsible=icon]:hidden"
      >
        <Search className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">Search...</span>
        <kbd className="bg-muted text-muted-foreground pointer-events-none hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
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
              placeholder="Search pages in this app..."
              value={search}
              onValueChange={setSearch}
              autoFocus
            />
            <CommandList>
              {filtered.length > 0 ? (
                <CommandGroup heading="Go to">
                  {filtered.map((item) => (
                    <CommandItem
                      key={item.to}
                      value={item.label}
                      onSelect={() => {
                        setOpen(false);
                        void navigate({ to: item.to });
                      }}
                    >
                      <item.icon />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{item.label}</span>
                        <span className="text-muted-foreground truncate text-xs">
                          {item.hint}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <CommandEmpty>No pages found for "{search}".</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
