---
name: ns-setup-expo
description: Link NowStack Mobile to Expo and EAS. Verifies the Expo login, links the EAS project into site-config easProjectId, and runs expo-doctor. Use for Expo login, eas init, a placeholder easProjectId, or before any Windows or Linux cloud build.
disable-model-invocation: true
---

# ns-setup-expo

Owns Expo account + EAS project link + project health. Not local Xcode/Simulator (`$ns-ios-setup`), not signing or builds (`$ns-ios-testflight`, `$ns-android-beta`). On Windows/Linux, every iOS or Android store build must pass this skill first and then build on EAS cloud.

## 1. Inspect

```bash
eas --version                                # missing -> $ns-doctor
ls mobile-app/node_modules/.bin/expo         # missing -> cd mobile-app && npm install (keep mobile-app/.npmrc legacy-peer-deps)
eas whoami                                   # prints the account when logged in
grep -m1 easProjectId site-config.ts         # real UUID, or xxxxxxxx-... placeholder
```

## 2. Act on gaps only

1. Not logged in: `eas login`. No Expo account yet: sign up at https://expo.dev first. Never re-login when `eas whoami` resolves.
2. Placeholder `easProjectId`: confirm with the user (creates or links a project on their Expo account; ask create vs link), then `cd mobile-app && eas init`. Write the printed UUID to `site-config.ts > easProjectId`. Never write it into `app.json` or `app.config.ts`; `mobile-app/app.config.ts` derives `extra.eas.projectId` from `SiteConfig`.
3. Confirm the link: `cd mobile-app && npx expo config --type public` shows `extra.eas.projectId` = the UUID.
4. Health: `cd mobile-app && npx expo-doctor`. Fix version mismatches it names; report the rest.

## Rules

- Never trigger a build or create store resources here.
- Expo auth stays in eas-cli's credential store. A CI `EXPO_TOKEN` (expo.dev -> Access tokens) lives only in the shell or CI secret store, never in `.env`, `eas.json`, or git.

## 3. Return

Report the Expo account, `easProjectId`, and expo-doctor result. Next: `$ns-ios-setup` (Mac local preview), `$ns-ios-testflight`, or `$ns-android-beta`.
