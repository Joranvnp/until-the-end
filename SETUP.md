# Setup Guide

Follow the steps in order. At any point, run `npm run check-setup` from the repo root to verify your configuration — it catches every common mistake (placeholder IDs, missing Convex secrets, swapped URLs).

> 🤖 **Guided path:** run `/ns accounts` to have the assistant walk you through creating and connecting every external account (Convex, Expo, Apple, Vercel, Stripe, Play) one at a time — it logs you in, writes each credential to the right place, and skips whatever you don't need. Check account state any time with `npm run check-setup -- --accounts`.

## 1. Configure Your App

Edit `site-config.ts`:
- `title` - Your app name
- `slug` - URL scheme and identifiers (lowercase, hyphenated)
- `bundleId` - iOS/Android bundle identifier
- `appleTeamId` - Your Apple Developer Team ID (10 chars)
- `company` - Your company details
- `brand` - Colors (primary, background, foreground, accent)
- `payment` - Price and IAP product IDs
- `urls` - Your domain URLs
- `auth.trustedOrigins` - Must include `your-slug://` and your domains
- `auth.adminEmails` - `[user-email]`. Who can access the admin dashboard. If you see the placeholder, stop and ask.

> ⚠️ `convex/siteConfig.ts` is a trimmed copy used by the backend (Convex can't import files outside `convex/`). Keep `title`, `slug`, `bundleId`, product IDs, and `auth.trustedOrigins` in sync — `npm run check-setup` verifies this.

## 2. Set Up Convex

```bash
npm install
npx convex dev
```

This creates a **cloud dev deployment** and writes `CONVEX_DEPLOYMENT` to `.env.local`. Keep `npx convex dev` running in its own terminal while developing — it syncs your functions on save.

Every deployment has **two URLs** (visible in the [Convex dashboard](https://dashboard.convex.dev)):

| URL | Ends with | Used for |
|-----|-----------|----------|
| Deployment URL | `.convex.cloud` | Client → backend functions (`*_CONVEX_URL`) |
| HTTP Actions URL | `.convex.site` | Auth routes, webhooks (`*_CONVEX_SITE_URL`) |

Always use these **cloud** URLs in your `.env` — never `127.0.0.1` unless you deliberately run a self-hosted local backend.

## 3. Environment Variables

Env vars live in **three places**. Putting a value in the wrong one is the most common setup mistake:

| Place | What goes there | How |
|-------|----------------|-----|
| `.env` (repo root) | Local dev values, public keys | `cp .env.example .env` |
| Convex deployment | Backend secrets (API keys) | `npx convex env set KEY value` |
| `eas.json` + Vercel | Values baked into production builds | Edit `eas.json`, Vercel dashboard |

`.env` is gitignored — EAS builds and Vercel **never see it**. Production values must be set in `eas.json` (mobile) and the Vercel dashboard (web).

```bash
cp .env.example .env
# fill in the Convex URLs from step 2
```

### Required Convex env vars

Set these on your **dev** deployment now, and again with `--prod` before going live:

```bash
npx convex env set LUMAIL_API_KEY lum_...                             # OTP sign-in emails (lumail.io)
npx convex env set EMAIL_FROM "you@yourdomain.com"                    # must be a Lumail-verified domain
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"    # session signing
npx convex env set SITE_URL http://localhost:3000                     # your web URL (prod: https://yourdomain.com)
```

Without `LUMAIL_API_KEY`, email sign-in fails with an explicit error. For App Review or controlled no-email testing, configure a dedicated `APP_REVIEW_EMAIL` and random six-digit `APP_REVIEW_OTP` in the target Convex deployment. Never commit or document those values.

Per-feature secrets (only if you use them): `APPLE_CLIENT_ID`/`APPLE_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `STRIPE_SECRET_KEY`/`STRIPE_PRICE_ID`, `APPLE_SHARED_SECRET`, `GEMINI_API_KEY`, `R2_*`.

### Verify

```bash
npm run check-setup
```

## 4. Run the Mobile App

For an immediate preview on a physical phone:

```bash
npm run expo-go
```

Scan the QR with Expo Go while the phone and computer share the same Wi-Fi. The command automatically avoids occupied Metro ports. If LAN discovery fails, use `npm run expo-go -- --tunnel`.

Expo Go preview covers UI, navigation, Convex, and email sign-in. For the complete app:

```bash
cd mobile-app
npm install
npm run ios        # builds the native app + launches the iOS Simulator
```

**Use `npm run ios` or `npm run android` for full verification.** Payments, store IAP, and social-auth callbacks require native modules that Expo Go cannot reproduce. The first native build takes several minutes; after that, JS changes hot-reload instantly.

Requirements: macOS with Xcode installed (the simulator launches automatically). For Android: `npm run android` with Android Studio installed.

Day-to-day you need **two terminals**: `npx convex dev` (repo root) and `npm run ios` / `npx expo start` (mobile-app). Or run everything at once from the root: `npm run start-all`.

> Running two Expo apps at the same time? Metro defaults to port 8081 for both — start the second one with `npx expo start --port 8082`. See [docs/troubleshooting.md](./docs/troubleshooting.md).

## 5. Run the Web App

```bash
cd web-app
npm install
npm run dev    # runs on port 3000
```

## 6. Configure Payments

The same product must exist with **matching IDs** in every system. One mismatch = broken paywall:

| System | Where | Must match |
|--------|-------|-----------|
| `site-config.ts` | `payment.productIds.apple/google/stripe` | source of truth |
| App Store Connect | In-App Purchase product | `productIds.apple` |
| Google Play Console | In-app product | `productIds.google` |
| Stripe Dashboard | Product + Price | `STRIPE_PRICE_ID` Convex env var |
| `mobile-app/App.storekit` | Local StoreKit testing | `productIds.apple` |

### Stripe (Android/Web)
1. Create a Stripe account, create a Product with a Price
2. Add your publishable key to `.env` as `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. `npx convex env set STRIPE_SECRET_KEY sk_...` and `npx convex env set STRIPE_PRICE_ID price_...`

### Apple IAP (iOS)
1. Create an IAP product in App Store Connect matching `site-config.ts > payment.productIds.apple`
2. Update `mobile-app/App.storekit` with the same product ID (for simulator testing)
3. `npx convex env set APPLE_SHARED_SECRET ...` (App Store Connect > App Information)

### Testing the paywall without a store account
Dev builds show a "Continue (Dev)" button, but the backend only accepts it if you enable it on the deployment:

```bash
npx convex env set ALLOW_DEV_PAYMENT_BYPASS true   # never on production
```

## 7. Set Up EAS (before any store build)

`site-config.ts > easProjectId` ships as a placeholder — EAS builds fail until you create a project:

```bash
cd mobile-app
eas init          # creates the EAS project, prints the project ID
```

Copy the project ID into `site-config.ts > easProjectId`, then put your **production** Convex URLs in `mobile-app/eas.json > build.production.env` (remember: EAS can't read your `.env`).

> Working with an AI agent? Ask it to run `/ns ios testflight` (`.agents/skills/ns/SKILL.md`) — it automates this entire section plus signing credentials and the TestFlight upload.

## 8. Deploy to Production

Order matters — follow [docs/production-checklist.md](./docs/production-checklist.md). Short version:

```bash
# 1. Backend first
npx convex deploy
npx convex env set --prod LUMAIL_API_KEY ...   # repeat ALL required env vars from step 3

# 2. Web (Vercel): set Root Directory = web-app, add CONVEX_DEPLOY_KEY (prod) +
#    VITE_CONVEX_SITE_URL in Vercel env, then push to main (or `cd web-app && vercel --prod`).
#    web-app/vercel.json makes the build run `convex deploy` so the backend ships
#    with the frontend on every commit — never just the frontend. See checklist stage 2.

# 3. Mobile
cd mobile-app
eas build --platform ios --profile production
eas build --platform android --profile production
```

The web app serves `/`, `/privacy`, `/cgv`, `/support`, `/app`, and `/admin`.

## 9. Update Branding

| Asset | File | Needs native rebuild? |
|-------|------|----------------------|
| App icon | `mobile-app/assets/icon.png` (1024×1024) | ✅ `npm run ios` |
| Splash screen | `mobile-app/assets/splash.png` | ✅ `npm run ios` |
| Android adaptive icon | `mobile-app/assets/adaptive-icon.png` | ✅ `npm run android` |
| Web favicon | `mobile-app/assets/favicon.png` | no |
| Onboarding images | `mobile-app/app/onboarding/content.ts` (ships with placeholder stock photos — replace the remote URLs) | no |

> Icons and splash are **baked into the native binary at build time** — they will NOT update on hot reload. Re-run `npm run ios` (or `npx expo prebuild --clean` for a fresh native project) to see changes.

Also update:
- Legal pages in `web-app/app/routes/privacy.tsx` and `web-app/app/routes/cgv.tsx`
- Email branding/logo in `convex/emailTemplates.ts`

## Troubleshooting

Stuck? See [docs/troubleshooting.md](./docs/troubleshooting.md) — it covers the most common issues: OTP email not arriving, Metro port conflicts, native/JS version mismatch, paywall dev button rejected, lint failing after a native build, and more.
