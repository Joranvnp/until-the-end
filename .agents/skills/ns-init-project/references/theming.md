# Mobile theming

All mobile colors live in `mobile-app/lib/theme.ts` (`themes.light` / `themes.dark`). Classes read them through `tailwind.config.js` CSS variables set by `lib/theme-store.tsx`; native props read `useTheme().colors`. Never inline a hex for a themed surface.

## Touchpoints (all must resolve from `theme.ts`)

- `lib/theme.ts`, `tailwind.config.js`, `global.css :root` (first-paint values), `app.config.ts` (`userInterfaceStyle`), `lib/theme-store.tsx` (provider, `StatusBar`).
- `app/(app)/(tabs)/_layout.tsx`: `NativeTabs` `tintColor` and label font only; never set a bar background or border (`.agents/rules/mobile-app.md`).
- `Stack` `contentStyle.backgroundColor` in `app/(app)/_layout.tsx`, `app/(flow)/_layout.tsx`, `app/onboarding/_layout.tsx`.
- `components/ui/loading.tsx`, `header.tsx`, `input.tsx`, `continue-button.tsx`, and any `color=` / `placeholderTextColor=` prop.

Leave intentional fixed colors: Apple sign-in `bg-black`/`text-white`, white text or `bg-white/30`/`bg-black/20` over full-bleed images, `components/ui/badge.tsx`.

Audit (every hit must be an intentional fixed color):

```bash
cd mobile-app && grep -rnoE "#[0-9A-Fa-f]{6}\b" app components --include="*.tsx" --include="*.ts"
```

## Single theme (example: dark only)

1. `lib/theme-store.tsx`: `const resolved: ColorScheme = 'dark';` and `const setPreference = () => {};`. Keep the `vars()` and `StatusBar` wiring.
2. `app/(app)/(tabs)/settings.tsx`: delete `AppearanceToggle` and the Appearance section (both tagged `MONO THEME:`).
3. `app.config.ts`: `userInterfaceStyle: 'dark'`.
4. `global.css :root`: replace light values with `themes.dark` values.
5. `lib/theme.ts`: add `// MONO THEME: light is UNUSED - do not edit. Edit dark only.` above `light`.
6. Edit only `themes.dark` from now on. Reverse these steps to restore dual theme.

Verify: `cd mobile-app && npx tsc --noEmit && npm run lint`, then confirm in the Simulator that tab bar, headers, backgrounds, status bar, and spinners match.
