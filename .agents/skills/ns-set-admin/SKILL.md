---
name: ns-set-admin
description: Grant admin access to a NowStack Mobile user by email. Syncs both admin allowlists and sets isAdmin in the target Convex deployment. Use for set admin, make me admin, /admin access denied, This account does not have admin access, or an infinite /admin loader.
disable-model-invocation: true
---

# ns-set-admin

`/admin` needs all three: the email in both allowlists, `users.isAdmin === true`, and functions deployed to the deployment the app uses.

- "This account does not have admin access" -> email missing from `ADMIN_EMAILS` (`ensureAdminUser` threw `Not an admin`).
- Infinite `/admin` spinner -> functions not deployed to that deployment, or no `users` row yet (see `adminReady` in `web-app/app/routes/admin/route.tsx`).

## 1. Inspect

- Target email: the one the user gives. Otherwise follow `.agents/rules/user-email.md`: if `[user-email]` is still present, stop and ask; never invent one or default to a shipped allowlist entry. Lowercase it. Confirm it with the user; this grants real admin.
- Target deployment: dev, or production (`--prod`). Match the deployment the app actually points at.
- Read `convex/admin/auth.ts` and confirm `setAdminByEmail` exists. If a fork removed it, re-add it as an `internalMutation({ email })` that lowercases, looks up `users` with the `by_email` index, throws when no row exists, and patches `isAdmin: true` idempotently (read `convex/_generated/ai/guidelines.md` first).

## 2. Act

1. Add the email to both allowlists: `site-config.ts > auth.adminEmails` (keep the `/** @type {string[]} */ ([...])` cast; see `.agents/rules/mobile-app.md`) and `convex/admin/auth.ts > ADMIN_EMAILS`. Never add throwaway emails.
2. Deploy: `npx convex dev --once`. Production: `npx convex deploy` only after explicit confirmation.
3. Grant:
   ```bash
   npx convex run admin/auth:setAdminByEmail '{"email":"USER@EXAMPLE.COM"}'
   npx convex run --prod admin/auth:setAdminByEmail '{"email":"USER@EXAMPLE.COM"}'   # production
   ```
   "No users row": the person signs in once (web `/app` or `/admin`, or mobile), then re-run.

## 3. Verify and return

Re-run the grant and expect `alreadyAdmin: true`. Reload `/admin`; it must show the admin shell. If `site-config.ts` changed, run `cd web-app && npm run typecheck`. Report email, deployment, and result.
