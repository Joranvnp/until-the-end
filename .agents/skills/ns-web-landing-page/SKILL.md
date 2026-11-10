---
name: ns-web-landing-page
description: Redesign the NowStack Mobile public landing page from live references the user approves. Use for /ns web landing-page, landing redesigns, CapWords or Screen Studio style requests, and web-app/app/components/landing edits.
disable-model-invocation: true
---

# Web Landing Page - NowStack Mobile

Scope: `/` only (`web-app/app/routes/index.tsx` + `web-app/app/components/landing/`). Not `/app`, `/admin`, mobile, backend, deploys, or store metadata.

## 1. Inspect

Read `.agents/rules/web-app.md`, `.agents/rules/typescript-and-code-style.md`, `site-config.ts`, `web-app/app/routes/index.tsx`, and at least `landing-hero.tsx`, `landing-primary-features.tsx`, `landing-header.tsx`.

## 2. Capture references

Use the user's URLs first; otherwise `https://capwords.app/` and `https://screen.studio/`, more in `references/design-swipe-file.md`. Capture each with `dev-browser` at 1440x1000 and 390x844:

```bash
dev-browser --timeout 45 <<'EOF'
for (const t of [{ name: "capwords", url: "https://capwords.app/" }]) {
  const page = await browser.getPage(`landing-ref-${t.name}`);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(t.url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const desktop = await saveScreenshot(await page.screenshot(), `${t.name}-desktop.png`);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const mobile = await saveScreenshot(await page.screenshot(), `${t.name}-mobile.png`);
  console.log(JSON.stringify({ name: t.name, title: await page.title(), desktop, mobile }));
}
EOF
```

Decline non-essential cookies if a banner blocks the hero; otherwise note the obstruction.

## 3. Align (stop and ask)

Show the screenshots and ask: which reference leads, what to keep (palette, type, hero, demo, motion, rhythm, proof, pricing), what to avoid. Do not edit before the user answers.

## 4. Implement

- Edit only the existing landing system; no second web app.
- Public route must render without Convex env or signed-in data.
- Product facts, prices, URLs, store links come from `site-config.ts`; invent none.
- Never reuse a reference's screenshots, logos, copy, trademarks, or illustrations.
- First viewport shows the real product (app screens, phone frames). No gradient orbs, bokeh, or one-note palettes.
- Use `web-app/app/components/ui/` primitives and `lucide-react`. Everything fits at 390px.

## 5. Verify

```bash
cd web-app && npm run typecheck && npm run build
```

Launch the web app on port `3003` per `.agents/rules/launch-app.md`, then capture `http://localhost:3003/` with `dev-browser` at 1440x1000 and a full-page 390x844. Inspect the images and fix overlap, blank media, weak contrast, broken sticky nav, clipped buttons, horizontal overflow, or a missing primary CTA.

Return the approved direction, files changed, screenshot paths, and check results.
