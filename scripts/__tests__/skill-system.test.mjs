import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  assertFreshPublicationConfirmation,
  assertLockEntry,
  assertNoDangerousSkillContent,
  assertProductionCredentialBoundary,
  assertRouterTargets,
  assertSafeDocBasename,
  scanSkillTree,
} from "../check-skill-system.mjs";
import { assertImportedCatalogChange, assertImportedSnapshotChange } from "../sync-skill-metadata.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("documentation helper rejects traversal", () => {
  assert.throws(() => assertSafeDocBasename("../escape"));
  const escaped = path.join(repoRoot, "escape.md");
  const result = spawnSync("bash", [path.join(repoRoot, ".agents/skills/ns-add-documentation/scripts/create-doc.sh"), "../escape"], { cwd: repoRoot, encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.equal(existsSync(escaped), false);
});

test("dangerous skill content is rejected", () => {
  assert.throws(() => assertNoDangerousSkillContent("bad", "npx convex env set API_SECRET \"plain-secret\""));
  assert.throws(() => assertNoDangerousSkillContent("bad", "package dev.melvynx.nowstack"));
});

test("nested skill scripts are safety-scanned", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "nowstack-skill-check-"));
  const skillRoot = path.join(root, ".agents", "skills", "fixture");
  await mkdir(path.join(skillRoot, "scripts"), { recursive: true });
  await writeFile(path.join(skillRoot, "SKILL.md"), "---\nname: fixture\ndescription: A fixture skill description that is long enough for this focused nested scan.\n---\n\n# Fixture\n");
  await writeFile(path.join(skillRoot, "scripts", "unsafe.sh"), "rm -rf /tmp/fixture\n");
  await assert.rejects(() => scanSkillTree(root, skillRoot), /forbidden destructive deletion/u);
});

test("publication without fresh confirmation or read-back is rejected", () => {
  assert.throws(() => assertFreshPublicationConfirmation("bad", "git push origin main"));
  assert.doesNotThrow(() => assertFreshPublicationConfirmation("good", "Get fresh explicit user confirmation, publish, then verify provider read-back."));
});

test("production workflow cannot copy dev secrets or use test Stripe credentials", () => {
  assert.throws(() => assertProductionCredentialBoundary('npx convex env set --prod RESEND_API_KEY "$(npx convex env get RESEND_API_KEY)"'));
  assert.throws(() => assertProductionCredentialBoundary("STRIPE_SECRET_KEY=sk_test_example"));
});

test("missing router target is rejected", () => {
  assert.throws(() => assertRouterTargets("`.agents/skills/missing/SKILL.md`", new Set(["ns"])));
});

test("ns-preview stays a single host-agnostic serve-sim workflow", () => {
  const skillRoot = path.join(repoRoot, ".agents", "skills", "ns-preview");
  const skill = readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");

  assert.match(skill, /serve-sim@latest --kill "\$SIM"/u);
  assert.match(skill, /serve-sim@latest --host 127\.0\.0\.1 "\$SIM"/u);
  assert.match(skill, /Never run an unscoped `serve-sim --kill`/u);
  assert.match(skill, /There is no host-specific path/u);

  assert.ok(!existsSync(path.join(skillRoot, "agents", "codex.md")), "per-harness Codex adapter must not come back");
  assert.ok(!existsSync(path.join(skillRoot, "agents", "claude.md")), "per-harness Claude adapter must not come back");
  assert.doesNotMatch(skill, /\bCodex\b|\bClaude Code\b|xcodebuildmcp/u);
});

test("import lock must be hashed and fail closed", () => {
  assert.throws(() => assertLockEntry("bad", { ownership: "imported", role: "primary", sha256: "0".repeat(64), update_policy: "auto" }));
  assert.throws(() => assertLockEntry("mutable", { ownership: "imported", role: "reference", sha256: "a".repeat(64), reviewed_sha256: "a".repeat(64), reviewed_on: "2026-07-16", upstream_ref: "main", update_policy: "manual-review-required" }));
  assert.doesNotThrow(() => assertLockEntry("good", { ownership: "imported", role: "reference", sha256: "a".repeat(64), reviewed_sha256: "a".repeat(64), reviewed_on: "2026-07-16", upstream_ref: "v1.0.0", update_policy: "manual-review-required" }));
});

test("imported content changes require explicit reviewed acceptance", () => {
  assert.throws(() => assertImportedSnapshotChange("imported", "a".repeat(64), "b".repeat(64), false), /--accept-imported/u);
  assert.doesNotThrow(() => assertImportedSnapshotChange("imported", "a".repeat(64), "b".repeat(64), true));
});

test("imported snapshots cannot be silently removed or reclassified", () => {
  const previous = { imported: { ownership: "imported" } };
  assert.throws(() => assertImportedCatalogChange(previous, [], [], false), /--accept-imported/u);
  assert.throws(() => assertImportedCatalogChange(previous, ["imported"], [], false), /--accept-imported/u);
  assert.doesNotThrow(() => assertImportedCatalogChange(previous, [], [], true));
  assert.throws(() => assertImportedCatalogChange({}, [], ["missing"], true), /missing skill directories/u);
});

test("setup checker rejects unknown options", () => {
  const result = spawnSync(process.execPath, [path.join(repoRoot, "scripts/check-setup.mjs"), "--definitely-unknown"], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Unknown option/u);
});

test("setup checker JSON mode emits parseable JSON only", () => {
  const result = spawnSync(process.execPath, [path.join(repoRoot, "scripts/check-setup.mjs"), "--skip-convex", "--json"], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.mode, "development");
  assert.equal(payload.ok, true);
});

test("setup checker rejects ambiguous mode combinations", () => {
  for (const args of [["--accounts", "--prod", "--json"], ["--accounts", "--skip-convex", "--json"]]) {
    const result = spawnSync(process.execPath, [path.join(repoRoot, "scripts/check-setup.mjs"), ...args], { cwd: repoRoot, encoding: "utf8" });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /cannot be combined/u);
  }
});

test("Better Auth trusts the required local web port", () => {
  const authSource = readFileSync(path.join(repoRoot, "convex/auth.ts"), "utf8");
  assert.match(authSource, /localDevOrigins\(\[[^\]]*\b3003\b[^\]]*\]\)/u);
});
