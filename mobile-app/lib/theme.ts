// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for every color in the mobile app.
//
// These tokens feed BOTH:
//   1. Tailwind/NativeWind classes (`bg-background`, `text-foreground`, …) via the
//      CSS variables wired in `tailwind.config.js` + `global.css`.
//   2. Native APIs that cannot take a className (tab bar, Stack `contentStyle`,
//      `StatusBar`, `ActivityIndicator` color, …) via the `useTheme()` hook in
//      `lib/theme-store.tsx`.
//
// Because everything resolves from here, flipping a theme can never leave an
// orphaned hardcoded color behind (the classic "tab bar stayed white" bug).
//
// To change a color: edit the value here — nowhere else. Never inline a hex in a
// screen or component; read it from `useTheme().colors` or a Tailwind token.
//
// MONO THEME: if this app ships a single theme, see
// `.agents/skills/ns-init-project/references/theming.md` — the unused scheme block
// gets a "do not edit" banner and you only maintain the active one.
// ─────────────────────────────────────────────────────────────────────────────

export type ColorScheme = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  muted: string;
  'muted-foreground': string;
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  accent: string;
  'accent-foreground': string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
  success: string;
  warning: string;
  admin: string;
  'admin-foreground': string;
  'admin-surface': string;
  'admin-border': string;
  'admin-text': string;
  disabled: string;
  'disabled-foreground': string;
  // Brand accent — a fixed brand color (same in both schemes by default). Used for
  // the primary CTA buttons in onboarding/auth. Change it to rebrand.
  brand: string;
  'brand-foreground': string;
  // Game UI: dark pixel panels with a thin light edge, the gold "hero" button fill,
  // and the player's team blue (the enemy red is `destructive`).
  panel: string;
  edge: string;
  hero: string;
  ally: string;
};

export const themes: Record<ColorScheme, ThemeColors> = {
  // MONO THEME: light is UNUSED - do not edit. Edit dark only.
  light: {
    background: '#FFFFFF',
    foreground: '#0A0A0A',
    card: '#FFFFFF',
    'card-foreground': '#0A0A0A',
    muted: '#F5F5F5',
    'muted-foreground': '#737373',
    primary: '#0A0A0A',
    'primary-foreground': '#FAFAFA',
    secondary: '#F5F5F5',
    'secondary-foreground': '#0A0A0A',
    accent: '#F5F5F5',
    'accent-foreground': '#0A0A0A',
    destructive: '#EF4444',
    border: '#E5E5E5',
    input: '#E5E5E5',
    ring: '#0A0A0A',
    success: '#10B981',
    warning: '#F59E0B',
    admin: '#FACC15',
    'admin-foreground': '#1A1A1A',
    'admin-surface': '#FEF9C3',
    'admin-border': '#FDE68A',
    'admin-text': '#92400E',
    disabled: '#E5E5E5',
    'disabled-foreground': '#A3A3A3',
    brand: '#FFE040',
    'brand-foreground': '#1A1A1A',
    panel: '#FFFFFF',
    edge: '#E5E5E5',
    hero: '#FFF7D6',
    ally: '#2563EB',
  },
  dark: {
    background: '#0B0A16',
    foreground: '#E4E9FF',
    card: '#15132A',
    'card-foreground': '#E4E9FF',
    muted: '#1D1B33',
    'muted-foreground': '#A0A4BE',
    primary: '#FFE066',
    'primary-foreground': '#0B0A16',
    secondary: '#1D1B33',
    'secondary-foreground': '#E4E9FF',
    accent: '#1D1B33',
    'accent-foreground': '#E4E9FF',
    destructive: '#E5534B',
    border: '#2A2745',
    input: '#2A2745',
    ring: '#FFE066',
    success: '#63EBCA',
    warning: '#FFD27A',
    admin: '#FACC15',
    'admin-foreground': '#1A1A1A',
    'admin-surface': '#422006',
    'admin-border': '#A16207',
    'admin-text': '#FDE68A',
    disabled: '#1D1B33',
    'disabled-foreground': '#4A4766',
    brand: '#FFE066',
    'brand-foreground': '#0B0A16',
    panel: '#05050CE6',
    edge: '#8A8EAA',
    hero: '#2B2110',
    ally: '#4F9DF5',
  },
};

export const themeTokens = Object.keys(themes.light) as (keyof ThemeColors)[];

/**
 * Build the NativeWind `vars()` payload for a scheme: `{ '--color-background': '#…' }`.
 * Applied on a wrapping View, it reskins every `var(--color-*)` Tailwind token below it.
 * Keep these keys in sync with `tailwind.config.js` and the `:root` block in `global.css`.
 */
export function toCssVars(scheme: ColorScheme): Record<string, string> {
  const palette = themes[scheme];
  const out: Record<string, string> = {};
  for (const token of themeTokens) {
    out[`--color-${token}`] = palette[token];
  }
  return out;
}
