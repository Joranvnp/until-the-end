/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['PixelifySans_400Regular'],
        pixel: ['PixelifySans_400Regular'],
        'pixel-bold': ['PixelifySans_700Bold'],
        title: ['PressStart2P_400Regular'],
      },
      // Colors resolve from CSS variables set at runtime by `ThemeProvider`
      // (lib/theme-store.tsx) from the single source of truth in `lib/theme.ts`.
      // `global.css` holds the light defaults for the first paint. Do not hardcode
      // hex here — edit `lib/theme.ts`.
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        card: 'var(--color-card)',
        'card-foreground': 'var(--color-card-foreground)',
        muted: 'var(--color-muted)',
        'muted-foreground': 'var(--color-muted-foreground)',
        primary: 'var(--color-primary)',
        'primary-foreground': 'var(--color-primary-foreground)',
        secondary: 'var(--color-secondary)',
        'secondary-foreground': 'var(--color-secondary-foreground)',
        accent: 'var(--color-accent)',
        'accent-foreground': 'var(--color-accent-foreground)',
        destructive: 'var(--color-destructive)',
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        admin: 'var(--color-admin)',
        'admin-foreground': 'var(--color-admin-foreground)',
        'admin-surface': 'var(--color-admin-surface)',
        'admin-border': 'var(--color-admin-border)',
        'admin-text': 'var(--color-admin-text)',
        disabled: 'var(--color-disabled)',
        'disabled-foreground': 'var(--color-disabled-foreground)',
        brand: 'var(--color-brand)',
        'brand-foreground': 'var(--color-brand-foreground)',
        panel: 'var(--color-panel)',
        edge: 'var(--color-edge)',
        hero: 'var(--color-hero)',
        ally: 'var(--color-ally)',
      },
    },
  },
  plugins: [],
};
