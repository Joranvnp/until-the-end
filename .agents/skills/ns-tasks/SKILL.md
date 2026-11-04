---
name: ns-tasks
description: Slices the NowStack Mobile plan into task files. Reads `.agents/plan/PRD.md` and `ARCHITECTURE.md`, then writes ordered vertical-slice tasks with dependencies, acceptance criteria, and repo verification commands. Use after `$ns-architecture`, for `/ns tasks` or implementation planning.
disable-model-invocation: true
---

# ns-tasks

Turn the PRD and architecture into `.agents/plan/tasks/`. Ask the user nothing those documents already answer.

## Inspect

1. Read `.agents/plan/PRD.md` and `.agents/plan/ARCHITECTURE.md`. Missing: run `$ns-prd` or `$ns-architecture` and stop.
2. Confirm every path you will cite exists (`convex/`, `convex/functions.ts`, `mobile-app/app/`, `mobile-app/components/ui/`, `web-app/app/routes/`, `site-config.ts`).

## Slice

- Vertical slices of 1-3h: schema + index -> Convex function -> screen -> wire-up -> verify. Never a layer dump such as "all the schema".
- Order foundation -> core -> monetization -> polish. Record blocks / blocked-by; keep the graph acyclic.
- Coverage: every PRD must-have and every architecture table, function, and screen lands in at least one task. Fix gaps before writing.

## Write

One file per task, `.agents/plan/tasks/NN-<slug>.md`, with:

- Context: the PRD feature and ARCHITECTURE section it delivers.
- Scope: the end-to-end deliverable.
- Files to create or modify (real paths) and key functionality.
- Rules to read first: the matching `.agents/rules/*.md`, plus `convex/_generated/ai/guidelines.md` for Convex work.
- Success criteria as observable checkboxes.
- Verification, by touched surface:
  - Convex: `npx convex dev --once`
  - Mobile: `cd mobile-app && npx tsc --noEmit` (add `npm run lint` for shared UI); runtime proof via `$ns-ios-verification`
  - Web: `cd web-app && npm run typecheck`; browser proof via `dev-browser`
- Dependencies and phase.

Then `.agents/plan/tasks/README.md`: one-paragraph summary and the phased checklist with dependencies.

## Return

Report the task count and the first 1-2 tasks. Next: `$ns-plan-pricing` for a paid product, then `$ns-init-project`. Stop; do not implement.
