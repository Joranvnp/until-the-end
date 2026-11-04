#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const authUtilsPath = path.join(scriptDir, "..", "app", "lib", "auth-utils.ts");
const source = fs.readFileSync(authUtilsPath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});

const moduleUrl = `data:text/javascript;base64,${Buffer.from(
  transpiled.outputText,
).toString("base64")}`;
const { normalizeAuthCallbackUrl } = await import(moduleUrl);

const cases = [
  [undefined, "/app"],
  ["", "/app"],
  ["https://evil.com", "/app"],
  ["//evil.com", "/app"],
  ["/\\evil.com", "/app"],
  ["/%5Cevil.com", "/app"],
  ["/%5cevil.com", "/app"],
  ["/%0devil", "/app"],
  ["/auth/signin", "/app"],
  ["/app", "/app"],
  ["/account/plan?checkout_session_id=abc#done", "/account/plan?checkout_session_id=abc#done"],
  ["/admin/users/123?tab=payments", "/admin/users/123?tab=payments"],
];

for (const [input, expected] of cases) {
  assert.equal(normalizeAuthCallbackUrl(input), expected, String(input));
}

console.log(`Auth callback verification passed: ${cases.length}/${cases.length} cases covered.`);
