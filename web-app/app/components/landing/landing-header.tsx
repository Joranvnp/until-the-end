import { Link } from "@tanstack/react-router";
import { Download, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteConfig } from "@site-config";
import { AppLogoMark } from "@/components/app-logo-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <div
        className={cn(
          "border-b border-transparent transition-colors duration-300",
          scrolled &&
            "border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65",
        )}
      >
        <nav className="relative z-50 mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="relative z-10 flex items-center gap-12">
            <Link to="/" className="flex items-center gap-2.5">
              <AppLogoMark size={36} />
              <span className="text-lg font-medium tracking-tight text-foreground">
                {SiteConfig.title}
              </span>
            </Link>
            <div className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="relative z-10 -m-2 inline-flex items-center rounded-lg p-2 text-foreground hover:bg-muted lg:hidden"
              aria-label="Toggle menu"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <div className="hidden items-center gap-2 lg:flex">
              <Button
                variant="ghost"
                className="rounded-full px-4 text-sm text-muted-foreground"
                render={
                  <Link to="/auth/signin" search={{ callbackUrl: "/app" }} />
                }
              >
                Log in
              </Button>
              <Button
                size="sm"
                className="rounded-full px-4 text-sm shadow-sm active:scale-[0.98]"
                render={
                  <a
                    href={SiteConfig.urls.appStore}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <Download className="size-4" />
                Download
              </Button>
            </div>
          </div>
        </nav>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-0 z-40 origin-top rounded-b-2xl bg-popover px-6 pt-20 pb-6 shadow-2xl lg:hidden">
          <div className="space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-base tracking-tight text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/auth/signin"
              search={{ callbackUrl: "/app" }}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-base tracking-tight text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Log in
            </Link>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              className="rounded-full"
              render={
                <a
                  href={SiteConfig.urls.appStore}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <Download className="size-4" />
              Download the app
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
