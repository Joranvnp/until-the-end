# Development Commands

Command choices for local work.

## When this applies

- Starting servers, installing dependencies, running checks, or updating docs that mention commands.

## Rules

- **Lifecycle tasks route through the `/ns` CLI** (`.agents/skills/ns/SKILL.md`): first-run setup (`/ns onboard`), install machine CLIs (`/ns doctor`), connect accounts (`/ns accounts`), rebrand (`/ns setup`), run locally (`/ns dev`), deploy (`/ns web deploy`, `/ns ios testflight|distribute`, `/ns android beta|distribute`), release (`/ns release`). Reach for `/ns` before hand-rolling these flows.
- **Launching servers is owned by `.agents/rules/launch-app.md`** — port `3003`, port reuse, and every `start-all` variant live there. Read it instead of duplicating launch commands here.
- Root commands are for Convex backend dependencies only: `npm run dev:convex`, `npm run deploy:convex`.
- Web commands run from `web-app/`: `npm run dev` (Vite on `3003`), `npm run build`, `npm run typecheck`.
- Mobile commands run from `mobile-app/`: `npm run start`, `npm run ios`, `npm run android`, `npm run lint`.
- Validate config + secrets with `npm run check-setup`; check external accounts + CLIs with `npm run check-setup -- --accounts`.
- Use `npx convex dev --once` from repo root for a quick Convex compile/codegen check.
- Use `cd mobile-app && npx tsc --noEmit` for mobile TypeScript.
- Do not invent workspace-level package manager commands unless the repo adds workspaces.
- Keep docs aligned with the two-folder frontend shape: `web-app/` and `mobile-app/`.

## Cleanup

- **NEVER use `rm -rf`**. Use `trash <path>` for deletions.
