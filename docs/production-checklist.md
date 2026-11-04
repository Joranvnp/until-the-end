# Production Release Checklist

Deploy in this order — each stage depends on the previous one. Run `npm run check-setup -- --prod` before starting and again at the end.

## 0. Prerequisites

- [ ] `site-config.ts` fully filled: `bundleId`, `appleTeamId`, `easProjectId` (from `eas init`), real `urls`
- [ ] `convex/siteConfig.ts` in sync with `site-config.ts` (`npm run check-setup`)
- [ ] Apple Developer account + App Store Connect app created with your `bundleId`
- [ ] Google Play Console app created (Android)
- [ ] Domain purchased, DNS access ready
- [ ] Production payment products created (see SETUP.md step 6 — IDs must match across App Store Connect, Play Console, Stripe, `site-config.ts`, `App.storekit`)

## 1. Convex backend (everything else points at it)

```bash
npx convex deploy
```

- [ ] Copy the **prod** deployment URLs (`.convex.cloud` and `.convex.site`) — you'll need them in stages 2 and 3
- [ ] Set ALL env vars on prod (prod starts **empty** — nothing is copied from dev):

```bash
npx convex env set --prod LUMAIL_API_KEY lum_...
npx convex env set --prod EMAIL_FROM "you@yourdomain.com"
npx convex env set --prod BETTER_AUTH_SECRET "$(openssl rand -base64 32)"   # generate a NEW one, don't reuse dev
npx convex env set --prod SITE_URL https://yourdomain.com
# + per-feature: APPLE_CLIENT_ID/SECRET, GOOGLE_CLIENT_ID/SECRET,
#   GITHUB_CLIENT_ID/SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
#   STRIPE_PRICE_ID, APPLE_SHARED_SECRET, R2_*, GEMINI_API_KEY
```

- [ ] Run the mandatory production credential boundary in `.agents/skills/ns-publish-to-production/SKILL.md`
- [ ] Google enabled: create a dedicated production OAuth client and secret with `ns-setup-google-auth --prod`; register the production Convex callback
- [ ] Apple enabled: verify the Services ID/production return URL and generate a fresh unexpired JWT with `ns-setup-apple-auth --prod` (`APPLE_CLIENT_ID` is not the bundle ID)
- [ ] GitHub or another provider enabled: create a production-specific OAuth app/client and fresh secret for the production callback
- [ ] Stripe enabled: run `ns-setup-stripe --prod`; require `sk_live_*`, live Product/Price objects, and a production-specific webhook `whsec_*`
- [ ] Verify `npx convex run --prod auth:getEnabledAuthProviders '{}'` exactly matches the enabled auth flags
- [ ] Audit without exposing values: `npx convex env list --prod | sed 's/=.*$/=<set>/'`
- [ ] ⚠️ Do NOT set `ALLOW_DEV_PAYMENT_BYPASS` on prod

## 2. Web app (Vercel)

The web app and the Convex backend **must ship together**: the Vercel build runs `convex deploy` first, then builds the frontend. Without this, Vercel only rebuilds the frontend and your production Convex functions silently drift behind every commit. `web-app/vercel.json` wires this automatically — but the project settings and deploy key below are required for it to work.

- [ ] **The `nitro` Vite plugin must be wired** in `web-app/vite.config.ts` (`import { nitro } from "nitro/vite"` + `nitro()` after `tanstackStart()`). Without it the build ships a host-agnostic SPA and **every route 404s** on Vercel. `npm run check-setup` verifies it.
- [ ] **Configure the deploy key + project settings automatically** — link at the repo root, then run the setup script:

  ```bash
  vercel link            # run from the REPO ROOT; pick/create your project
  npm run setup:vercel   # from repo root
  ```

  It **sets the project Root Directory = `web-app`** (so Vercel reads `web-app/vercel.json`, which runs `npm run build:vercel` → `convex deploy --cmd 'cd web-app && npm run build'`), mints a Convex **production** deploy key, sets `CONVEX_DEPLOY_KEY` (Production), and fills `VITE_CONVEX_SITE_URL` + `VITE_EMAIL_CONTACT`. Idempotent; pass `-- --force` to overwrite. The build fails loudly without `CONVEX_DEPLOY_KEY` — intentional (better than shipping a stale backend). Link at the **repo root** (not `web-app/`) so a CLI deploy uploads the whole monorepo and the build's `cd ..` reaches the root `convex/` folder.

  Prefer the dashboard? Convex → Settings → Deploy keys → "Generate production deploy key", add it to Vercel env as `CONVEX_DEPLOY_KEY` (Production only), and set Root Directory = `web-app` under Settings → Build & Deployment.
- [ ] Note: `VITE_CONVEX_URL` is injected automatically by `convex deploy --cmd-url-env-var-name` — do **not** hardcode it, so the frontend always matches the deployment it just shipped.
- [ ] Verify the build wiring: `npm run check-setup` (the "web-app/vercel.json" AND "web-app nitro plugin" checks must pass).
- [ ] Deploy: push to main (preferred), or from the **repo root** run `vercel --prod --archive=tgz`. Never `cd web-app && vercel --prod` — it uploads only `web-app/` and the build's `cd ..` fails (exit 254); the monorepo also exceeds Vercel's 15 000-file inline limit, hence `--archive=tgz`.
- [ ] Custom domain: add it in Vercel project settings, then create the CNAME record at your DNS provider (Cloudflare: CNAME `@` or subdomain → `cname.vercel-dns.com`, proxy off until verified)
- [ ] Verify: confirm the build log shows `Generated .vercel/output/nitro.json`, then `curl` `/`, `/privacy`, `/cgv`, `/support` — every public route must return **200, not 404** (a missing-nitro SPA regression only shows here). Open the site, sign in, check `/app` and `/admin`.
- [ ] Update `site-config.ts > urls` and `auth.trustedOrigins` + `convex/siteConfig.ts > auth.trustedOrigins` with the final domain, redeploy Convex if changed

## 3. Mobile builds (EAS)

> First TestFlight build? Run `/ns ios testflight` (the `ns-ios-testflight` skill) — it automates EAS init, Apple signing credentials via the App Store Connect API (no 2FA prompts), the non-interactive build, and the TestFlight upload.

- [ ] `mobile-app/eas.json > build.production.env` has the **prod** Convex URLs (stage 1)
- [ ] Apple signing credentials ready: either local credentials via `/ns ios setup` (`credentialsSource: "local"` + `credentials.json`), or run `eas build --platform ios` interactively once so EAS stores them (prompts for App Store Connect login + 2FA)

```bash
cd mobile-app
eas build --platform ios --profile production
eas build --platform android --profile production
```

## 4. Store submission

> Working with an AI agent? Run `/ns ios distribute` (the `ns-ios-distribute` skill) — it automates this whole stage: screenshots, metadata, IAP pricing/availability, age rating, review details, validation, and submission — only the App Privacy questionnaire stays manual (web-only).

- [ ] Screenshots: `cd mobile-app && npm run screenshots:store` (see `docs/mobile-store-deployment.md` for the full iOS/Android submission playbook)
- [ ] Submit iOS build to TestFlight, test the REAL purchase flow with a sandbox account
- [ ] Submit Android build to internal testing track, test the purchase flow
- [ ] For App Review: configure deployment-specific `APP_REVIEW_EMAIL` / random `APP_REVIEW_OTP`, test them, and enter the same values in private App Review Information (never docs/source)
- [ ] Submit for review

## 5. Post-release sanity check

- [ ] Sign up with a real email on prod — OTP arrives
- [ ] Purchase works on at least one platform (sandbox)
- [ ] `npx convex logs --prod` shows no recurring errors
- [ ] Admin dashboard reachable at `/admin` with an `adminEmails` account
