import type { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ShellBreadcrumb } from "@/components/shell/shell-breadcrumb";
import { SidebarShellFrame } from "@/components/shell/sidebar-shell-frame";
import { UserSidebar } from "@/components/shell/user-sidebar";

export function UserShell({
  children,
  onLogout,
}: {
  children: ReactNode;
  onLogout: () => void;
}) {
  return (
    <SidebarShellFrame
      sidebar={<UserSidebar onLogout={onLogout} />}
      header={
        <div className="m-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger variant="outline" className="size-8 cursor-pointer" />
            <ShellBreadcrumb />
          </div>
        </div>
      }
      contentClassName="m-auto w-full max-w-7xl"
    >
      {children}
    </SidebarShellFrame>
  );
}
