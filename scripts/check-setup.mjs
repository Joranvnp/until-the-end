#!/usr/bin/env node
/**
 * Validates that the boilerplate is correctly configured before you run or
 * deploy the app. Catches the classic traps: placeholder EAS project id,
 * missing Convex env vars (silent OTP email failures), out-of-sync
 * convex/siteConfig.ts, swapped Convex URLs, placeholder eas.json values.
 *
 * Usage:
 *   npm run check-setup            # checks local files + dev Convex deployment
 *   npm run check-setup -- --prod  # checks the production Convex deployment
 *   npm run check-setup -- --skip-convex  # offline: skip `npx convex env list`
 *   npm run check-setup -- --accounts     # ONLY check external accounts:
 *                                         #   CLI installed + authenticated for
 *                                         #   Convex, EAS, Vercel, Apple, Stripe,
 *                                         #   Google Play. Used by the
 *                                         #   setup-accounts skill. Machine-readable
 *                                         #   "service|status|hint" lines + emoji.
 */
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const allowedArgs = new Set(["--prod", "--skip-convex", "--accounts", "--json"]);
const unknownArgs = args.filter((arg) => !allowedArgs.has(arg));
if (unknownArgs.length > 0) {
  console.error(`Unknown option(s): ${unknownArgs.join(", ")}`);
  process.exit(2);
}
const isProd = args.includes("--prod");
const skipConvex = args.includes("--skip-convex");
const isAccounts = args.includes("--accounts");
const jsonMode = args.includes("--json");

if (isProd && skipConvex) {
  console.error("--prod cannot be combined with --skip-convex: production checks must fail closed");
  process.exit(2);
}
if (isAccounts && (isProd || skipConvex)) {
  console.error("--accounts cannot be combined with --prod or --skip-convex; choose one explicit check mode");
  process.exit(2);
}

let errors = 0;
let warnings = 0;
const results = [];
const emit = (status, msg, sectionName = null) => {
  results.push({ status, message: msg, ...(sectionName ? { section: sectionName } : {}) });
  if (!jsonMode) console.log(`  ${status === "ok" ? "✅" : status === "warning" ? "⚠️ " : "❌"} ${msg}`);
};
const ok = (msg) => emit("ok", msg);
const warn = (msg) => {
  warnings++;
  emit("warning", msg);
};
const fail = (msg) => {
  errors++;
  emit("error", msg);
};
const section = (title) => {
  results.push({ status: "section", message: title });
  if (!jsonMode) console.log(`\n${title}`);
};

const read = (rel) => readFileSync(path.join(root, rel), "utf8");
const extract = (source, key) => {
  const match = source.match(new RegExp(`${key}:\\s*"([^"]*)"`));
  return match ? match[1] : null;
};

// --- accounts mode ----------------------------------------------------------
// `--accounts` runs ONLY the external-account checks and exits. For each
// service it answers two questions the setup-accounts skill needs: is the CLI
// installed, and is it authenticated / configured. Output is dual-purpose:
// an emoji line for humans, and a machine-readable `service|status|hint` line
// (status ∈ ready|todo|skip-ok) the skill greps to decide what to do next.
if (isAccounts) {
  const accountResults = [];
  const home = process.env.HOME ?? "";
  // Run a shell command without throwing; capture stdout+stderr and exit code.
  const sh = (cmd, timeout = 20_000) => {
    try {
      const out = execSync(cmd, {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout,
      });
      return { ok: true, out: out.trim() };
    } catch (err) {
      return {
        ok: false,
        out: `${err.stdout ?? ""}${err.stderr ?? ""}`.trim(),
        code: err.status,
      };
    }
  };
  const installed = (bin) => sh(`command -v ${bin}`).ok;

  // ready: CLI present AND authenticated. todo: action needed. The skill reads
  // the `service|status|hint` line; humans read the emoji line above it.
  const report = (service, status, human, hint) => {
    const icon = status === "ready" ? "✅" : status === "skip-ok" ? "⏭️ " : "⚠️ ";
    if (status === "todo") warnings++;
    accountResults.push({ service, status, hint, message: human });
    if (!jsonMode) {
      console.log(`  ${icon} ${human}`);
      console.log(`     ${service}|${status}|${hint}`);
    }
  };

  // Merge env files so we can see if a Convex deployment / Stripe key is wired.
  const envText = [
    ".env",
    ".env.local",
    "mobile-app/.env",
    "mobile-app/.env.local",
    "web-app/.env",
    "web-app/.env.local",
  ]
    .filter((f) => existsSync(path.join(root, f)))
    .map((f) => read(f))
    .join("\n");
  const envHas = (key) => new RegExp(`^\\s*${key}=\\S`, "m").test(envText);
  const cfg = read("site-config.ts");

  if (!jsonMode) console.log("External accounts (CLI install + authentication)\n");

  // 1. Convex — npx-resolved CLI; auth token in ~/.convex, deployment in .env.
  const convexAuthed = existsSync(path.join(home, ".convex", "config.json")) ||
    sh("npx --no-install convex env list", 30_000).ok;
  const convexDeployment = envHas("CONVEX_DEPLOYMENT");
  if (convexAuthed && convexDeployment) {
    report("convex", "ready", "Convex: logged in, deployment configured", "ok");
  } else if (convexAuthed) {
    report("convex", "todo", "Convex: logged in but no deployment in .env", "run `npx convex dev` once to create a dev deployment");
  } else {
    report("convex", "todo", "Convex: not logged in", "run `npx convex dev` (opens browser to sign up / log in)");
  }

  // 2. Expo / EAS — `eas whoami` prints the username or errors when logged out.
  // Prefer a globally installed `eas`; fall back to a locally installed eas-cli.
  const easWho = installed("eas")
    ? sh("eas whoami")
    : sh("npx --no-install eas-cli whoami");
  const easName = easWho.out.split("\n").find((l) => l.trim() && !/^[★●>]/.test(l.trim()));
  if (easWho.ok && easName && !/not logged in/i.test(easWho.out)) {
    report("eas", "ready", `Expo/EAS: logged in as ${easName.trim()}`, "ok");
  } else {
    report("eas", "todo", "Expo/EAS: not logged in", "run `npx eas-cli login` (sign up at expo.dev first), then `cd mobile-app && npx eas-cli init`");
  }

  // 3. Vercel — `vercel whoami` is the auth probe.
  if (!installed("vercel")) {
    report("vercel", "todo", "Vercel: CLI not installed", "run `npm i -g vercel`, then `vercel login`");
  } else {
    const vWho = sh("vercel whoami");
    if (vWho.ok && vWho.out) {
      report("vercel", "ready", `Vercel: logged in as ${vWho.out.split("\n")[0]}`, "ok");
    } else {
      report("vercel", "todo", "Vercel: not logged in", "run `vercel login`");
    }
  }

  // 4. Apple — `asc` CLI; auth validates against App Store Connect API key.
  const appleTeamId = extract(cfg, "appleTeamId");
  const teamIdReady = appleTeamId && appleTeamId.length === 10 && !/^x{4,}$/i.test(appleTeamId);
  if (!installed("asc")) {
    report("apple", "todo", "Apple: asc CLI not installed", "needs a paid Apple Developer account ($99/yr). Install asc, then run the find-asc-credentials skill");
  } else {
    const ascStatus = sh("asc auth status --validate", 30_000);
    const authed = ascStatus.ok && /works|valid/i.test(ascStatus.out);
    if (authed && teamIdReady) {
      report("apple", "ready", `Apple: asc authenticated, Team ID ${appleTeamId}`, "ok");
    } else if (authed) {
      report("apple", "todo", "Apple: authenticated but Team ID missing in site-config.ts", "set `appleTeamId` (10 chars) in site-config.ts");
    } else {
      report("apple", "todo", "Apple: asc not authenticated", "run the find-asc-credentials skill to log in with your ASC API key");
    }
  }

  // 5. Stripe — optional; `stripe config --list` exposes the stored api key.
  if (!installed("stripe")) {
    report("stripe", "skip-ok", "Stripe: CLI not installed (optional — web/Android payments)", "install Stripe CLI + run `stripe login`, or skip if you only ship iOS");
  } else {
    const sConf = sh("stripe config --list");
    if (sConf.ok && /api_key|test_mode_api_key|live_mode_api_key/i.test(sConf.out)) {
      report("stripe", "ready", "Stripe: CLI logged in", "ok");
    } else {
      report("stripe", "todo", "Stripe: CLI installed but not logged in", "run `stripe login`");
    }
  }

  // 6. Google Play — optional; service-account JSON drives EAS submits.
  const playKey = envHas("GOOGLE_SERVICE_ACCOUNT_KEY_PATH") ||
    existsSync(path.join(root, "mobile-app", "google-play-service-account.json"));
  if (playKey) {
    report("googleplay", "ready", "Google Play: service-account key present", "ok");
  } else {
    report("googleplay", "skip-ok", "Google Play: no service-account key (optional — Android only)", "create a Play Console account ($25 one-time) + service-account JSON, or skip if you only ship iOS/web");
  }

  if (!jsonMode) console.log(`\n${"─".repeat(60)}`);
  const todo = warnings;
  if (jsonMode) {
    console.log(JSON.stringify({ mode: "accounts", ok: todo === 0, todo, accounts: accountResults }, null, 2));
  } else {
    console.log(
      todo > 0
        ? `⚠️  ${todo} account(s) need action — the setup-accounts skill will walk each one (you can skip optional ones)`
        : "✅ All external accounts are connected",
    );
  }
  process.exit(todo > 0 ? 1 : 0);
}

// --- site-config.ts ---------------------------------------------------------
section("site-config.ts");
const rootConfig = read("site-config.ts");
const title = extract(rootConfig, "title");
const slug = extract(rootConfig, "slug");
const bundleId = extract(rootConfig, "bundleId");
const androidPackage = extract(rootConfig, "androidPackage") ?? bundleId;
const easProjectId = extract(rootConfig, "easProjectId");
const appleTeamId = extract(rootConfig, "appleTeamId");

if (!/^[a-z0-9]+(\.[a-z0-9-]+)+$/i.test(bundleId ?? "")) {
  fail(`bundleId "${bundleId}" is not a valid reverse-domain identifier`);
} else {
  ok(`bundleId: ${bundleId}`);
}

if (!/^[a-z0-9]+(\.[a-z0-9-]+)+$/i.test(androidPackage ?? "")) {
  fail(`androidPackage "${androidPackage}" is not a valid reverse-domain identifier`);
} else {
  ok(`androidPackage: ${androidPackage}`);
}

if (!easProjectId || /^x{4,}/.test(easProjectId)) {
  warn(
    "easProjectId is a placeholder — EAS builds will fail. Run `cd mobile-app && eas init`, then copy the project id into site-config.ts",
  );
} else {
  ok(`easProjectId: ${easProjectId}`);
}

if (!appleTeamId || appleTeamId.length !== 10) {
  warn(`appleTeamId "${appleTeamId}" does not look like a 10-char Apple Team ID`);
}

if (!rootConfig.includes(`"${slug}://"`)) {
  fail(
    `auth.trustedOrigins is missing "${slug}://" — mobile deep-link auth will be rejected`,
  );
} else {
  ok(`auth.trustedOrigins includes ${slug}://`);
}

const convexAuth = read("convex/auth.ts");
if (!/localDevOrigins\(\[[^\]]*\b3003\b[^\]]*\]\)/u.test(convexAuth)) {
  fail("convex/auth.ts does not trust localhost:3003 — the required local web auth flow will fail CORS");
} else {
  ok("Better Auth trusts the required local web port 3003");
}

// --- convex/siteConfig.ts sync ----------------------------------------------
section("convex/siteConfig.ts (must mirror site-config.ts)");
const convexConfig = read("convex/siteConfig.ts");
for (const key of ["title", "slug", "bundleId", "androidPackage"]) {
  const rootValue = extract(rootConfig, key);
  const convexValue = extract(convexConfig, key);
  if (rootValue !== convexValue) {
    fail(`${key} differs: site-config.ts="${rootValue}" vs convex/siteConfig.ts="${convexValue}"`);
  } else {
    ok(`${key} in sync`);
  }
}
for (const key of ["apple", "google", "stripe"]) {
  const rootValue = rootConfig.match(new RegExp(`${key}:\\s*"([^"]*)"`))?.[1];
  const convexValue = convexConfig.match(new RegExp(`${key}:\\s*"([^"]*)"`))?.[1];
  if (rootValue !== convexValue) {
    fail(`payment.productIds.${key} differs between site-config.ts and convex/siteConfig.ts`);
  }
}
if (!convexConfig.includes(`"${slug}://"`)) {
  fail(`convex/siteConfig.ts auth.trustedOrigins is missing "${slug}://"`);
}

// --- env files ------------------------------------------------------------------
// Values live in several files depending on setup style: root .env/.env.local
// (Convex CLI writes .env.local), mobile-app/.env(.local) for EXPO_PUBLIC_*,
// web-app/.env(.local) for VITE_*. Merge them all for presence checks.
const envFiles = [
  ".env",
  ".env.local",
  "mobile-app/.env",
  "mobile-app/.env.local",
  "web-app/.env",
  "web-app/.env.local",
].filter((f) => existsSync(path.join(root, f)));
section(envFiles.length ? `env files (${envFiles.join(", ")})` : "env files");
if (envFiles.length === 0) {
  fail("no env file found — run `cp .env.example .env` and fill it (see SETUP.md)");
} else {
  const env = Object.fromEntries(
    envFiles
      .flatMap((f) => read(f).split("\n"))
      .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
      .map((line) => {
        const idx = line.indexOf("=");
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim().replace(/^"|"$/g, "")];
      }),
  );

  const isPlaceholder = (value) =>
    !value || value.includes("your-deployment") || value.includes("your-") || value.endsWith("...");

  for (const [key, home] of [
    ["CONVEX_DEPLOYMENT", ".env or .env.local"],
    ["EXPO_PUBLIC_CONVEX_URL", "mobile-app/.env (or root .env)"],
    ["EXPO_PUBLIC_CONVEX_SITE_URL", "mobile-app/.env (or root .env)"],
    ["VITE_CONVEX_URL", "web-app/.env.local (or root .env)"],
    ["VITE_CONVEX_SITE_URL", "web-app/.env.local (or root .env)"],
  ]) {
    if (isPlaceholder(env[key])) {
      fail(`${key} is missing or a placeholder — set it in ${home} with the value from \`npx convex dev\` / the Convex dashboard`);
    } else {
      ok(`${key} set`);
    }
  }

  // Local vs cloud confusion: *_CONVEX_URL must be .convex.cloud, *_SITE_URL .convex.site
  for (const [key, suffix] of [
    ["EXPO_PUBLIC_CONVEX_URL", ".convex.cloud"],
    ["EXPO_PUBLIC_CONVEX_SITE_URL", ".convex.site"],
    ["VITE_CONVEX_URL", ".convex.cloud"],
    ["VITE_CONVEX_SITE_URL", ".convex.site"],
  ]) {
    const value = env[key] ?? "";
    if (value && !isPlaceholder(value) && !value.includes(suffix)) {
      if (value.includes("127.0.0.1") || value.includes("localhost")) {
        warn(
          `${key} points to a local URL (${value}). That only works with a locally running Convex backend — use your cloud deployment URL (ends with ${suffix}) otherwise`,
        );
      } else {
        fail(`${key} should end with ${suffix} (got ${value}) — cloud URL and site URL are likely swapped`);
      }
    }
  }
}

// --- mobile-app/eas.json -------------------------------------------------------
section("mobile-app/eas.json");
const easJson = read("mobile-app/eas.json");
if (easJson.includes("YOUR_CONVEX_URL_HERE")) {
  warn(
    "production env URLs are placeholders — production EAS builds will ship pointing at a dead backend. Set them to your PROD Convex deployment URLs",
  );
} else {
  ok("production env URLs are set");
}

// --- App.storekit product id -----------------------------------------------------
section("mobile-app/App.storekit");
const appleProductId = rootConfig.match(/apple:\s*"([^"]*)"/)?.[1];
if (existsSync(path.join(root, "mobile-app/App.storekit"))) {
  if (appleProductId && !read("mobile-app/App.storekit").includes(appleProductId)) {
    warn(
      `App.storekit does not contain product id "${appleProductId}" — local IAP testing will not match site-config.ts`,
    );
  } else {
    ok(`contains product id ${appleProductId}`);
  }
}

// --- web-app Vercel deploy wiring -------------------------------------------------
// The #1 web-deploy bug: Vercel builds the frontend but never runs `convex deploy`,
// so the production backend silently drifts behind every commit. The build must go
// through `convex deploy --cmd`.
section("web-app/vercel.json (Convex + frontend ship together)");
if (existsSync(path.join(root, "web-app/vercel.json"))) {
  const vercelJson = read("web-app/vercel.json");
  const buildScript = existsSync(path.join(root, "web-app/package.json"))
    ? read("web-app/package.json")
    : "";
  const deploysConvex =
    /convex deploy/.test(vercelJson) ||
    (/"buildCommand":\s*"npm run build:vercel"/.test(vercelJson) &&
      /"build:vercel":\s*"[^"]*convex deploy/.test(buildScript));
  if (deploysConvex) {
    ok("build command runs `convex deploy` (backend ships with the frontend)");
  } else {
    fail(
      "web-app/vercel.json buildCommand does not run `convex deploy` — Vercel will build the frontend against a STALE backend. Use `npm run build:vercel` (see docs/production-checklist.md stage 2)",
    );
  }
} else {
  warn(
    "web-app/vercel.json not found — set the Vercel build command to `npm run build:vercel` so `convex deploy` runs on every web deploy (docs/production-checklist.md stage 2)",
  );
}

// --- Nitro host preset (TanStack Start SSR on Vercel) ----------------------------
// Without the `nitro` Vite plugin, the build emits a host-agnostic bundle; Vercel
// detects a plain Vite SPA, ships only dist/client, and every SSR route 404s.
// The plugin makes the build write `.vercel/output` so the site actually serves.
section("web-app nitro plugin (TanStack Start SSR on Vercel)");
if (existsSync(path.join(root, "web-app/vite.config.ts"))) {
  const viteCfg = read("web-app/vite.config.ts");
  const pkg = existsSync(path.join(root, "web-app/package.json"))
    ? read("web-app/package.json")
    : "";
  const pluginWired = /nitro\s*\(\s*\)/.test(viteCfg) && /from\s+["']nitro\/vite["']/.test(viteCfg);
  const depPresent = /"nitro":/.test(pkg);
  if (pluginWired && depPresent) {
    ok("nitro() plugin wired in vite.config.ts (SSR routes serve on Vercel)");
  } else {
    fail(
      "web-app is missing the `nitro` Vite plugin — Vercel will ship a SPA and every route 404s. " +
        "Add `nitro` to web-app deps and `import { nitro } from \"nitro/vite\"` + `nitro()` (after tanstackStart()) in vite.config.ts (see ns-web-deploy)",
    );
  }
} else {
  warn("web-app/vite.config.ts not found — cannot verify the nitro host preset");
}

// --- Convex deployment env vars ---------------------------------------------------
section(`Convex deployment env vars (${isProd ? "production" : "dev"})`);
if (skipConvex) {
  results.push({ status: "skipped", message: "Convex deployment env vars skipped (--skip-convex)" });
  if (!jsonMode) console.log("  ⏭️  skipped (--skip-convex)");
} else {
  let envList = null;
  try {
    envList = execSync(`npx convex env list${isProd ? " --prod" : ""}`, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 60_000,
    });
  } catch {
    const message = "could not run `npx convex env list` — is Convex set up? (npx convex dev)";
    if (isProd) fail(`${message}; production verification is NOT VERIFIABLE`);
    else warn(`${message}. Re-run with --skip-convex for an explicitly offline dev-only check`);
  }

  if (envList) {
    const has = (key) => new RegExp(`^${key}=`, "m").test(envList);
    const required = [
      ["LUMAIL_API_KEY", "sign-in OTP emails will silently fail without it"],
      ["BETTER_AUTH_SECRET", "Better Auth needs it to sign sessions"],
      ["SITE_URL", "web auth redirects and trusted origins depend on it"],
    ];
    if (isProd) {
      required.push(
        ["APP_REVIEW_EMAIL", "App Review needs a private deployment-specific demo account"],
        ["APP_REVIEW_OTP", "App Review needs a private random six-digit OTP"],
      );
    }
    const features = {
      apple: /enableAppleSignIn:\s*true/.test(rootConfig),
      github: /enableGitHubSignIn:\s*true/.test(rootConfig),
      google: /enableGoogleSignIn:\s*true/.test(rootConfig),
    };
    if (features.apple) required.push(["APPLE_CLIENT_ID", "Apple Sign In is enabled in site-config.ts"], ["APPLE_CLIENT_SECRET", "Apple Sign In is enabled in site-config.ts"]);
    if (features.github) required.push(["GITHUB_CLIENT_ID", "GitHub Sign In is enabled in site-config.ts"], ["GITHUB_CLIENT_SECRET", "GitHub Sign In is enabled in site-config.ts"]);
    if (features.google) required.push(["GOOGLE_CLIENT_ID", "Google Sign In is enabled in site-config.ts"], ["GOOGLE_CLIENT_SECRET", "Google Sign In is enabled in site-config.ts"]);

    for (const [key, why] of required) {
      if (has(key)) ok(`${key} set`);
      else fail(`${key} missing — ${why}. Fix: printf '%s' "$VALUE" | npx convex env set${isProd ? " --prod" : ""} ${key}`);
    }

    if (isProd) {
      const values = Object.fromEntries(
        envList
          .split(/\r?\n/)
          .map((line) => {
            const index = line.indexOf("=");
            return index > 0 ? [line.slice(0, index), line.slice(index + 1)] : null;
          })
          .filter(Boolean),
      );
      if (!/^https:\/\//.test(values.SITE_URL ?? "") || /localhost|127\.0\.0\.1/.test(values.SITE_URL ?? "")) {
        fail("SITE_URL must be a real HTTPS production origin");
      }
      if (values.APP_REVIEW_OTP && !/^\d{6}$/.test(values.APP_REVIEW_OTP)) {
        fail("APP_REVIEW_OTP must be a random six-digit value");
      }
      if (values.STRIPE_SECRET_KEY && !values.STRIPE_SECRET_KEY.startsWith("sk_live_")) {
        fail("STRIPE_SECRET_KEY is not a live-mode key on the production deployment");
      }
      if (values.STRIPE_SECRET_KEY && !values.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_")) {
        fail("STRIPE_WEBHOOK_SECRET is missing or invalid on the production deployment");
      }
      if (values.APPLE_CLIENT_SECRET) {
        try {
          const payload = JSON.parse(Buffer.from(values.APPLE_CLIENT_SECRET.split(".")[1], "base64url").toString("utf8"));
          if (!payload.exp || payload.exp * 1000 <= Date.now() + 7 * 24 * 60 * 60 * 1000) {
            fail("APPLE_CLIENT_SECRET is expired or expires within seven days");
          }
        } catch {
          fail("APPLE_CLIENT_SECRET is not a parseable signed JWT");
        }
      }
    }

    const optional = [
      ["EMAIL_FROM", "emails fall back to the address in convex/siteConfig.ts"],
      ["STRIPE_SECRET_KEY", "web/Android payments will fail"],
      ["STRIPE_PRICE_ID", "Stripe checkout will have no price"],
      ["STRIPE_WEBHOOK_SECRET", "Stripe webhook verification will fail"],
      ["APPLE_SHARED_SECRET", "iOS IAP receipt validation will fail"],
      ["R2_ENDPOINT", "file storage uploads will fail"],
      ["R2_ACCESS_KEY_ID", "file storage uploads will fail"],
      ["R2_SECRET_ACCESS_KEY", "file storage uploads will fail"],
      ["R2_BUCKET_NAME", "file storage uploads will fail"],
    ];
    for (const [key, why] of optional) {
      if (has(key)) ok(`${key} set`);
      else warn(`${key} not set — ${why} (fine if you don't use this feature yet)`);
    }
  }
}

// --- Summary -------------------------------------------------------------------
if (!jsonMode) console.log(`\n${"─".repeat(60)}`);
if (errors > 0) {
  if (jsonMode) console.log(JSON.stringify({ mode: isProd ? "production" : "development", ok: false, errors, warnings, results }, null, 2));
  else console.log(`❌ ${errors} error(s), ${warnings} warning(s) — fix errors before running the app. See SETUP.md`);
  process.exit(1);
}
if (warnings > 0) {
  if (jsonMode) console.log(JSON.stringify({ mode: isProd ? "production" : "development", ok: true, errors, warnings, results }, null, 2));
  else console.log(`⚠️  0 errors, ${warnings} warning(s) — app will run, but some features/builds are not ready`);
} else {
  if (jsonMode) console.log(JSON.stringify({ mode: isProd ? "production" : "development", ok: true, errors, warnings, results }, null, 2));
  else console.log("✅ Everything looks configured");
}
