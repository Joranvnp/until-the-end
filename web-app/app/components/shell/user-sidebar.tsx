import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, House, Shield, User2 } from "lucide-react";
import { SiteConfig } from "@site-config";
import { AppLogoMark } from "@/components/app-logo-mark";
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
} from "@/components/ui/sidebar";
import { AppCommand } from "@/components/shell/app-command";
import { UserMenu } from "@/components/shell/user-menu";
import { useCurrentUser } from "@/components/shell/use-current-user";

type NavItem = {
  to: string;
  label: string;
  icon: typeof House;
  end: boolean;
};

const APP_NAV: NavItem[] = [{ to: "/app", label: "Home", icon: House, end: true }];

const ACCOUNT_NAV: NavItem[] = [
  { to: "/account", label: "Profile", icon: User2, end: true },
  { to: "/account/plan", label: "Plan", icon: CreditCard, end: false },
  { to: "/account/identity", label: "Identity", icon: Shield, end: false },
];

function matchActive(pathname: string, item: NavItem): boolean {
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function SidebarNavItems({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return items.map((item) => (
    <SidebarMenuItem key={item.to}>
      <SidebarMenuButton
        isActive={matchActive(pathname, item)}
        tooltip={item.label}
        render={<Link to={item.to} />}
      >
        <item.icon />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ));
}

export function UserSidebar({ onLogout }: { onLogout: () => void }) {
  const { isAdmin } = useCurrentUser();
  const location = useRouterState({ select: (s) => s.location });
  const pathname = location.pathname;

  const isAccountSection =
    pathname === "/account" || pathname.startsWith("/account/");

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {isAccountSection ? (
              <SidebarMenuButton size="lg" variant="outline" render={<Link to="/app" />}>
                <span className="flex size-7 items-center justify-center rounded-md border bg-background">
                  <ArrowLeft className="size-4" />
                </span>
                <span className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Account</span>
                  <span className="truncate text-xs text-muted-foreground">Back to app</span>
                </span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton size="lg" variant="outline" render={<Link to="/app" />}>
                <AppLogoMark size={28} />
                <span className="truncate text-sm font-semibold">{SiteConfig.title}</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
        {!isAccountSection ? <AppCommand isAdmin={isAdmin} /> : null}
      </SidebarHeader>

      <SidebarContent>
        {isAccountSection ? (
          <SidebarGroup>
            <SidebarGroupLabel>Your account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarNavItems items={ACCOUNT_NAV} pathname={pathname} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarNavItems items={APP_NAV} pathname={pathname} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center px-2 pb-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <a
            href={SiteConfig.urls.website}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Docs
          </a>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu onLogout={onLogout} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
