---
name: ns-icon
description: Generate NowStack Mobile app icons and logos: 8 iOS-quality candidates, one final icon, then derived app and web assets. Use for /ns icon, app icon, launcher icon, adaptive icon, favicon, or logo refresh.
disable-model-invocation: true
---

# App Icon - NowStack Mobile

Onboarding backgrounds, splash art, and other brand art belong to `$ns-images`.

## Requires an image-generation tool

Use the agent's raster image tool (for example `imagegen` / `image_gen`), else `gemini-cli image generate --model gemini-3-pro-image-preview`. Never fake icons with SVG/canvas exports. If no tool is reachable, fill both prompts below, hand them to the user, and resume at step 5 with their images.

## Flow

1. Read `site-config.ts` (name, concept, brand colors), `mobile-app/app.config.ts` (icon/adaptive/splash paths, `SiteConfig.brand.background`), `mobile-app/assets/`, and `web-app/public/`. If the user points to an existing image, use it and inspect `.agents/output/images/` first.
2. Generate exactly 8 distinct candidates with prompt A. Never 1, 2, or 4, and do not skip this stage because an icon exists, unless the user says "use this exact icon" or "no candidates". Optional style anchors to attach: `references/inspiration-premium-icons.webp`, `references/example-symbol-object.webp`, `references/example-character-mascot.webp`, `references/inspiration-logo-marks.png` (inspiration only, never copy).
3. Copy (do not move) the raw output to `.agents/output/images/icon/<date>/app-logo-imagegen-sheet-01.png`; split into `app-logo-imagegen-candidate-01.png` .. `-08.png`, each 1024x1024 RGB, no alpha. Regenerate if fewer than 8 usable, glossy blobs, dark vignettes, or unreadable at 60px. If the user dislikes all, regenerate with a different visual strategy.
4. Pick the best (readable at 60px, distinctive, works in one color, no text). Show the sheet, name the pick plus 2-3 backups with reasons, then generate the final icon with prompt B. Never install the sheet itself. Save as `.agents/output/images/icon/<date>/selected-icon.png`.
5. Derive assets (below), then verify.

Reject any icon with text, letters, numbers, monograms, UI, mockups, faces, trademarks, transparency, baked rounded corners, borders, or halos.

## Prompt A (8 candidates)

```text
Use case: logo-brand
Asset type: 8 different iOS app icon candidates for <AppName>, 1024x1024-style squares in a clean 4x2 grid.
Primary request: premium, polished, native-iOS, app-store-ready icon directions for an app that <concept>. Each is a standalone full-square icon with one simple centered mark and generous padding.
Directions: <8 symbolic directions from the product>.
Style: crisp geometric forms, balanced negative space, subtle depth, refined highlights, smooth matte or light glass finish.
Color: <brand color names, no hex>, full-bleed brand backgrounds, 2-4 colors, at most one accent glow.
Constraints: exactly 8 distinct candidates; no text, letters, numbers, watermark, mockup, rounded mask, border, transparency, photos, faces, tiny details, dark vignette, glossy blobs, or 3D scenes; each readable at 60px.
```

## Prompt B (final)

```text
Use case: logo-brand
Asset type: iOS app icon for <AppName>, 1024x1024 square.
Subject: a single centered <selected mark>, simple and readable at small sizes.
Style: modern iOS icon, clean geometric symbol, subtle depth, refined highlight, no photoreal objects.
Composition: generous safe padding, full-bleed <brand color names> background, full square for iOS masking.
Constraints: no words, letters, numbers, watermark, mockup, rounded mask, border, transparency, tiny details, or scene; readable at 60px.
```

## Derive assets

| Target | Spec |
| --- | --- |
| `mobile-app/assets/icon.png` | 1024x1024, RGB, no alpha, no mask |
| `mobile-app/assets/adaptive-icon.png` | foreground at 66% on brand bg, 1024x1024 |
| `mobile-app/assets/favicon.png` | 192x192 |
| `web-app/public/icon.png`, `apple-icon.png`, `favicon.ico` | from the same final icon |

```bash
SOURCE=.agents/output/images/icon/<date>/selected-icon.png; BG="<brand-bg-color>"
sips -z 1126 1126 "$SOURCE" --out /tmp/ns-icon-up.png          # pushes any baked mask/halo off-canvas
sips -s format png -c 1024 1024 /tmp/ns-icon-up.png --out mobile-app/assets/icon.png
magick mobile-app/assets/icon.png -background "$BG" -alpha remove -alpha off mobile-app/assets/icon.png
magick mobile-app/assets/icon.png -resize 66% -background "$BG" -gravity center -extent 1024x1024 mobile-app/assets/adaptive-icon.png
sips -z 192 192 mobile-app/assets/icon.png --out mobile-app/assets/favicon.png
sips -g pixelWidth -g pixelHeight -g hasAlpha mobile-app/assets/icon.png mobile-app/assets/adaptive-icon.png mobile-app/assets/favicon.png
```

Without `magick`, copy `icon.png` to `adaptive-icon.png` and report the missing padding. Update `web-app/public/favicon.svg` only if you have a real vector mark; otherwise report it as stale. Splash comes from the mark on the brand background, never the square icon tile (`$ns-images` owns splash art).

## Verify

`cd mobile-app && npx tsc --noEmit`; `cd web-app && npm run typecheck`. Launcher icons need a native rebuild (`cd mobile-app && npm run ios` / `npm run android`). Fail if the old icon persists after rebuild, the icon has alpha or double corners, the adaptive icon crops the mark (drop below 66%), or it is unreadable at 60px.

Return the sheet path, selected candidate, backups, and every file written.
