# Web App

Rules for the unified TanStack Start app in `web-app/`.

## When this applies

- Editing `web-app/**`.
- Changing `/`, `/privacy`, `/cgv`, `/support`, `/app`, or `/admin`.
- Changing web auth gates, admin pages, route metadata, or web UI primitives.

## Rules

- `web-app` is the only web app. Do not recreate `admin-web` or `landing-web`.
- Route contract: `/` is the public landing page, `/privacy` `/cgv` `/support` are public pages, `/app` is the signed-in user app, `/admin` is admin-only.
- Public routes must render without Convex env. Only `/app` and `/admin` may show the missing Convex URL guard.
- Keep TanStack Start route files in `web-app/app/routes/`; use `$param` for params and `route.tsx` for path layouts.
- Use `@/*` for `web-app/app/*`, `@convex/*` for backend imports, and `@site-config` for config.
- Use existing UI primitives in `web-app/app/components/ui/` before adding new primitives.
- Admin surfaces should stay dense and operational. Avoid marketing-style cards, oversized hero type, and decorative UI in `/admin`.
- Dev/developer-only UI belongs in admin surfaces, not public or normal signed-in app flows. Dev affordances such as badges, buttons, and filters should use a yellow treatment. Admin-only affordances such as admin role badges, admin navigation, admin tools, and admin primary actions should use an orange treatment. Prefer semantic tokens or component variants over one-off Tailwind color classes.
- Landing/public pages may be more expressive, but avoid gradients/orbs unless explicitly requested.
- Keep legal/support copy in route files unless it grows enough to justify a dedicated content module.

## Verification

- Run `cd web-app && npm run typecheck`.
- Run `cd web-app && npm run build` for route/config changes.
- For route behavior, verify `/`, `/privacy`, `/cgv`, `/support`, `/app`, and `/admin` on localhost.
