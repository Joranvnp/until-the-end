#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function assertSafeDocBasename(value) {
  const normalized = value.replace(/\.(?:md|mdx)$/u, "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(normalized)) {
    throw new Error(`unsafe documentation basename: ${value}`);
  }
  return normalized;
}

export function assertNoDangerousSkillContent(name, content) {
  const forbidden = [
    [/\/Users\/[A-Za-z0-9._-]+\//u, "personal absolute path"],
    [/\.claude\/output/u, "Claude-only output path"],
    [/dev\.melvynx\.nowstack/u, "hardcoded starter Android package"],
    [/appstoretest@email\.com|OTP\/code:\s*123456|code is always `?123456/u, "public fixed review credentials"],
    [/(?:^|\n)(?![^\n]*(?:\bnever\b|\bdo not\b|\bdon't\b|\btrash\b))[^\n]*rm\s+-rf/iu, "forbidden destructive deletion"],
    [/convex\s+env\s+set(?:\s+--prod)?\s+[A-Z0-9_]*(?:SECRET|TOKEN|KEY|PASSWORD)[A-Z0-9_]*\s+(?:"[^$]|'[^$]|<|\$\()/u, "Convex secret passed in argv"],
  ];
  for (const [pattern, label] of forbidden) {
    if (pattern.test(content)) throw new Error(`${name}: ${label}`);
  }
  const unsafeCloudflareLine = content
    .split(/\r?\n/u)
    .find((line) => /CLOUDFLARE_API_TOKEN[^\n]*(?:--token|\.env)/u.test(line) && !/\bnever\b|environment only/iu.test(line));
  if (unsafeCloudflareLine) throw new Error(`${name}: Cloudflare token in argv or dotenv`);
}

export function assertFreshPublicationConfirmation(name, content) {
  if (!/fresh explicit (?:user )?(?:confirmation|approval)/iu.test(content)) {
    throw new Error(`${name}: missing fresh explicit publication confirmation`);
  }
  if (!/read[- ]back|read back|provider state|store state/iu.test(content)) {
    throw new Error(`${name}: missing provider read-back requirement`);
  }
}

export function assertProductionCredentialBoundary(content) {
  if (/env get[^\n]*(?:RESEND|AUTH|STRIPE|OAUTH)[^\n]*\)"?/iu.test(content)) {
    throw new Error("production workflow copies a development secret");
  }
  const unsafePaymentLine = content
    .split(/\r?\n/u)
    .find((line) => /sk_test_|whsec_(?:test|dev)|development webhook/iu.test(line) && !/\bnever\b|\bdo not\b/iu.test(line));
  if (unsafePaymentLine) {
    throw new Error("production workflow contains test-mode payment credentials");
  }
}

export function assertRouterTargets(router, skillNames) {
  const targets = [...router.matchAll(/\.agents\/skills\/([a-z0-9-]+)\/SKILL\.md/gu)].map((match) => match[1]);
  for (const target of targets) {
    if (!skillNames.has(target)) throw new Error(`router target missing: ${target}`);
  }
  return new Set(targets);
}

export function assertLockEntry(name, entry) {
  if (!entry || !["project-owned", "imported"].includes(entry.ownership)) throw new Error(`${name}: invalid lock ownership`);
  if (!["primary", "helper", "reference"].includes(entry.role)) throw new Error(`${name}: invalid lock role`);
  if (!/^[a-f0-9]{64}$/u.test(entry.sha256 ?? "")) throw new Error(`${name}: invalid lock hash`);
  if (entry.ownership === "imported" && entry.update_policy !== "manual-review-required") {
    throw new Error(`${name}: imported updates must require manual review`);
  }
  if (entry.ownership === "imported") {
    if (!entry.upstream_ref || /^(?:latest|main|master|head)$/iu.test(entry.upstream_ref)) throw new Error(`${name}: imported lock needs an immutable reviewed ref`);
    if (entry.reviewed_sha256 !== entry.sha256 || !/^\d{4}-\d{2}-\d{2}$/u.test(entry.reviewed_on ?? "")) {
      throw new Error(`${name}: imported snapshot review is missing or stale`);
    }
  }
}

async function walk(root) {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else files.push(absolute);
  }
  return files.sort();
}

async function hashDirectory(root) {
  const hash = createHash("sha256");
  for (const file of await walk(root)) {
    const relative = path.relative(root, file);
    if (["agents/openai.yaml", "assets/codex-icon.svg"].includes(relative)) continue;
    hash.update(relative);
    hash.update("\0");
    hash.update(await readFile(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function exists(file) {
  try { await readFile(file); return true; } catch { return false; }
}

async function checkReferences(repoRoot, skillRoot, markdown) {
  const references = new Set();
  for (const match of markdown.matchAll(/\.agents\/skills\/[a-z0-9-]+\/SKILL\.md/gu)) references.add(match[0]);
  for (const match of markdown.matchAll(/(?<![A-Za-z0-9_/-])(?:references|scripts|steps)\/[A-Za-z0-9._/-]+/gu)) references.add(match[0].replace(/[.,:;)]+$/u, ""));
  for (const reference of references) {
    const candidates = reference.startsWith(".agents/")
      ? [path.resolve(repoRoot, reference)]
      : [path.resolve(skillRoot, reference), path.resolve(repoRoot, reference)];
    const safeCandidates = candidates.filter((candidate) => isInside(repoRoot, candidate));
    if (!safeCandidates.length || !(await Promise.all(safeCandidates.map(exists))).some(Boolean)) {
      throw new Error(`${path.basename(skillRoot)}: missing or unsafe reference ${reference}`);
    }
  }
}

export async function scanSkillTree(repoRoot, skillRoot) {
  const textExtensions = new Set([".md", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".sh", ".yaml", ".yml", ".json"]);
  for (const file of await walk(skillRoot)) {
    if (!textExtensions.has(path.extname(file))) continue;
    const content = await readFile(file, "utf8");
    const label = path.relative(repoRoot, file);
    assertNoDangerousSkillContent(label, content);
    if (path.extname(file) === ".md") await checkReferences(repoRoot, skillRoot, content);
  }
}

export async function validateSkillSystem(repoRoot = defaultRoot) {
  const skillsRoot = path.join(repoRoot, ".agents", "skills");
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const names = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const nameSet = new Set(names);
  const lock = JSON.parse(await readFile(path.join(repoRoot, "skills-lock.json"), "utf8"));
  if (Object.keys(lock.skills ?? {}).sort().join("\0") !== names.join("\0")) throw new Error("skills-lock catalog differs from skill directories");

  for (const name of names) {
    const skillRoot = path.join(skillsRoot, name);
    const markdown = await readFile(path.join(skillRoot, "SKILL.md"), "utf8");
    await scanSkillTree(repoRoot, skillRoot);
    const icon = await readFile(path.join(skillRoot, "assets", "codex-icon.svg"), "utf8");
    if (!/^<svg[\s\S]*<title[\s\S]*<\/svg>\s*$/u.test(icon)) throw new Error(`${name}: invalid SVG icon`);
    if (/<script|<linearGradient|<radialGradient|(?:href|xlink:href)=["']https?:\/\//iu.test(icon)) throw new Error(`${name}: unsafe or non-portable SVG icon`);
    const yaml = await readFile(path.join(skillRoot, "agents", "openai.yaml"), "utf8");
    if (!yaml.includes(`$${name}`)) throw new Error(`${name}: default_prompt does not name the skill`);
    if (!/allow_implicit_invocation:\s*(?:true|false)/u.test(yaml)) throw new Error(`${name}: invocation policy missing`);
    assertLockEntry(name, lock.skills[name]);
    const actualHash = await hashDirectory(skillRoot);
    if (actualHash !== lock.skills[name].sha256) throw new Error(`${name}: stale lock hash`);
  }

  const router = await readFile(path.join(skillsRoot, "ns", "SKILL.md"), "utf8");
  const routed = assertRouterTargets(router, nameSet);
  for (const name of names.filter((value) => value.startsWith("ns-"))) {
    if (lock.skills[name].role === "primary" && !routed.has(name)) throw new Error(`${name}: primary workflow is not routed by ns`);
  }

  for (const name of ["ns-release", "ns-web-deploy", "ns-ios-distribute", "ns-android-distribute"]) {
    assertFreshPublicationConfirmation(name, await readFile(path.join(skillsRoot, name, "SKILL.md"), "utf8"));
  }
  assertProductionCredentialBoundary(await readFile(path.join(skillsRoot, "ns-ios-testflight", "SKILL.md"), "utf8"));
  const gitignore = await readFile(path.join(repoRoot, ".gitignore"), "utf8");
  if (!gitignore.includes(".agents/output/")) throw new Error(".agents/output is not gitignored");

  const metadataCheck = spawnSync(process.execPath, [path.join(repoRoot, "scripts", "sync-skill-metadata.mjs"), "--check"], { cwd: repoRoot, encoding: "utf8" });
  if (metadataCheck.status !== 0) throw new Error(metadataCheck.stderr || metadataCheck.stdout || "metadata check failed");
  return { skills: names.length, routed: routed.size, imported: Object.values(lock.skills).filter((entry) => entry.ownership === "imported").length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await validateSkillSystem();
    console.log(`Skill system verified: ${result.skills} skills, ${result.routed} routed targets, ${result.imported} imported snapshots`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
