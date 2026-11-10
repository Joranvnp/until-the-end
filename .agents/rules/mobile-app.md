# Mobile App

Rules for Expo and React Native work in `mobile-app/`.

## When this applies

- Editing `mobile-app/**`.
- Changing onboarding, auth, paywall, tabs, settings, tutorials, native config, analytics, or store assets.

## Rules

- Use Expo Router conventions already in `mobile-app/app/`; keep the existing route groups `(app)` (signed-in: camp `home`, `settings`, `game`, `account`, `tutorials`), `(flow)` (paywall), and the `onboarding/` directory (sign-in lives there, not in an `(auth)` group).
- Route group segments are part of navigation paths: a screen at `app/(flow)/paywall.tsx` is `href="/(flow)/paywall"`. Plain `/paywall` fails silently — always include the group segment.
- Native modules (Stripe, IAP, Apple Sign In) require a development build (`npm run ios`), not Expo Go. Never verify payment or native-auth flows in Expo Go.
- **`app.config.ts` must stay plain-JS-evaluable.** EAS Build runs this file (and everything it imports, including the root `site-config.ts`) on a Node runtime during the **Read app config** phase. TypeScript-only syntax — `import type`, parameter/return annotations (`: ConfigContext`, `: ExpoConfig`), and `as` casts — works in `npm run ios` locally but fails the EAS build with an opaque `"Read app config" UNKNOWN_ERROR` (real daily-citation/PandaCouple TestFlight bug). Keep `app.config.ts` as a `// @ts-nocheck` plain-JS module (`const expoConfig = (ctx) => ({...ctx.config, ...}); export default expoConfig;`), and in `site-config.ts` use JSDoc casts `/** @type {string[]} */ ([...])` instead of `[...] as string[]` (the parentheses are required — don't let Prettier strip them). `eas.json` pins `node` via a shared `base` profile so config evaluation is reproducible.
- When another Expo app may be running, start Metro on an explicit port (`npx expo start --port 8082`); two apps on 8081 serve each other the wrong bundle.
- The app is **landscape-only** (`orientation: 'landscape'` in `app.config.ts`, `requireFullScreen` on iPad) and has **no bottom tab bar**: the camp (`app/(app)/home.tsx`) is a game menu with corner `GameIconButton`s (help, account, settings), like Stardew Valley or Terraria on mobile. Lay screens out for a short height (~390pt on phones): two columns that wrap, a `ScrollView`, and the safe-area left/right insets.
- Use NativeWind classes and existing `components/ui/` primitives before adding screen-local styling.
- Use the custom CVA helper and existing Button/Text/Card primitives for shared UI consistency.
- **Theme colors have ONE source of truth: `mobile-app/lib/theme.ts`.** Never inline a hex for a themed surface. For Tailwind classes use the semantic tokens (`bg-background`, `text-foreground`, `bg-brand`, …); for native APIs that take no className (`Stack` `contentStyle`, `StatusBar`, `ActivityIndicator color`, `placeholderTextColor`, SVG `stroke`) read `const { colors } = useTheme()` from `lib/theme-store.tsx` and pass `colors.<token>`. Editing only `tailwind.config.js`/Tailwind tokens is NOT enough — themed native surfaces keep the old color (real bug: dark theme left a white tab bar). The only allowed literal colors are intentional fixed-contrast cases (Apple `bg-black`/`text-white` buttons, text/icons over a full-bleed image, colored badges). See `.agents/skills/ns-init-project/references/theming.md` for the color touchpoint checklist and the **Mono Theme** (single-theme/dark-only) procedure.
- `ThemeProvider` (`lib/theme-store.tsx`) sits inside `SafeAreaProvider`, wrapping the router, and owns the themed background + `StatusBar`. Keep that placement (see provider order below).
- **Keyboard + text inputs:** any screen with a `TextInput` must keep the inputs *and* their submit button visible above the keyboard. Put `KeyboardAvoidingView` (`behavior={Platform.OS === "ios" ? "padding" : "height"}`) on the **outer screen / bottom-panel container** — never buried inside a nested form component. A KAV nested inside an absolutely- or flex-positioned child does NOT lift the panel (real onboarding bug: the sign-in panel sat behind the keyboard because the KAV was inside `sign-in-form.tsx` instead of the screen's bottom panel). For longer forms, wrap the fields in a `ScrollView` with `keyboardShouldPersistTaps="handled"` so button taps still register while the keyboard is open.
- Keep provider order in `mobile-app/app/_layout.tsx`; gesture, analytics, Stripe, Convex, Better Auth, auth store, safe area, theme, then router.
- Auth must use `mobile-app/lib/auth-client.ts` and `mobile-app/lib/auth-store.tsx`; do not create a second auth client.
- Keep the first-login bootstrap contract: `getMe` returns `null` until `ensureUser` creates the users row, and `auth-store.tsx` relies on that to trigger `ensureUser`. Do not convert `getMe` into a throwing `authQuery`.
- Analytics must go through `mobile-app/lib/posthog.ts`; keep no-op behavior when env is absent.
- Native store builds, submissions, and external app-store changes require explicit user confirmation.
- Do not run `archive:prod`, EAS submit, or store upload commands unless the user clearly asked for production release work.

## Verification

- Run `cd mobile-app && npx tsc --noEmit` for TypeScript-sensitive changes.
- Run `cd mobile-app && npm run lint` when touching shared UI or many files.
- Use simulator/device verification for navigation, auth, paywall, camera/media, or native-module behavior.
- **Verify mobile changes with the `/ns-ios-verification` skill** (drives the Simulator via `xcrun simctl`; never computer-use). It owns the full flow: Node 22 + UTF-8, single-agent (one Metro on 8081) vs parallel multi-agent (a dedicated Simulator device + its own Metro port per agent, so each navigates without disturbing the others), deep-link nav by `<slug>://<route>`, temp no-auth preview route + `trash` after, and programmatic OTP sign-in with deployment-specific App Review credentials. See `.agents/rules/verification.md` for the invariants.
- Pair verification with `/ns-preview` when a live browser mirror is useful. It is one host-independent `serve-sim` procedure opened in whatever browser the agent can drive. Keep the mirror on `127.0.0.1` and require a real-frame screenshot before claiming browser-visible proof.
