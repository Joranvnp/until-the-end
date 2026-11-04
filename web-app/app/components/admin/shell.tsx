import type { ReactNode } from "react";
import { AdminBreadcrumb } from "@/components/admin/breadcrumb";
import { AdminCommand } from "@/components/admin/command";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { Layout } from "@/components/layout";
import { SidebarShellFrame } from "@/components/shell/sidebar-shell-frame";
import { SidebarTrigger } from "@/components/ui/sidebar";

type AdminShellProps = {
  children: ReactNode;
  email: string;
  onLogout: () => void;
};

export function AdminShell({ children, email, onLogout }: AdminShellProps) {
  return (
    <SidebarShellFrame
      sidebar={<AppSidebar email={email} onLogout={onLogout} />}
      header={
        <Layout size="lg" className="flex items-center gap-2">
          <SidebarTrigger variant="outline" className="size-8 cursor-pointer" />
          <AdminBreadcrumb />
          <div className="ml-auto">
            <AdminCommand />
          </div>
        </Layout>
      }
    >
      {children}
    </SidebarShellFrame>
  );
}
