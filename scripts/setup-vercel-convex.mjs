#!/usr/bin/env node
/**
 * Autonomously wires Vercel to deploy Convex on every web build.
 *
 * It mints a Convex PRODUCTION deploy key with the Convex CLI and sets it (plus
 * the auth URL and support email) on the linked Vercel project, so the build
 * command in web-app/vercel.json (`convex deploy --cmd ...`) ships the backend
 * and frontend together. Idempotent: re-running skips env vars already set
 * unless you pass --force.
 *
 * Prerequisites:
 *   - `vercel login` and the project linked from the REPO ROOT: `vercel link`
 *     (this script then sets the Vercel project Root Directory to `web-app`).
 *   - Convex set up locally (`npx convex dev` at least once).
 *
 * Usage (from repo root):
 *   npm run setup:vercel -- --confirm-production
 *   npm run setup:vercel -- --confirm-production --force
 */
import { execSync, execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const unknownArgs = process.argv.slice(2).filter((arg) => !["--force", "--confirm-production"].includes(arg));
if (unknownArgs.length) {
  console.error(`[setup-vercel-convex] ERROR: Unknown option(s): ${unknownArgs.join(", ")}`);
  process.exit(2);
}
const force = process.argv.includes("--force");
const confirmProduction = process.argv.includes("--confirm-production");
const log = (m) => console.log(`[setup-vercel-convex] ${m}`);
const die = (m) => {
  console.error(`[setup-vercel-convex] ERROR: ${m}`);
  process.exit(1);
};
let vercelCommand = null;

if (!confirmProduction) {
  die("production Vercel/project/env mutation requires --confirm-production after the user confirms the exact project and Convex deployment");
}

// Where is the Vercel project linked? (repo root or web-app)
const linkedDir = [".", "web-app"].find((d) =>
  existsSync(path.join(root, d, ".vercel", "project.json")),
);
const vercelCwd = linkedDir ? path.join(root, linkedDir) : null;

function sh(cmd, opts = {}) {
  return execSync(cmd, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
}
function resolveVercelCommand() {
  try {
    sh("command -v vercel", { stdio: "ignore" });
    return { bin: "vercel", prefix: [] };
  } catch {
    die("Vercel CLI not found. Run /ns doctor, review the proposed version, and install it explicitly before retrying.");
  }
}
function vercel(args, opts = {}) {
  vercelCommand ??= resolveVercelCommand();
  return execFileSync(vercelCommand.bin, [...vercelCommand.prefix, ...args], {
    cwd: vercelCwd ?? root,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    ...opts,
  });
}

// --- preflight ---------------------------------------------------------------
let whoami = "";
try {
  whoami = vercel(["whoami"]).trim();
} catch {
  die("Not logged in to Vercel. Run: vercel login");
}
if (!vercelCwd) {
  die(
    "No linked Vercel project found (.vercel/project.json). Link it first:\n" +
      "  vercel link   # run from the REPO ROOT, choose the project\n" +
      "Linking at the repo root lets `vercel --prod --archive=tgz` upload the whole\n" +
      "monorepo so the build's `cd ..` reaches the root convex/ folder.",
  );
}
log(`Vercel user: ${whoami}`);
log(`Linked project dir: ${path.relative(root, vercelCwd) || "."}`);

// --- ensure the Vercel project Root Directory = web-app ----------------------
// Vercel reads web-app/vercel.json (and runs the build) from this directory.
// Without it the build runs at the repo root and ignores our build wiring.
// We set it via the REST API using the token the Vercel CLI already stored, so
// the user never has to touch the dashboard. Non-fatal if it can't be set.
function readVercelToken() {
  const candidates = [
    process.env.HOME && path.join(process.env.HOME, "Library/Application Support/com.vercel.cli/auth.json"),
    process.env.XDG_DATA_HOME && path.join(process.env.XDG_DATA_HOME, "com.vercel.cli/auth.json"),
    process.env.HOME && path.join(process.env.HOME, ".local/share/com.vercel.cli/auth.json"),
  ].filter(Boolean);
  for (const p of candidates) {
    try {
      if (existsSync(p)) {
        const tok = JSON.parse(readFileSync(p, "utf8")).token;
        if (tok) return tok;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

async function ensureRootDirectory() {
  let project;
  try {
    project = JSON.parse(readFileSync(path.join(vercelCwd, ".vercel", "project.json"), "utf8"));
  } catch {
    return;
  }
  const token = readVercelToken();
  if (!token || !project?.projectId) {
    die("could not verify/set Vercel Root Directory because the linked project token/id is unavailable; production setup is NOT VERIFIABLE");
  }
  const team = project.orgId?.startsWith("team_") ? `?teamId=${project.orgId}` : "";
  const url = `https://api.vercel.com/v9/projects/${project.projectId}${team}`;
  try {
    const cur = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    if (cur?.rootDirectory === "web-app") {
      log("Vercel Root Directory already = web-app");
      return;
    }
    const res = await fetch(url, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ rootDirectory: "web-app" }),
    });
    if (res.ok) log("set Vercel Root Directory = web-app");
    else die(`could not set Vercel Root Directory (HTTP ${res.status}); refusing partial production setup`);
  } catch (e) {
    die(`could not verify/set Vercel Root Directory (${String(e.message || e)}); refusing partial production setup`);
  }
}
await ensureRootDirectory();

// --- read what Vercel already has --------------------------------------------
let envList = "";
try {
  envList = vercel(["env", "ls", "production"]);
} catch (error) {
  die(`could not read Vercel Production env; refusing to treat it as empty: ${String(error.stderr || error.message || error)}`);
}
const hasEnv = (name) =>
  new RegExp(`^\\s*${name}\\b`, "m").test(envList) || new RegExp(`\\b${name}\\b`).test(envList);

function setEnv(name, value, { sensitive = false } = {}) {
  if (hasEnv(name) && !force) {
    log(`${name} already set on Production — skipping (use --force to overwrite)`);
    return;
  }
  if (hasEnv(name) && force) {
    try {
      vercel(["env", "rm", name, "production", "--yes"], { stdio: ["ignore", "ignore", "ignore"] });
    } catch {
      /* ignore */
    }
  }
  const args = ["env", "add", name, "production"];
  if (sensitive) args.push("--sensitive");
  vercel(args, { input: value });
  log(`set ${name} on Production`);
}

// --- mint the Convex production deploy key ------------------------------------
let deployKey = "";
if (hasEnv("CONVEX_DEPLOY_KEY") && !force) {
  log("CONVEX_DEPLOY_KEY already set on Production — skipping key generation (use --force to mint a new one)");
} else {
  log("minting a Convex production deploy key (npx convex deployment token create)…");
  // Use only the repo-installed, lockfile-controlled Convex CLI. Upgrading it is
  // a separate reviewed dependency change, never an automatic mutable fallback.
  const mint = () => execFileSync("npx", ["--no-install", "convex", "deployment", "token", "create", "vercel-production", "--prod"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  try {
    deployKey = mint();
  } catch (e) {
    const msg = String(e.stderr || e.message || e);
    die(
      "could not create a Convex deploy key with the repo-installed CLI. Review/update the pinned Convex dependency separately if needed.\n" +
        "Run `npx convex deploy` once, then retry. Underlying error:\n" + msg,
    );
  }
  // Take the last non-empty line (the key); convex may print progress above it.
  deployKey = deployKey.split("\n").map((l) => l.trim()).filter(Boolean).pop() ?? "";
  if (!/\|/.test(deployKey)) die("unexpected deploy key format; value intentionally not logged");
  setEnv("CONVEX_DEPLOY_KEY", deployKey, { sensitive: true });
}

// --- derive prod URLs from the key, set the auth site URL --------------------
// A prod deploy key looks like `prod:<deployment-name>|<secret>`.
if (deployKey) {
  const m = deployKey.match(/^prod:([a-z0-9-]+)\|/);
  if (m) {
    const siteUrl = `https://${m[1]}.convex.site`;
    setEnv("VITE_CONVEX_SITE_URL", siteUrl);
  } else {
    log("could not derive the deployment name from the key — set VITE_CONVEX_SITE_URL manually (prod .convex.site URL)");
  }
} else if (!hasEnv("VITE_CONVEX_SITE_URL")) {
  die("VITE_CONVEX_SITE_URL is absent and no verified fresh key is available; production setup is incomplete");
}

// --- support email from site-config ------------------------------------------
try {
  const cfg = readFileSync(path.join(root, "site-config.ts"), "utf8");
  const email = cfg.match(/email:\s*"([^"]+)"/)?.[1];
  if (email) setEnv("VITE_EMAIL_CONTACT", email);
} catch {
  /* optional */
}

log("done. Note: VITE_CONVEX_URL is injected automatically by `convex deploy --cmd-url-env-var-name` at build time — do not set it manually.");
log("Next: push to main, or from the REPO ROOT run `vercel --prod --archive=tgz` (never `cd web-app && vercel --prod`). The build now deploys Convex, then builds the frontend.");
