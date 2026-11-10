---
name: ns-ios-notification
description: Builds Expo push notifications backed by Convex. Captures device tokens, stores preferences and delivery logs, sends through Expo Push, adds admin test sends, and proves iOS delivery with EAS APNs credentials. Use for notifications, push, APNs, or failing push delivery.
argument-hint: "[--prod]"
disable-model-invocation: true
---

# iOS Notifications

Default: dev build against the dev Convex deployment. `--prod`: production Convex deployment and a TestFlight build with production APNs. Expo Go never proves delivery.

Read first: `.agents/rules/mobile-app.md`, `.agents/rules/convex.md`, `convex/_generated/ai/guidelines.md`, `convex/functions.ts`, `mobile-app/app/(app)/_layout.tsx`, `mobile-app/lib/auth-store.tsx`, and one admin route under `web-app/app/routes/admin/`. Read `references/ios.md` before any Apple, EAS, or TestFlight step.

## 1. Inspect

```bash
rg -n "expo-notifications|pushTokens|notificationLogs|getExpoPushTokenAsync" mobile-app convex web-app -g '!node_modules'
rg -n "bundleId|appleTeamId|easProjectId" site-config.ts
cd mobile-app && npx expo config --type public
```

`expo-notifications` is installed but unwired. Confirm `extra.eas.projectId` resolves to a real UUID.

## 2. Build the vertical slice

Never leave capture, delivery, or diagnostics half-wired.

1. **Mobile** (`mobile-app/lib/notifications.ts`, wired once in `mobile-app/app/(app)/_layout.tsx`): foreground handler without sound; create the Android channel before requesting a token; `getExpoPushTokenAsync({ projectId })` with `Constants.expoConfig?.extra?.eas?.projectId` falling back to `Constants.easConfig?.projectId`; register only after auth and reset the guard on sign-out; handle taps including `getLastNotificationResponseAsync` and route data hints to real Expo Router paths; add a settings toggle.
2. **Schema** (`convex/schema.ts`): `pushTokens` (userId, token, platform, deviceId?, disabledAt?, timestamps), `notificationPreferences` (userId, master `pushEnabled`, per-type toggles), `notificationLogs` (recipientUserId, type, status, payload?, error?, sentAt?, createdAt), each indexed for its exact reads.
3. **API** (`convex/notifications/`): auth mutations to register/reactivate a token (re-point it if another user owns it) and disable it; preference read/update; an internal action posting to `https://exp.host/--/api/v2/push/send` that classifies tickets and logs every sent/failed/skipped attempt. Delivery lives in actions only.
4. **Triggers**: fire from product events, never UI-only code; status-only copy with no private content; recurring prompts via scheduler or `convex/crons.ts` in bounded batches.
5. **Admin** (`convex/admin/notifications.ts` plus the admin UI): recent logs, users with active tokens, and a test-send action returning sent/accepted/rejected/token counts. Show token previews only.

Get explicit user confirmation before touching Apple/EAS resources, APNs keys, signing, builds, or uploads.

## 3. Prove

```bash
npm run check-setup
npx convex dev --once
cd mobile-app && npx tsc --noEmit && npm run lint
```

Tap routing: `$ns-ios-verification`. Delivery: install the dev build (or, for `--prod`, a TestFlight build from `$ns-ios-testflight`), sign in, accept permission, confirm a `pushTokens` row, send the admin test, and read `notificationLogs` for an accepted Expo ticket.

Return changed files, token/log evidence, APNs/entitlement state, and anything NOT VERIFIED. Never output full push tokens, `.p8`, `.p12`, or provisioning profiles.
