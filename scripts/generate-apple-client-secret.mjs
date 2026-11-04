#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { createPrivateKey, sign } from "node:crypto";
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const values = { prod: false, days: 180 };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--prod" || argument === "--dry-run") {
      values[argument.slice(2)] = true;
      continue;
    }
    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected argument: ${argument}`);
    }
    const key = argument.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${argument}`);
    }
    values[key] = value;
    index += 1;
  }
  values.days = Number(values.days);
  return values;
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function setConvexEnv(name, value, prod) {
  const args = ["convex", "env", "set"];
  if (prod) args.push("--prod");
  args.push(name);

  const result = spawnSync("npx", args, {
    input: `${value}\n`,
    stdio: ["pipe", "inherit", "inherit"],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Failed to set ${name} in Convex`);
  }
}

const options = parseArgs(process.argv.slice(2));
const required = ["team-id", "client-id", "key-id", "private-key"];
for (const key of required) {
  if (!options[key]) throw new Error(`Missing required --${key}`);
}
if (!Number.isInteger(options.days) || options.days < 1 || options.days > 180) {
  throw new Error("--days must be an integer between 1 and 180");
}

const now = Math.floor(Date.now() / 1000);
const expiresAt = now + options.days * 24 * 60 * 60;
const header = { alg: "ES256", kid: options["key-id"], typ: "JWT" };
const claims = {
  iss: options["team-id"],
  iat: now,
  exp: expiresAt,
  aud: "https://appleid.apple.com",
  sub: options["client-id"],
};
const signingInput = `${encode(header)}.${encode(claims)}`;
const privateKey = createPrivateKey(readFileSync(options["private-key"], "utf8"));
const signature = sign("sha256", Buffer.from(signingInput), {
  key: privateKey,
  dsaEncoding: "ieee-p1363",
});
if (signature.length !== 64) {
  throw new Error(`Invalid ES256 JOSE signature length: ${signature.length}`);
}

const clientSecret = `${signingInput}.${signature.toString("base64url")}`;
if (!options["dry-run"]) {
  setConvexEnv("APPLE_CLIENT_ID", options["client-id"], options.prod);
  setConvexEnv("APPLE_CLIENT_SECRET", clientSecret, options.prod);
}

console.log(
  `Apple auth ${options["dry-run"] ? "validated" : "configured"} for ${options.prod ? "production" : "development"}; JWT expires ${new Date(expiresAt * 1000).toISOString()}`,
);
