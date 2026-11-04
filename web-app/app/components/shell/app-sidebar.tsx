import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Check,
  ChevronsUpDown,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Settings2,
  Shield,
  Sun,
  SunMoon,
  Users,
} from "lucide-react";
import { SiteConfig } from "@site-config";
import { AppLogoMark } from "@/components/app-logo-mark";
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

const ADMIN_PATH = "/admin";
type Theme = "light" | "dark" | "system";

const MAIN_NAV = [
  { path: ADMIN_PATH, label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: `${ADMIN_PATH}/users`, label: "Users", icon: Users, end: false },
  {
    path: `${ADMIN_PATH}/payments`,
    label: "Payments",
    icon: CreditCard,
    end: false,
  },
] as const;

export function AppSidebar({ email, onLogout }: { email: string; onLogout: () => void }) {
  const { theme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const pathname = location.pathname;

  const displayEmail = session?.user?.email ?? email;
  const name =
    session?.user?.name?.trim() || displayEmail.split("@")[0] || "Admin";
  const image = session?.user?.image ?? undefined;
  const initials = (name || displayEmail || "?").slice(0, 2).toUpperCase();
  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              variant="outline"
              render={<Link to={ADMIN_PATH} />}
            >
              <AppLogoMark size={28} />
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Admin</span>
                <span className="truncate text-xs text-muted-foreground">
                  {SiteConfig.title}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_NAV.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={
                      item.end
                        ? pathname === item.path
                        : pathname.startsWith(item.path)
                    }
                    tooltip={item.label}
                    render={<Link to={item.path} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton variant="outline" render={<Link to="/app" />}>
              <Home />
              <span>Application</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                  />
                }
              >
                <Avatar className="size-8 rounded-lg">
                  {image ? <AvatarImage src={image} alt={name} /> : null}
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {displayEmail}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--anchor-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="size-8 rounded-lg">
                        {image ? <AvatarImage src={image} alt={name} /> : null}
                        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {displayEmail}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate({ to: "/app" })}>
                    <LayoutDashboard />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/account" })}>
                    <Settings2 />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <Shield />
                    Admin
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <SunMoon />
                    Theme
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {themeOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                      >
                        <option.icon />
                        {option.label}
                        {theme === option.value ? (
                          <Check className="ml-auto size-4" />
                        ) : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
