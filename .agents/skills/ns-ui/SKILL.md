---
name: ns-ui
description: Route NowStack Mobile UI work to the skill that owns the surface. Use for build, design, redesign, or polish requests on the mobile app, web app, landing page, or admin when the right skill is unclear.
disable-model-invocation: true
---

# UI Router - NowStack Mobile

1. Identify the surface (`mobile-app/` or `web-app/`) and task type.
2. Read the surface rule: `.agents/rules/mobile-app.md` (plus `.agents/skills/ns-init-project/references/theming.md` for colors) or `.agents/rules/web-app.md`, and `.agents/rules/typescript-and-code-style.md`.
3. Route to exactly one owner, then stop here; the owner carries the procedure and verification.

| Request | Owner |
| --- | --- |
| App icon, adaptive icon, favicon, logo | `$ns-icon` |
| Splash, onboarding backgrounds, non-icon brand art | `$ns-images` |
| Public `/` landing page redesign | `$ns-web-landing-page` |
| Store screenshots | `$ns-generate-store-screenshots` |
| Mobile screens, navigation, native tabs, animation, Liquid Glass, SF Symbols | `building-native-ui` |
| Native SwiftUI/Compose controls (`@expo/ui`): settings forms, sheets, pickers, menus | `expo-ui` |
| React Native list/animation performance | `vercel-react-native-skills` |
| Web detail opened as modal with a shareable URL | `$ns-intercepted-route-using-tanstack-start` |
| Other web pages, `/app`, `/admin` components | build directly with `web-app/app/components/ui/` primitives |

When building directly: reuse existing `components/ui/` primitives, design empty/loading/error states, keep one primary action per screen, and label icon-only controls.

Verify:
- Mobile: `cd mobile-app && npx tsc --noEmit && npm run lint`, then `$ns-ios-verification` (use `$ns-preview` for a live mirror).
- Web: `cd web-app && npm run typecheck` (plus `npm run build` for route/config changes), then `dev-browser` at one desktop and one mobile viewport.

Return the owner used, files changed, and verification evidence.
