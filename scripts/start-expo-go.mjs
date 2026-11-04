#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { networkInterfaces } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mobileDir = join(root, "mobile-app");
const isWindows = process.platform === "win32";
const expoBinary = join(
  mobileDir,
  "node_modules",
  ".bin",
  isWindows ? "expo.cmd" : "expo",
);
const args = process.argv.slice(2);

function assertTunnelCanStart() {
  if (!args.includes("--tunnel")) return;

  const result = spawnSync("adb", ["devices"], { encoding: "utf8" });
  if (result.status !== 0) return;

  const offlineDevices = result.stdout
    .split(/\r?\n/)
    .filter((line) => /\s+offline(?:\s|$)/.test(line));
  if (offlineDevices.length === 0) return;

  console.error(`Expo tunnel is blocked by an offline Android device:
  ${offlineDevices.join("\n  ")}

Restart or close that emulator, then retry. If both devices share Wi-Fi,
use the faster LAN command instead: npm run expo-go`);
  process.exit(1);
}

function printHelp() {
  console.log(`NowStack Expo Go preview

Usage:
  npm run expo-go
  npm run expo-go -- --tunnel
  npm run expo-go -- --port 8082 --clear

Options are forwarded to Expo CLI. LAN is the default because it is fastest.
Use --tunnel when the phone and computer cannot share the same network.`);
}

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

if (!existsSync(expoBinary)) {
  console.error(
    "Expo is not installed locally. Run `cd mobile-app && npm install`, then retry.",
  );
  process.exit(1);
}

assertTunnelCanStart();

function requestedPortFrom(cliArgs) {
  const inline = cliArgs.find((arg) => arg.startsWith("--port="));
  if (inline) return Number(inline.slice("--port=".length));

  const index = cliArgs.findIndex((arg) => arg === "--port" || arg === "-p");
  return index >= 0 ? Number(cliArgs[index + 1]) : null;
}

function withoutPortArgs(cliArgs) {
  const forwarded = [];
  for (let index = 0; index < cliArgs.length; index += 1) {
    const arg = cliArgs[index];
    if (arg.startsWith("--port=")) continue;
    if (arg === "--port" || arg === "-p") {
      index += 1;
      continue;
    }
    forwarded.push(arg);
  }
  return forwarded;
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen({ host: "0.0.0.0", port }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function firstFreePort(start = 8081, end = 8099) {
  for (let port = start; port <= end; port += 1) {
    if (await canListen(port)) return port;
  }
  return null;
}

function findLanAddress() {
  const candidates = Object.entries(networkInterfaces()).flatMap(
    ([name, addresses]) =>
      (addresses ?? [])
        .filter((address) => address.family === "IPv4" && !address.internal)
        .map((address) => ({ name, address: address.address })),
  );

  return (
    candidates.find(({ name }) => /^(en|eth|wlan|wi-?fi)/i.test(name))
      ?.address ??
    candidates[0]?.address ??
    null
  );
}

const requestedPort = requestedPortFrom(args);
if (
  requestedPort !== null &&
  (!Number.isInteger(requestedPort) || requestedPort < 1)
) {
  console.error("`--port` must be followed by a valid port number.");
  process.exit(1);
}

const port = requestedPort ?? (await firstFreePort());
if (!port) {
  console.error("No free Metro port was found between 8081 and 8099.");
  process.exit(1);
}
if (requestedPort !== null && !(await canListen(requestedPort))) {
  console.error(
    `Port ${requestedPort} is already in use. Remove --port to select one automatically.`,
  );
  process.exit(1);
}

const hasConnectionMode = args.some((arg) =>
  ["--lan", "--tunnel", "--localhost"].includes(arg),
);
const forwardedArgs = withoutPortArgs(args);
const expoArgs = [
  "start",
  "--go",
  "--port",
  String(port),
  ...(!hasConnectionMode ? ["--lan"] : []),
  ...forwardedArgs,
];
const expoPackage = JSON.parse(
  readFileSync(join(mobileDir, "node_modules", "expo", "package.json")),
);
const lanAddress = findLanAddress();
const nodeMajor = Number(process.versions.node.split(".")[0]);

console.log("\n┌──────────────────────────────────────────────┐");
console.log("│        NowStack · Expo Go preview            │");
console.log("└──────────────────────────────────────────────┘\n");
console.log(`✓ Local Expo SDK ${expoPackage.version} (no global CLI download)`);
console.log(
  `✓ Metro port ${port}${requestedPort ? "" : " selected automatically"}`,
);
if (lanAddress && !args.includes("--tunnel") && !args.includes("--localhost")) {
  console.log(`✓ Phone URL will use this network: exp://${lanAddress}:${port}`);
}
if (nodeMajor !== 22) {
  console.warn(
    `⚠ Node ${process.versions.node} detected; this repo is verified with Node 22.20.0.`,
  );
}
console.log("\nPreview support: UI, navigation, Convex and email sign-in.");
console.log(
  "Development build required: social auth callbacks, IAP, Apple Pay/Google Pay.",
);
console.log("Keep this terminal open and press Ctrl-C to stop.\n");

const child = spawn(expoBinary, expoArgs, {
  cwd: mobileDir,
  env: {
    ...process.env,
    NOWSTACK_EXPO_GO: "1",
    EXPO_PUBLIC_NOWSTACK_EXPO_GO: "1",
  },
  stdio: "inherit",
});

child.once("error", (error) => {
  console.error(`Could not start Expo Go: ${error.message}`);
  process.exitCode = 1;
});

child.once("exit", (code, signal) => {
  if (signal && signal !== "SIGINT")
    console.error(`Expo stopped after signal ${signal}.`);
  process.exitCode = code ?? (signal === "SIGINT" ? 0 : 1);
});
