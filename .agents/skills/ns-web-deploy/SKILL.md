---
name: ns-web-deploy
description: Deploy the NowStack Mobile web app to Vercel with Convex shipped in the same build. Use when the user says deploy the web app, ship web to production, go live, or needs CONVEX_DEPLOY_KEY and the Vercel build wired.
disable-model-invocation: true
---

# Web Deploy - NowStack Mobile

Run only after `$ns-publish-to-production` passes its production credential boundary (production OAuth clients, fresh Apple JWT, Stripe live mode). If it has not passed, stop and run it first.

Hard rules:
- `nitro()` must be in `web-app/vite.config.ts`; without it Vercel serves a SPA and every route 404s.
- Deploy from the REPO ROOT (Git push to `main`, or `vercel --prod --archive=tgz`). Never from `web-app/` (exit 254: `..` has no `convex/`).
- Never hardcode `VITE_CONVEX_URL`; `convex deploy --cmd-url-env-var-name VITE_CONVEX_URL` injects it.
- `CONVEX_DEPLOY_KEY` is a Convex **production** deploy key, Vercel **Production** scope only. `scripts/build-vercel.mjs` skips `convex deploy` when `VERCEL_ENV` is not `production`.
- Never commit or print the deploy key or any secret.

## 1. Check build wiring

```bash
npm run check-setup   # "web-app/vercel.json" AND "web-app nitro plugin" must pass
```

If either fails, restore:
- `web-app/vercel.json`: `{ "installCommand": "npm install && npm --prefix .. install", "buildCommand": "npm run build:vercel" }`
- `web-app/package.json` script `"build:vercel": "node ../scripts/build-vercel.mjs"` (keep the wrapper; it holds the preview skip).
- `web-app/vite.config.ts`: `import { nitro } from "nitro/vite"`, plugins `[tanstackStart(...), nitro(), viteReact(), tailwindcss()]`, dependency `"nitro": "^3.0.260610-beta"`.

Local sanity (Node 22): `cd web-app && VERCEL=1 npm run build` must print `Generated .vercel/output/nitro.json`; `trash .vercel/output` after.

## 2. Provision Vercel (always)

Show the Vercel account/project, Convex production deployment, env names to set, and whether a key would be rotated. Get fresh explicit confirmation, then:

```bash
vercel link                                      # repo root
npm run setup:vercel -- --confirm-production     # sets Root Directory=web-app, CONVEX_DEPLOY_KEY, VITE_CONVEX_SITE_URL, VITE_EMAIL_CONTACT
```

Idempotent. Key rotation (`--force`) needs its own fresh explicit confirmation. Dashboard fallback: Convex Settings > Deploy keys > production key into Vercel `CONVEX_DEPLOY_KEY` (Production); Vercel Root Directory = `web-app`.

## 3. Deploy and read back

Show the target project/domain and method. Get fresh explicit confirmation immediately before the push or deploy; earlier approvals do not count.

```bash
git push origin main            # preferred
vercel --prod --archive=tgz     # CLI alternative, repo root
```

Required read-back (local success is not proof): Vercel provider state shows the deployment Ready, the build log shows `convex deploy` then the frontend build then `Generated .vercel/output/nitro.json`, and:

```bash
for p in / /privacy /cgv /support /app /admin; do
  echo "$p -> $(curl -s -o /dev/null -w '%{http_code}' https://<your-domain>$p)"
done   # public routes must be 200; sign in to confirm /app and /admin
```

## 4. Domain (first launch)

Add the domain in Vercel, CNAME at DNS (`cname.vercel-dns.com`, Cloudflare proxy off until verified). Update `site-config.ts` `urls` + `auth.trustedOrigins` and `convex/siteConfig.ts` `auth.trustedOrigins`, then redeploy with the same confirmation + read-back.

## Failures

- Every route 404s: `nitro()` missing (no "Generated .vercel/output" in log).
- `'files' should NOT have more than 15000 items`: add `--archive=tgz` or push to `main`.
- Install exits 254: deployed from `web-app/`.
- "no Convex deployment configuration / CONVEX_DEPLOY_KEY" on production: rerun step 2.
- Build command ignored: Root Directory is not `web-app`.
- Frontend hits dev backend: hardcoded `VITE_CONVEX_URL` or missing key.

Return: deployment URL, Ready state, route status table, and any skipped check. iOS App Store review needs `/privacy`, `/cgv`, and `/support` live, so `$ns-ios-distribute` depends on this.
