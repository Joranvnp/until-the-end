---
name: ns-images
description: Generate and install NowStack Mobile onboarding backgrounds, splash art, and non-icon brand artwork with an image-generation tool. Use for /ns images, onboarding images, splash screen art, or brand illustrations.
disable-model-invocation: true
---

# Brand Images - NowStack Mobile

App icon, adaptive icon, favicon, and logos belong to `$ns-icon`.

## Requires an image-generation tool

Use the agent's raster image tool (for example `imagegen`). Never fake art with SVG-to-PNG pipelines. Without a tool, fill the prompt below per slide, hand the prompts to the user, and resume at "Install" with their files.

## Targets

| Asset | File | Spec |
| --- | --- | --- |
| Onboarding backgrounds | `mobile-app/assets/onboarding/<slide>.png` | 9:19.5 portrait (1290x2796), one per slide, <= ~1.8 MB |
| Splash | `mobile-app/assets/splash.png` | the mark centered on flat `SiteConfig.brand.background` (`resizeMode: 'contain'`), never the square icon tile |

## Flow

1. Read `site-config.ts` (brand, tone), `mobile-app/components/onboarding/content.ts` (slides, `ONBOARDING_IMAGES`, `WELCOME_IMAGE`), and `mobile-app/app/onboarding/index.tsx` (render mode). The bottom sheet can hide 35-42% of the image; compose for the densest step.
2. Generate one image per slide with the prompt below. Copy outputs to `.agents/output/images/<date>/`.
3. Inspect every image: subject in the upper 45-55%, bottom 42% calm, no text or watermark. Regenerate failures; patch small bottom-zone issues with an ImageMagick blurred fade. If a safety filter rejects a prompt, reword it neutrally.

```text
Use case: illustration-story
Asset type: mobile onboarding background for an iPhone app named <AppName>
Primary request: clean, modern, high-end raster illustration for the <slide purpose> screen. No SVG/vector look, no flat icon art.
Composition: vertical 9:19.5 wallpaper rendered with resizeMode cover behind a bottom sheet. Important subject in the upper 45-55%, readable if the lower 42% is covered. Bottom 42% calm and simple. Generous side padding.
Scene: <scene matching the slide message>, app-store quality, soft depth.
Subject: <mascot/concept telling this slide's story>, friendly, not childish.
Style: clean modern 3D illustration, soft rounded forms, gentle lighting, crisp subject.
Color: <brand palette as names, no hex>, enough contrast for a phone.
Avoid: text, logos, UI, phone frame, screenshots, watermarks, important objects below the midpoint, tiny hidden subject, harsh outlines, clutter, stock photo look, flat SVG look.
```

## Install

```bash
mkdir -p mobile-app/assets/onboarding
cp <generated>.png mobile-app/assets/onboarding/<slide>.png
cp <generated-splash>.png mobile-app/assets/splash.png
```

Replace the remote URLs in `content.ts` with `require("@/assets/onboarding/<slide>.png")` typed as `ImageSourcePropType`, and change `source={{ uri: ... }}` in `mobile-app/app/onboarding/index.tsx` to pass the source directly. Then `cd mobile-app && npx tsc --noEmit && npm run lint`.

## Verify the rendered app

File inspection is not proof. Run `$ns-ios-verification` on an explicit Metro port (not 8081 if another Expo app runs; confirm the Metro manifest `name`, `slug`, and `projectRoot` match this repo). Capture the welcome step and one dense step (options/pricing) with `xcrun simctl io <udid> screenshot`. Splash changes need a native rebuild (`cd mobile-app && npm run ios`). Fail if the subject hides behind the sheet, old remote backgrounds or the previous product name show, or the splash shows a square tile.

Return the generated files, installed paths, and screenshot evidence.
