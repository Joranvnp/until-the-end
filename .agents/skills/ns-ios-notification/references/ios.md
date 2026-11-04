# iOS push credentials

## Keep these separate

| Item | Owner | Purpose |
| --- | --- | --- |
| App ID `Push Notifications` capability | Apple Developer | Lets the bundle ID use APNs |
| App Store provisioning profile | Apple / EAS credentials | Signs `aps-environment` into the binary |
| APNs auth key | Apple + EAS credentials | Lets Expo Push reach APNs for the team |
| EAS project id | Expo | Binds `getExpoPushTokenAsync({ projectId })` tokens |

A profile plus distribution certificate is not enough: Expo Push also needs an APNs key in EAS.

## Checklist

1. App ID for `SiteConfig.bundleId` has Push Notifications enabled (keep Sign in with Apple and In-App Purchase if used) before profiles are generated.
2. `easProjectId` in `site-config.ts` is a real UUID and `mobile-app/app.config.ts` exposes `extra.eas.projectId`.
3. APNs key in EAS: `cd mobile-app && eas credentials --platform ios` after user confirmation. Reuse an existing account key; Apple allows two per account, they never expire, and many apps may depend on one. Never revoke or recreate one casually.
4. After a build, check entitlements:
   ```bash
   codesign -d --entitlements :- "path/to/Built.app" | plutil -p -
   ```
   TestFlight/App Store needs `aps-environment` = `production`. Missing: regenerate the profile after enabling the capability.

## Reading `notificationLogs`

- Accepted Expo ticket: delivery path works.
- `skipped: no active push tokens`: client registration failed.
- APNs credential error: repair the EAS APNs key or profile.

Never commit `.p8`, `.p12`, `.mobileprovision`, `credentials.json`, or token dumps.
