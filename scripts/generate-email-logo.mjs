// Regenerate the embedded email logo from the mobile app icon.
//
// The transactional emails (OTP sign-in, etc.) show a logo that the Convex
// deployment serves at /brand/logo.png. It is embedded as base64 so it works
// even before the production domain is live. We bake iOS-style rounded corners
// into the PNG's alpha channel because some clients (Outlook) ignore CSS
// border-radius, so the corners must already be part of the image.
//
// Usage: node scripts/generate-email-logo.mjs
// Reads:  mobile-app/assets/icon.png
// Writes: convex/emails/logoAsset.ts (the EMAIL_LOGO_PNG_BASE64 constant)

import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "mobile-app/"));
const { PNG } = require("pngjs");

const SIZE = 112; // 2x the 56px the email renders, for retina sharpness
const RADIUS_RATIO = 0.2237; // iOS app-icon corner radius ratio

const iconPath = path.join(root, "mobile-app/assets/icon.png");
const assetPath = path.join(root, "convex/emails/logoAsset.ts");
const resized = path.join(os.tmpdir(), "email-logo-src.png");

// 1. Downscale the app icon to a square SIZExSIZE PNG.
execFileSync("sips", ["-z", String(SIZE), String(SIZE), iconPath, "--out", resized], {
  stdio: "ignore",
});

// 2. Bake an anti-aliased rounded-rectangle alpha mask into the image.
const src = PNG.sync.read(fs.readFileSync(resized));
const W = src.width;
const H = src.height;
const out = new PNG({ width: W, height: H });
const r = Math.round(RADIUS_RATIO * W);
const cx = W / 2;
const cy = H / 2;
const hx = W / 2;
const hy = H / 2;

// Signed distance to a rounded rectangle (<= 0 means inside the shape).
const sdf = (px, py) => {
  const qx = Math.abs(px - cx) - (hx - r);
  const qy = Math.abs(py - cy) - (hy - r);
  const mx = Math.max(qx, 0);
  const my = Math.max(qy, 0);
  return Math.hypot(mx, my) - r + Math.min(Math.max(qx, qy), 0);
};

const S = 4; // 4x4 supersampling -> smooth corners
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    let inside = 0;
    for (let sy = 0; sy < S; sy++) {
      for (let sx = 0; sx < S; sx++) {
        if (sdf(x + (sx + 0.5) / S, y + (sy + 0.5) / S) <= 0) inside++;
      }
    }
    const coverage = inside / (S * S);
    out.data[i] = src.data[i];
    out.data[i + 1] = src.data[i + 1];
    out.data[i + 2] = src.data[i + 2];
    out.data[i + 3] = Math.round(src.data[i + 3] * coverage);
  }
}

const b64 = PNG.sync.write(out).toString("base64");

// 3. Patch the EMAIL_LOGO_PNG_BASE64 constant in logoAsset.ts.
const source = fs.readFileSync(assetPath, "utf8");
const pattern = /(export const EMAIL_LOGO_PNG_BASE64 =\s*\n\s*")[^"]*(";)/;
if (!pattern.test(source)) {
  throw new Error("Could not find EMAIL_LOGO_PNG_BASE64 to replace");
}
fs.writeFileSync(assetPath, source.replace(pattern, `$1${b64}$2`));

console.log(`Updated ${path.relative(root, assetPath)} (${SIZE}x${SIZE}, radius ${r}px, ${b64.length} b64 chars)`);
