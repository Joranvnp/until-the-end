import { useRouterState } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function AdminBreadcrumb() {
  const location = useRouterState({ select: (s) => s.location });
  const pathname = location.pathname;

  const paths = pathname.split("/").filter(Boolean);
  const basePath = "/admin";
  const adminPaths = paths[0] === "admin" ? paths.slice(1) : paths;

  return (
    <Breadcrumb>
      <BreadcrumbList className="border-border bg-background h-8 rounded-lg border px-3 shadow-sm shadow-black/5">
        <BreadcrumbItem>
          <BreadcrumbLink href={basePath}>
            <Home size={16} strokeWidth={2} aria-hidden="true" />
            <span className="sr-only">Admin</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {adminPaths.length > 0 && <BreadcrumbSeparator />}
        {adminPaths.map((path, index) => {
          const isLast = index === adminPaths.length - 1;
          const currentPath = `${basePath}/${adminPaths.slice(0, index + 1).join("/")}`;

          return (
            <Fragment key={path + index}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-2 capitalize">
                    {path}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={currentPath} className="flex items-center gap-2 capitalize">
                    {path}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
