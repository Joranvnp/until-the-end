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

const SEGMENT_LABELS: Record<string, string> = {
  app: "Home",
  account: "Account",
  identity: "Identity",
  plan: "Plan",
  "change-email": "Change email",
};

export function ShellBreadcrumb() {
  const location = useRouterState({ select: (s) => s.location });
  const segments = location.pathname.split("/").filter(Boolean);
  // `/app` is the home root — render only the Home crumb for it.
  const crumbs = segments[0] === "app" ? [] : segments;

  return (
    <Breadcrumb>
      <BreadcrumbList className="border-border bg-background h-8 rounded-lg border px-3 shadow-sm shadow-black/5">
        <BreadcrumbItem>
          <BreadcrumbLink href="/app" className="flex items-center gap-2">
            <Home size={16} strokeWidth={2} aria-hidden="true" />
            <span className="sr-only">Home</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.length > 0 && <BreadcrumbSeparator />}
        {crumbs.map((segment, index) => {
          const isLast = index === crumbs.length - 1;
          const href = `/${crumbs.slice(0, index + 1).join("/")}`;
          const label = SEGMENT_LABELS[segment] ?? segment;
          return (
            <Fragment key={segment + index}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="capitalize">{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href} className="capitalize">
                    {label}
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
