#!/usr/bin/env node
/**
 * Vercel build entrypoint for the web app.
 *
 * Production: deploy the Convex backend and build the web app with the
 * deployment URL injected (`convex deploy --cmd ... --cmd-url-env-var-name`).
 *
 * Preview/local: skip the Convex deploy (CONVEX_DEPLOY_KEY is Production-only
 * by design) and build the web app against the `VITE_CONVEX_URL` set in the
 * Vercel Preview environment.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webApp = path.join(root, "web-app");

const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, stdio: "inherit", env: process.env });

if (process.env.VERCEL_ENV === "production") {
  run(
    "npx",
    [
      "convex",
      "deploy",
      "--cmd",
      "cd web-app && npm run build",
      "--cmd-url-env-var-name",
      "VITE_CONVEX_URL",
    ],
    root,
  );
} else {
  console.log(
    `[build-vercel] VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}: skipping Convex deploy, building web app with VITE_CONVEX_URL from env`,
  );
  run("npm", ["run", "build"], webApp);
}
