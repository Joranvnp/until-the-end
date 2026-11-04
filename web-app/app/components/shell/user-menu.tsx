import { useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronsUpDown,
  House,
  LogOut,
  Monitor,
  Moon,
  Settings2,
  Shield,
  Sun,
  SunMoon,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/components/shell/use-current-user";

type Theme = "light" | "dark" | "system";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function UserIdentity({
  name,
  email,
  image,
  initials,
}: {
  name: string;
  email: string;
  image: string | undefined;
  initials: string;
}) {
  return (
    <>
      <Avatar className="size-8 rounded-lg">
        {image ? <AvatarImage src={image} alt={name} /> : null}
        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">{name}</span>
        <span className="truncate text-xs text-muted-foreground">{email}</span>
      </div>
    </>
  );
}

export function UserMenu({ onLogout }: { onLogout: () => void }) {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { name, email, image, initials, isAdmin } = useCurrentUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            variant="outline"
            className="h-12 border bg-secondary data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
          />
        }
      >
        <UserIdentity name={name} email={email} image={image} initials={initials} />
        <ChevronsUpDown className="ml-auto size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--anchor-width) min-w-56 rounded-lg"
        side="top"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <UserIdentity
                name={name}
                email={email}
                image={image}
                initials={initials}
              />
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {isAdmin ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                <Shield />
                Admin dashboard
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate({ to: "/app" })}>
            <House />
            Home
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/account" })}>
            <Settings2 />
            Account settings
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <SunMoon />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {THEME_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                >
                  <option.icon />
                  {option.label}
                  {theme === option.value ? <Check className="ml-auto size-4" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
