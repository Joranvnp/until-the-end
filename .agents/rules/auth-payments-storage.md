# Auth, Payments, And Storage

Rules for cross-surface identity, billing, and files.

## When this applies

- Editing Better Auth, Convex auth, OTP, Apple/Google sign-in, admin access, payments, IAP, Stripe, or R2 storage.

## Rules

- Mobile and web use the same Better Auth + Convex identity backend. Do not fork credentials by platform.
- Lumail is the only mailer. OTP, reset, and verification are Better Auth → `scheduleAuthEmail` → `@lumail/convex`. Do not add Resend, SMTP, or a second provider. `LUMAIL_API_KEY` and `EMAIL_FROM` live in Convex.
- **Social sign-in parity (mobile ↔ web).** The buttons a signed-out client renders come from ONE backend source: the public query `api.auth.getEnabledAuthProviders`, which returns a provider only when its `SiteConfig.features.enable<Provider>SignIn` flag is on AND its OAuth `clientId`/`clientSecret` env vars are set on the deployment. A button is never shown unless it would actually work. Adding or removing a provider means touching all of:
  1. `convex/auth.ts` — the `socialProviders` entry (provider + its `process.env` credentials) AND the `getEnabledAuthProviders` availability check.
  2. `mobile-app/components/onboarding/sign-in-social-buttons.tsx` — native buttons, gated on `useAuthProviders()` from `mobile-app/lib/auth-providers.tsx` (the provider that wraps and caches that query; do not call `useQuery` directly here). Apple stays additionally gated on `Platform.OS === 'ios'`.
  3. `web-app/app/components/auth/social-auth-buttons.tsx` — web buttons, gated on `useQuery(api.auth.getEnabledAuthProviders)` directly (backs the auth routes used by both `/admin` and `/app`).
  Providers wired today: **Apple, GitHub, Google** (`site-config.ts` ships Apple and GitHub enabled, Google disabled). Never wire a provider on one surface only, and never gate buttons on the raw `SiteConfig` flag alone (that shows a button before credentials exist). Web social sign-in is a redirect flow (`authClient.signIn.social({ provider, callbackURL })`); mobile Apple uses the native `idToken` while GitHub and Google use `signIn.social` with the app scheme. The OAuth redirect URI to register in the provider console is `https://<convex-site-url>/api/auth/callback/<provider>`.
- Web `/app` is normal signed-in user access; `/admin` must additionally enforce admin access through Convex.
- Admin email allowlists belong in `site-config.ts` and matching Convex-side checks. They ship as `[user-email]`; follow `.agents/rules/user-email.md`.
- Better Auth trusted origins must include the real app origins and local dev origins needed by the current web/mobile surfaces.
- Treat each deployment as a credential boundary. Production OAuth resources must register the production Convex callback and use production-specific secrets. Run `ns-setup-google-auth --prod` and `ns-setup-apple-auth --prod` for enabled providers; apply the same rule to GitHub and any future provider. `APPLE_CLIENT_ID` is the Services ID, and its signed JWT must be rotated before expiry.
- Apple IAP is the production iOS payment path. Do not replace it with Stripe checkout on iOS.
- **A validated purchase must never fail because a derived grant threw.** Once the store charged the user, record the entitlement at the level that always exists (the *user*), and commit it before any dependent/derived grant. Apply derived grants (e.g. a couple/team/org entitlement) idempotently and inside `try/catch` so they can never roll back or block the purchase validation. Real bug: the paywall ran before the couple existed, so granting couple-premium threw and failed the whole IAP validation even though Apple had charged — the fix deferred the couple grant and applied the user entitlement automatically on couple create/join.
- Do not assume dependent records exist at purchase time — the paywall can run before the related entity (couple, workspace, profile) is created. Gate derived grants on existence and re-apply them when that entity later appears.
- Stripe server-side work belongs in Convex actions or Convex HTTP handlers, not route-local web handlers.
- Production Stripe uses live-mode keys and live Product/Price objects configured through `ns-setup-stripe --prod`, plus a production-specific webhook secret **if** the repo has added a Stripe `http.route` handler (as shipped it has not — confirmation runs through the `authAction`s in `convex/payments/stripe.ts`). Test-mode values never cross into production.
- Cloudflare R2 is the file backend. Upload/signing logic belongs in Convex storage helpers.
- Never commit payment, Apple, Google, Lumail, R2, or Convex deployment secrets.

## Verification

- For auth changes, test both unauthenticated and authenticated states when credentials are available.
- For payment/storage changes, verify the Convex function compiles and the client handles missing env gracefully.
