---
name: ns-add-documentation
description: Add or update NowStack Mobile Markdown docs in docs/ from the repo template. Use when documenting architecture, release workflows, Convex/web/mobile patterns, setup, APIs, or tooling, or via /ns docs.
disable-model-invocation: true
---

# Add Documentation - NowStack Mobile

Plain Markdown in `docs/`, grounded in real files and commands. This is not the NowStack SaaS MDX tree: no `/docs/[slug]` route, no MDX components, no SaaS org routes.

## Flow

1. Inspect: `ls docs/ docs/templates/`. Update an existing doc when one covers the topic; create a new file only when nothing fits.
2. Scope: reader (agent, developer, release operator, support), surface (`convex/`, `web-app/`, `mobile-app/`, store release, `site-config.ts`), what the reader does differently, and which command proves it is current.
3. Create from the template (kebab-case basename, writes `docs/<filename>.md` from `templates/doc-template.md`):
   ```bash
   .agents/skills/ns-add-documentation/scripts/create-doc.sh <filename> "<title>" "<description>"
   ```
4. Replace every `TODO` with real paths, exact steps, and runnable verification commands. Machine-readable examples go in `docs/templates/`.
5. Link the doc from a sibling doc, the matching `.agents/rules/*.md`, or `AGENTS.md`.

## Rules

- Every path, route, flag, and command must exist; commands match `.agents/rules/development-commands.md`.
- Convex docs state that agents read `convex/_generated/ai/guidelines.md` before editing `convex/`.
- Product, URL, auth, and payment facts come from `site-config.ts`.
- Release docs keep `asc`/`gpc`/screenshot conventions and keep store secrets out of git.

## Verify

Run only the block matching the doc's surface, each from the repo root:

```bash
npx convex dev --once                                  # Convex docs
(cd web-app && npm run typecheck && npm run build)     # web docs
(cd mobile-app && npx tsc --noEmit && npm run lint)    # mobile docs
(cd mobile-app && npm run screenshots:store -- --help) # store/screenshot docs
```

Return the doc path, where it is linked, and the checks run.
