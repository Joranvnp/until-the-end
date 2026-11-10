import { Link } from "@tanstack/react-router";
import { SiteConfig } from "@site-config";
import { AppLogoMark } from "@/components/app-logo-mark";

const APP_NAME = SiteConfig.title;

const PRODUCT_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Reviews", href: "/#reviews" },
  { label: "FAQ", href: "/#faq" },
];

const LEGAL_LINKS = [
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/cgv" },
  { label: "Support", to: "/support" },
];

const COMPANY_LINKS = [
  { label: "Web app", to: "/app" },
  { label: "Twitter", href: SiteConfig.team.twitter, external: true },
  { label: "Maker", href: SiteConfig.team.website, external: true },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <AppLogoMark size={36} />
              <span className="text-lg font-medium tracking-tight text-foreground">
                {APP_NAME}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              The quietest way to keep what is happening, before it slips away.
              Built in {SiteConfig.company.address}.
            </p>
            <a
              href={`mailto:${SiteConfig.company.email}`}
              className="mt-4 inline-block text-sm text-foreground underline-offset-4 hover:underline"
            >
              {SiteConfig.company.email}
            </a>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Product</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {LEGAL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Company</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {COMPANY_LINKS.map((link) =>
                link.external && link.href ? (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ) : link.to ? (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {SiteConfig.company.name}. All
            rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with care in {SiteConfig.company.address}.
          </p>
        </div>
      </div>
    </footer>
  );
}
