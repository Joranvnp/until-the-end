# Troubleshooting

The most common issues when building an app on this boilerplate, with fixes. Run `npm run check-setup` first — it diagnoses most of these automatically.

## Sign-in: "Code sent" but no OTP email arrives

The OTP email is sent by a scheduled Convex action. If `LUMAIL_API_KEY` is missing the app now fails with an explicit error, but if the email still doesn't arrive:

1. Check the Convex dashboard logs — failed sends and the OTP code itself are logged there.
2. `npx convex env list | sed 's/=.*$/=<set>/'` — verify `LUMAIL_API_KEY` and `EMAIL_FROM` are set **on the deployment you're using** without exposing their values (dev and prod have separate env vars).
3. `EMAIL_FROM` must use a domain verified in your Lumail organization, otherwise Lumail rejects the send.
4. To test sign-in without email, use the deployment-specific `APP_REVIEW_EMAIL` and `APP_REVIEW_OTP`. Retrieve or rotate them through the secret manager; never put the values in source, docs, logs, or chat.

## Sign-in crashes with "User not found" right after OTP

You're on an old version of `convex/users/account.ts`. `getMe` must return `null` (not throw) when the user row doesn't exist yet, so the client can call `ensureUser`. The required client order is: Better Auth session → Convex auth → `ensureUser` → `getMe`.

## Paywall: "Dev payment bypass is disabled" when tapping Continue (Dev)

The client shows the dev button in any `__DEV__` build, but the backend only accepts it when the deployment explicitly allows it:

```bash
npx convex env set ALLOW_DEV_PAYMENT_BYPASS true
```

Note: `process.env.CONVEX_DEPLOYMENT` is **not** available inside Convex functions (it's a CLI-only variable) — you cannot detect "dev deployment" from backend code. The flag is the only switch. Never set it on production.

## Metro: app hangs, loads the wrong bundle, or port 8081 is busy

For Expo Go, prefer the boilerplate launcher. It selects a free port and keeps the QR code scannable:

```bash
npm run expo-go
npm run expo-go -- --tunnel # only when LAN fails
```

For manual development-build sessions, every Expo app defaults to Metro port 8081. If you run two apps (or a stray Metro survives):

```bash
npx expo start --port 8082        # run this app on another port
pkill -f "expo start"             # or kill stray Metro processes
npx expo start --clear            # clear Metro cache if the wrong bundle loads
```

## Red screen: "JavaScript version X doesn't match native version Y"

The installed native binary was built from different dependency versions than the JS you're serving. Rebuild the native app:

```bash
cd mobile-app
npm run ios          # or: npx expo prebuild --clean && npm run ios
```

This happens after upgrading Expo/React Native packages, or when an old build is still installed on the simulator.

## Payments / Apple Sign In don't work in the simulator

Expo Go preview intentionally disables native store payments and social-auth callbacks. Use a **development build**: `npm run ios` or `npm run android`. See SETUP.md step 4.

## `npm run lint` fails with hundreds of errors after running `npm run ios`

Native builds generate `ios/`, `android/`, and `.expo/` folders. Lint/Prettier must ignore them — this repo ships `mobile-app/.prettierignore` and ignores in `eslint.config.js`. If you see this, your copies of those files are outdated.

## Navigation: a `<Link>` or `router.push` silently does nothing

Expo Router group segments are part of the path. A screen at `app/(flow)/paywall.tsx` is reached with `/(flow)/paywall` — `href="/paywall"` fails silently. Check the file's actual location under `mobile-app/app/`.

## Splash screen / app icon doesn't update

Icons and splash are baked into the native binary at **build time** — hot reload never updates them. Re-run `npm run ios` (or `npx expo prebuild --clean` first for a guaranteed-fresh native project).

## EAS build fails immediately

- `site-config.ts > easProjectId` is still the placeholder → run `cd mobile-app && eas init` and copy the project ID in.
- `eas.json > build.production.env` still has `YOUR_CONVEX_URL_HERE` → set your **prod** Convex URLs. EAS cannot read your gitignored `.env`.
- Apple credentials: the first `eas build --platform ios` prompts interactively for App Store Connect login — run it once in a real terminal before automating anything.

## Production web/app can't reach the backend

You deployed with **dev** deployment URLs. Prod values live in `eas.json` (mobile) and the Vercel dashboard (web) — not `.env`. And every Convex env var must be set again with `--prod`:

```bash
npx convex env list --prod | sed 's/=.*$/=<set>/'   # audit names without exposing values
```

## Auth works on web but not in the mobile app (or vice versa)

`auth.trustedOrigins` must include your scheme (`your-slug://`) and your web domain, in **both** `site-config.ts` and `convex/siteConfig.ts`. `npm run check-setup` verifies this.
