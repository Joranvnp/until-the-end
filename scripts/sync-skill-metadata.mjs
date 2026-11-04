#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillsRoot = path.join(repoRoot, ".agents", "skills");
const lockPath = path.join(repoRoot, "skills-lock.json");

const importedSources = {
  "building-native-ui": { source: "https://github.com/expo/skills", ref: "expo-plugin-1.8.1" },
  "expo-examples": { source: "https://github.com/expo/skills", ref: "expo-plugin-1.8.1" },
  "expo-ui": { source: "https://github.com/expo/skills", ref: "expo-plugin-1.8.1" },
  "upgrading-expo": { source: "https://github.com/expo/skills", ref: "expo-plugin-1.8.1" },
  "vercel-react-native-skills": { source: "https://github.com/vercel-labs/agent-skills", ref: "v1.0.0" },
  "convex-cost-optimizer": { source: "convex-ai-files", ref: "reviewed-snapshot-2026-07-16" },
  "convex-create-component": { source: "convex-ai-files", ref: "reviewed-snapshot-2026-07-16" },
  "convex-migration-helper": { source: "convex-ai-files", ref: "reviewed-snapshot-2026-07-16" },
  "convex-performance-audit": { source: "convex-ai-files", ref: "reviewed-snapshot-2026-07-16" },
  "convex-setup-auth": { source: "convex-ai-files-adapted-for-nowstack", ref: "reviewed-snapshot-2026-07-16" },
};

const helperSkills = new Set([
  "ns-find-asc-credentials",
  "ns-find-gpc-credentials",
  "ns-ios-deploy-app",
  "ns-deploy-android-app",
  "ns-intercepted-route-using-tanstack-start",
]);

const referenceSkills = new Set([
  "building-native-ui",
  "expo-examples",
  "expo-ui",
  "upgrading-expo",
  "vercel-react-native-skills",
]);

const implicitAllowlist = new Set([
  "building-native-ui",
  "expo-examples",
  "expo-ui",
  "ns-check-setup",
  "ns-ios-audit",
  "ns-ios-verification",
  "ns-launch-audit",
  "ns-preview",
  "vercel-react-native-skills",
]);

const shortOverrides = {
  ns: "Route the complete NowStack Mobile lifecycle",
  "ns-check-setup": "Validate NowStack configuration deterministically",
  "ns-ios-audit": "Audit App Store readiness without mutations",
  "ns-ios-verification": "Prove iOS behavior in the real Simulator",
  "ns-launch-audit": "Issue an evidence-backed launch readiness verdict",
  "ns-preview": "Mirror the iOS Simulator into a live browser",
  "ns-verify": "Prove real journeys across every changed surface",
  "ns-release": "Build, verify, and publish one coherent release",
  "ns-analytics": "Build privacy-safe analytics across mobile and web",
  "ns-setup-email": "Configure and prove transactional email delivery",
};

const codexToolDependencies = {};

const iconPaths = {
  audit: '<path d="M28 64 52 88 100 40"/><circle cx="64" cy="64" r="48"/>',
  auth: '<circle cx="64" cy="48" r="20"/><path d="M24 112c6-26 22-40 40-40s34 14 40 40"/><path d="M88 62h26v26H88z"/>',
  cloud: '<path d="M31 91h66a21 21 0 0 0 2-42 35 35 0 0 0-66-6 24 24 0 0 0-2 48Z"/><path d="m64 52 0 28m-12-12 12 12 12-12"/>',
  code: '<path d="m48 38-28 26 28 26M80 38l28 26-28 26M72 28 56 100"/>',
  data: '<ellipse cx="64" cy="34" rx="42" ry="16"/><path d="M22 34v30c0 9 19 16 42 16s42-7 42-16V34M22 64v30c0 9 19 16 42 16s42-7 42-16V64"/>',
  default: '<circle cx="64" cy="64" r="43"/><path d="m64 30 9 24 25 2-19 16 6 25-21-13-21 13 6-25-19-16 25-2Z"/>',
  mobile: '<rect x="35" y="14" width="58" height="100" rx="12"/><path d="M54 29h20M58 98h12"/>',
  release: '<path d="M64 18c18 9 31 25 34 45-9 18-20 29-34 47-14-18-25-29-34-47 3-20 16-36 34-45Z"/><path d="M48 69h32M64 52v34"/>',
};

function parseFrontmatter(markdown, skillName) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/u);
  if (!match) throw new Error(`${skillName}: missing frontmatter`);
  const name = match[1].match(/^name:\s*["']?([^"'\n]+)["']?\s*$/mu)?.[1]?.trim();
  const rawDescription = match[1].match(/^description:\s*(.+)$/mu)?.[1]?.trim();
  if (name !== skillName) throw new Error(`${skillName}: frontmatter name mismatch (${name ?? "missing"})`);
  if (!rawDescription) throw new Error(`${skillName}: missing single-line description`);
  const description = rawDescription.replace(/^(["'])([\s\S]*)\1$/u, "$2");
  const length = Array.from(description).length;
  if (length < 50 || length > 300) throw new Error(`${skillName}: description length ${length}, expected 50-300`);
  return { description };
}

function displayName(name) {
  return name
    .split("-")
    .map((part) => ({ ns: "NS", ios: "iOS", r2: "R2", ui: "UI", prd: "PRD", asc: "ASC", gpc: "GPC" })[part] ?? `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function shortDescription(name, description) {
  if (shortOverrides[name]) return shortOverrides[name];
  const clean = description.replace(/[`*_"']/gu, "").split(/(?<=[.!?])\s/u)[0].replace(/[.!?]+$/u, "");
  if (Array.from(clean).length >= 25 && Array.from(clean).length <= 64) return clean;
  const words = clean.split(/\s+/u);
  let out = "";
  for (const word of words) {
    const candidate = out ? `${out} ${word}` : word;
    if (Array.from(candidate).length > 61) break;
    out = candidate;
  }
  if (Array.from(out).length < 25) out = `Run the ${displayName(name)} workflow safely`;
  return out;
}

function category(name) {
  if (/release|distribute|deploy|testflight|beta|production|publish/u.test(name)) return "release";
  if (/auth|account|credential|admin/u.test(name)) return "auth";
  if (/convex|migration|optimizer|performance|cost/u.test(name)) return "data";
  if (/ios|android|mobile|expo|native|notification|icon|images|ui|preview/u.test(name)) return "mobile";
  if (/audit|verify|check|doctor/u.test(name)) return "audit";
  if (/web|r2|cloud/u.test(name)) return "cloud";
  if (/architecture|tasks|prd|documentation|intercepted/u.test(name)) return "code";
  return "default";
}

function metadataFor(name, description) {
  const short = shortDescription(name, description);
  if (Array.from(short).length < 25 || Array.from(short).length > 64) throw new Error(`${name}: generated short description length is invalid`);
  return {
    display: displayName(name),
    short,
    prompt: `Use $${name} to ${short[0].toLowerCase()}${short.slice(1)}.`,
    color: ({ audit: "#059669", auth: "#2563EB", cloud: "#0284C7", code: "#7C3AED", data: "#F97316", default: "#4F46E5", mobile: "#DB2777", release: "#DC2626" })[category(name)],
    implicit: implicitAllowlist.has(name),
    tools: codexToolDependencies[name] ?? [],
  };
}

function renderMetadata(metadata) {
  const dependencies = metadata.tools.length
    ? `\ndependencies:\n  tools:\n${metadata.tools.map((tool) => `    - type: ${JSON.stringify(tool.type)}\n      value: ${JSON.stringify(tool.value)}\n      description: ${JSON.stringify(tool.description)}\n`).join("")}`
    : "";
  return `interface:\n  display_name: ${JSON.stringify(metadata.display)}\n  short_description: ${JSON.stringify(metadata.short)}\n  icon_small: "./assets/codex-icon.svg"\n  icon_large: "./assets/codex-icon.svg"\n  brand_color: ${JSON.stringify(metadata.color)}\n  default_prompt: ${JSON.stringify(metadata.prompt)}\n${dependencies}\npolicy:\n  allow_implicit_invocation: ${metadata.implicit}\n`;
}

function xmlEscape(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function renderIcon(name, metadata) {
  const icon = iconPaths[category(name)] ?? iconPaths.default;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-labelledby="title"><title id="title">${xmlEscape(metadata.display)} skill icon</title><rect width="128" height="128" rx="28" fill="${metadata.color}"/><g fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${icon}</g></svg>\n`;
}

async function skillDirectories() {
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const names = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      await readFile(path.join(skillsRoot, entry.name, "SKILL.md"));
      names.push(entry.name);
    } catch {}
  }
  return names.sort();
}

async function filesRecursively(root) {
  const out = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) out.push(...(await filesRecursively(absolute)));
    else out.push(absolute);
  }
  return out.sort();
}

async function hashSkill(skillRoot) {
  const hash = createHash("sha256");
  for (const file of await filesRecursively(skillRoot)) {
    const relative = path.relative(skillRoot, file);
    if (["agents/openai.yaml", "assets/codex-icon.svg"].includes(relative)) continue;
    hash.update(relative);
    hash.update("\0");
    hash.update(await readFile(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function roleFor(name) {
  if (helperSkills.has(name)) return "helper";
  if (referenceSkills.has(name)) return "reference";
  return "primary";
}

export function assertImportedSnapshotChange(name, previousHash, nextHash, acceptImported) {
  if (!previousHash && !acceptImported) {
    throw new Error(`${name}: imported snapshot has no reviewed lock; rerun with --accept-imported only after explicit review`);
  }
  if (previousHash && previousHash !== nextHash && !acceptImported) {
    throw new Error(`${name}: imported snapshot changed; inspect the diff and rerun with --accept-imported only after explicit review`);
  }
}

export function assertImportedCatalogChange(previousSkills, currentNames, importedNames, acceptImported) {
  const current = new Set(currentNames);
  const imported = new Set(importedNames);
  const missingDirectories = [...imported].filter((name) => !current.has(name));
  if (missingDirectories.length) {
    throw new Error(`Imported source catalog references missing skill directories: ${missingDirectories.join(", ")}`);
  }

  const removedOrReclassified = Object.entries(previousSkills ?? {})
    .filter(([, entry]) => entry.ownership === "imported")
    .map(([name]) => name)
    .filter((name) => !current.has(name) || !imported.has(name));
  if (removedOrReclassified.length && !acceptImported) {
    throw new Error(`Imported snapshot(s) removed or reclassified: ${removedOrReclassified.join(", ")}; rerun with --accept-imported only after explicit review`);
  }
}

export async function syncSkillMetadata({ check = false } = {}) {
  const names = await skillDirectories();
  const catalog = [];
  const mismatches = [];
  let previousLock = { skills: {} };
  try { previousLock = JSON.parse(await readFile(lockPath, "utf8")); } catch {}
  const acceptImported = process.argv.includes("--accept-imported");
  assertImportedCatalogChange(previousLock.skills, names, Object.keys(importedSources), acceptImported);
  for (const name of names) {
    const skillRoot = path.join(skillsRoot, name);
    const imported = Object.hasOwn(importedSources, name);
    const sha256 = await hashSkill(skillRoot);
    if (imported) assertImportedSnapshotChange(name, previousLock.skills?.[name]?.sha256, sha256, acceptImported);
    const markdown = await readFile(path.join(skillRoot, "SKILL.md"), "utf8");
    const { description } = parseFrontmatter(markdown, name);
    const metadata = metadataFor(name, description);
    const expected = {
      yaml: renderMetadata(metadata),
      icon: renderIcon(name, metadata),
    };
    const targets = [
      [path.join(skillRoot, "agents", "openai.yaml"), expected.yaml],
      [path.join(skillRoot, "assets", "codex-icon.svg"), expected.icon],
    ];
    for (const [file, content] of targets) {
      let current = null;
      try { current = await readFile(file, "utf8"); } catch {}
      if (current !== content) {
        if (check) mismatches.push(path.relative(repoRoot, file));
        else {
          await mkdir(path.dirname(file), { recursive: true });
          await writeFile(file, content);
        }
      }
    }
    catalog.push({ name, description, sha256 });
  }

  const lock = { version: 2, generated_by: "scripts/sync-skill-metadata.mjs", skills: {} };
  for (const { name, sha256 } of catalog) {
    const imported = Object.hasOwn(importedSources, name);
    const previous = previousLock.skills?.[name];
    const source = imported ? importedSources[name] : null;
    lock.skills[name] = {
      ownership: imported ? "imported" : "project-owned",
      role: roleFor(name),
      source: imported ? source.source : "repo",
      upstream_ref: imported ? source.ref : null,
      update_policy: imported ? "manual-review-required" : "project-maintained",
      ...(imported ? { reviewed_on: acceptImported ? new Date().toISOString().slice(0, 10) : previous.reviewed_on, reviewed_sha256: sha256 } : {}),
      sha256,
    };
  }
  const lockText = `${JSON.stringify(lock, null, 2)}\n`;
  let currentLock = null;
  try { currentLock = await readFile(lockPath, "utf8"); } catch {}
  if (currentLock !== lockText) {
    if (check) mismatches.push(path.relative(repoRoot, lockPath));
    else await writeFile(lockPath, lockText);
  }
  if (mismatches.length) throw new Error(`Skill metadata is stale:\n${mismatches.map((file) => `- ${file}`).join("\n")}`);
  return { skills: names.length, imported: Object.keys(importedSources).length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const unknownArgs = process.argv.slice(2).filter((arg) => !["--check", "--accept-imported"].includes(arg));
    if (unknownArgs.length) throw new Error(`Unknown option(s): ${unknownArgs.join(", ")}`);
    if (process.argv.includes("--check") && process.argv.includes("--accept-imported")) throw new Error("--check cannot be combined with --accept-imported");
    const result = await syncSkillMetadata({ check: process.argv.includes("--check") });
    console.log(`Skill metadata ${process.argv.includes("--check") ? "verified" : "synchronized"}: ${result.skills} skills (${result.imported} imported snapshots)`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
