#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webAppDir = path.resolve(scriptDir, "..");
const routesDir = path.join(webAppDir, "app", "routes");

const routeFiles = listRouteFiles(routesDir).filter(
  (file) => path.basename(file) !== "__root.tsx",
);

const failures = [];
const covered = [];
let checked = 0;

for (const file of routeFiles) {
  const sourceText = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const relativeFile = path.relative(webAppDir, file);
  const imports = collectNamedImports(sourceFile);
  const routeConfigs = findRouteConfigs(sourceFile);
  if (routeConfigs.length === 0) {
    failures.push(`${relativeFile} has no recognized createFileRoute configuration`);
    continue;
  }

  for (const config of routeConfigs) {
    checked += 1;
    const pending = findProperty(config.options, "pendingComponent");
    const routeName = config.routePath ?? path.relative(routesDir, file);

    if (!pending) {
      failures.push(`${relativeFile} (${routeName}) is missing pendingComponent`);
      continue;
    }

    if (!ts.isIdentifier(pending.initializer)) {
      failures.push(
        `${relativeFile} (${routeName}) pendingComponent must be a named Skeleton component identifier`,
      );
      continue;
    }

    const pendingName = pending.initializer.text;
    if (!pendingName.endsWith("Skeleton")) {
      failures.push(
        `${relativeFile} (${routeName}) pendingComponent "${pendingName}" must end with "Skeleton"`,
      );
      continue;
    }

    const actualSource = imports.get(pendingName);
    const expectedSource = expectedSkeletonModule(routeName);
    if (actualSource !== expectedSource) {
      failures.push(
        `${relativeFile} (${routeName}) pendingComponent "${pendingName}" must be imported from ${expectedSource}`,
      );
      continue;
    }

    covered.push(`${relativeFile} (${routeName})`);
  }
}

if (failures.length > 0) {
  console.error("Route skeleton verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Route skeleton verification passed: ${covered.length}/${checked} routes covered.`);

function listRouteFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listRouteFiles(entryPath);
    }
    if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      return [entryPath];
    }
    return [];
  });
}

function collectNamedImports(sourceFile) {
  const imports = new Map();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }
    if (!ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) {
      continue;
    }
    for (const element of namedBindings.elements) {
      imports.set(element.name.text, statement.moduleSpecifier.text);
    }
  }

  return imports;
}

function expectedSkeletonModule(routePath) {
  if (routePath === "/" || ["/privacy", "/cgv", "/support"].includes(routePath)) {
    return "@/components/skeletons/public-route-skeletons";
  }
  if (routePath === "/auth" || routePath.startsWith("/auth/")) {
    return "@/components/skeletons/auth-route-skeletons";
  }
  if (
    routePath === "/app" ||
    routePath.startsWith("/app/") ||
    routePath === "/account" ||
    routePath.startsWith("/account/")
  ) {
    return "@/components/skeletons/user-route-skeletons";
  }
  if (routePath === "/admin" || routePath.startsWith("/admin/")) {
    return "@/components/skeletons/admin-route-skeletons";
  }

  return "@/components/skeletons/public-route-skeletons";
}

function findRouteConfigs(sourceFile) {
  const configs = [];

  visit(sourceFile);
  return configs;

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const inner = node.expression;
      if (
        ts.isCallExpression(inner) &&
        ts.isIdentifier(inner.expression) &&
        inner.expression.text === "createFileRoute" &&
        node.arguments.length > 0 &&
        ts.isObjectLiteralExpression(node.arguments[0])
      ) {
        const routePath = ts.isStringLiteral(inner.arguments[0])
          ? inner.arguments[0].text
          : undefined;
        configs.push({
          routePath,
          options: node.arguments[0],
        });
      }
    }

    ts.forEachChild(node, visit);
  }
}

function findProperty(objectLiteral, name) {
  for (const property of objectLiteral.properties) {
    if (
      ts.isPropertyAssignment(property) &&
      property.name &&
      propertyNameText(property.name) === name
    ) {
      return property;
    }
  }

  return null;
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return undefined;
}
