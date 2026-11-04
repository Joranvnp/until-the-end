---
name: ns-find-asc-credentials
description: Finds App Store Connect API credentials (key ID, issuer ID, .p8) and logs in the asc CLI. Use when asc auth fails, ASC_KEY_ID/ASC_ISSUER_ID/ASC_P8_PATH are unknown, or the user says "login to App Store Connect" or "find my ASC key".
disable-model-invocation: true
---

# Find App Store Connect Credentials

Owns ASC API auth for every iOS skill. Output: a validated `asc` login plus `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_P8_PATH` exported for `mobile-app/scripts/asc-api.mjs`.

## 1. Already authenticated?

```bash
asc auth status --validate
```

If a credential reports "works" and the `ASC_*` env vars are known, export them and stop.

## 2. Find `.p8` keys on disk

```bash
ls ~/.asc ~/private_keys ~/.appstoreconnect/private_keys ~/Developer/app-store 2>/dev/null
find ~/Downloads ~/Documents ~/Desktop ~/Developer -maxdepth 5 -name "AuthKey_*.p8" 2>/dev/null
```

Key ID = the `AuthKey_<KEY_ID>.p8` filename suffix. Ignore `SubscriptionKey_*.p8` (IAP) and APNs keys. Do not grep the disk for the issuer ID; it is almost never stored locally.

## 3. Read issuer ID and active keys from the user's signed-in browser

Never fill the Apple login form (password + 2FA). Ask which browser is signed in to App Store Connect and get the user's OK before attaching to or restarting it (restart closes windows; session restore brings them back).

```bash
curl -s http://127.0.0.1:9222/json/version || curl -s http://127.0.0.1:9334/json/version
# if no CDP endpoint: quit the browser, relaunch with --remote-debugging-port=9334 --restore-last-session, re-check
dev-browser --connect http://127.0.0.1:9334 --timeout 60 <<'EOF'
const page = await browser.getPage("asc");
await page.goto("https://appstoreconnect.apple.com/access/integrations/api", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(8000);
const text = await page.evaluate(() => document.body.innerText);
const m = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
console.log(JSON.stringify({ issuerId: m?.[0] ?? null, loggedOut: page.url().includes("/login") }));
console.log(text); // active keys table: NAME / KEY ID / LAST USED / ACCESS
EOF
```

`loggedOut: true` -> ask the user to sign in in that window, rerun. Use only a `.p8` whose key ID is in the active list; prefer an Admin key.

## 4. Store and log in

With the user's OK, move keys to `~/Developer/app-store/` and `chmod 600` them. Name the credential per machine, not per app (`asc-macos-<user>-key`).

```bash
asc auth login --name "asc-macos-<user>-key" --key-id "<KEY_ID>" --issuer-id "<ISSUER_ID>" \
  --private-key ~/Developer/app-store/AuthKey_<KEY_ID>.p8 --network
asc auth status --validate && asc apps list
export ASC_KEY_ID="<KEY_ID>" ASC_ISSUER_ID="<ISSUER_ID>" ASC_P8_PATH="$HOME/Developer/app-store/AuthKey_<KEY_ID>.p8"
```

Headless/CI without keychain: add `--bypass-keychain`.

## Rules

- Never commit, paste, or print `.p8` contents; never write the key/issuer IDs into tracked files. Record keys folder, active key ID, issuer ID, and credential name only in local agent memory.
- Done when `asc auth status --validate` reports "works" and `asc apps list` shows the target app. Return to the calling skill.
